#!/bin/bash
# Backup semanal de InfluxDB + configuración, comprimido, con rotación, guardián de disco y copia fuera de la PC
# (Google Drive y/o carpeta compartida de la red, con rclone). Los destinos los carga el portal en
# /config/backup-destinos.json; el resultado de cada destino queda en /backups/estado-copias.json (lo lee el portal).
#   backup.sh                 copia completa
#   backup.sh --probar drive  solo prueba el destino (drive | red)
set -uo pipefail

URL="${INFLUXDB_URL:-http://frio-influxdb:8086}"
ORG="${INFLUXDB_ORG:-tecnoelectric}"
BUCKET="${INFLUXDB_BUCKET:-camaras}"
KEEP="${BACKUP_KEEP:-12}"          # cuántos backups conservar (en cada destino)
FLOOR="${DISK_FLOOR_GB:-15}"       # piso de espacio libre (GB)
LOCAL=/backups
CONFIG=/config
DESTINOS="$CONFIG/backup-destinos.json"
ESTADO="$LOCAL/estado-copias.json"
EXTERNAL="${BACKUP_EXTERNAL:-}"    # segundo destino montado en el contenedor (opcional, de antes)
STAMP="$(date +%Y-%m-%d)"

log()    { echo "[$(date '+%F %T')] $*"; }
freeGB() { df -PBG "$1" 2>/dev/null | awk 'NR==2{gsub("G","",$4); print $4+0}'; }
prune()  { local d="$1"; ls -1t "$d"/frio-backup-*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | while read -r f; do log "podar $f"; rm -f "$f"; done; }

# estado <clave> <true|false> <detalle> [archivo] → estado-copias.json (ultimaOk = la última vez que salió bien)
estado() {
  local tmp; tmp="$(mktemp)"
  [ -s "$ESTADO" ] || echo '{}' > "$ESTADO"
  jq --arg k "$1" --argjson ok "$2" --arg d "$3" --arg a "${4:-}" --argjson ts "$(date +%s%3N)" \
    '(.[$k].ultimaOk // null) as $prev | .[$k] = {ts: $ts, ok: $ok, detalle: $d, archivo: $a, ultimaOk: (if $ok then $ts else $prev end)}' \
    "$ESTADO" > "$tmp" && mv "$tmp" "$ESTADO" && chmod 644 "$ESTADO"
}

# Error de rclone en palabras (el original queda en el log)
amigable() {
  case "$1" in
    *"i/o timeout"*|*"connection refused"*|*"no route to host"*|*"no such host"*) echo "No se pudo conectar con esa PC: revisá que esté prendida, en la red y con la carpeta compartida" ;;
    *"LOGON_FAILURE"*|*"logon failure"*|*"ACCESS_DENIED"*|*"access denied"*) echo "Usuario o contraseña incorrectos, o sin permiso de escritura en la carpeta" ;;
    *"BAD_NETWORK_NAME"*|*"bad network name"*) echo "No existe esa carpeta compartida en la PC" ;;
    *"invalid_grant"*|*"token expired"*|*"oauth2"*) echo "Google rechazó la conexión: volvé a conectar la cuenta de Google Drive" ;;
    *"storageQuotaExceeded"*|*"quota"*) echo "No hay espacio en Google Drive" ;;
    *) echo "$1" | tail -1 | sed 's#^[0-9/]* [0-9:]* ##' | cut -c1-200 ;;
  esac
}

dato() { jq -r "$1 // empty" "$DESTINOS" 2>/dev/null; }
activo() { [ "$(dato ".$1.activo")" = "true" ]; }

# Remote de rclone por variables de entorno (sin archivo de configuración); deja el destino "remote:ruta" en DEST.
# No llamar con $(…): las variables exportadas se perderían en el subshell.
destino() {
  case "$1" in
    drive)
      export RCLONE_CONFIG_DRIVE_TYPE=drive RCLONE_CONFIG_DRIVE_SCOPE=drive
      RCLONE_CONFIG_DRIVE_TOKEN="$(dato '.drive.token')"; export RCLONE_CONFIG_DRIVE_TOKEN
      DEST="drive:$(dato '.drive.carpeta' | sed 's#^/##')" ;;
    red)
      # ruta //servidor/carpeta/sub → host + carpeta/sub
      local ruta; ruta="$(dato '.red.ruta' | tr '\\' '/' | sed 's#^//##')"
      export RCLONE_CONFIG_RED_TYPE=smb
      RCLONE_CONFIG_RED_HOST="${ruta%%/*}"; export RCLONE_CONFIG_RED_HOST
      RCLONE_CONFIG_RED_USER="$(dato '.red.usuario')"; export RCLONE_CONFIG_RED_USER
      RCLONE_CONFIG_RED_PASS="$(rclone obscure "$(dato '.red.password')")"; export RCLONE_CONFIG_RED_PASS
      DEST="red:${ruta#*/}" ;;
  esac
}

# Sube el archivo y deja solo los KEEP más nuevos en el destino
subir() {
  local nombre="$1" archivo="$2" dest err
  destino "$nombre"; dest="$DEST"
  if err="$(rclone copy "$archivo" "$dest" --contimeout 30s --timeout 5m 2>&1)"; then
    rclone lsf "$dest" --files-only --include 'frio-backup-*.tar.gz' 2>/dev/null | sort | head -n -"$KEEP" \
      | while read -r f; do log "podar $dest/$f"; rclone deletefile "$dest/$f" 2>/dev/null; done
    log "copiado a $nombre ($dest)"; estado "$nombre" true "Copia subida" "$(basename "$archivo")"
  else
    log "ERROR al copiar a $nombre: $(echo "$err" | tail -1)"; estado "$nombre" false "$(amigable "$err")"
  fi
}

probar() {
  local nombre="$1" dest err
  destino "$nombre"; dest="$DEST"
  if err="$(rclone mkdir "$dest" --contimeout 20s 2>&1)" && err="$(rclone lsf "$dest" --max-depth 1 --contimeout 20s 2>&1)"; then
    log "prueba de $nombre OK"; estado "prueba_$nombre" true "Se pudo entrar y escribir en el destino"
  else
    log "prueba de $nombre falló: $(echo "$err" | tail -1)"; estado "prueba_$nombre" false "$(amigable "$err")"
  fi
}

if [ "${1:-}" = "--probar" ]; then
  case "${2:-}" in drive|red) probar "$2" ;; *) log "destino desconocido: ${2:-}" ;; esac
  exit 0
fi

if [ -z "${INFLUXDB_TOKEN:-}" ]; then log "ERROR: falta INFLUXDB_TOKEN"; estado local false "Falta INFLUXDB_TOKEN"; exit 1; fi
mkdir -p "$LOCAL"

# ── Guardián de disco: no dejar que se llene y tire los servicios ──
free="$(freeGB "$LOCAL")"
if [ -n "$free" ] && [ "$free" -lt "$FLOOR" ]; then
  log "ALERTA: espacio libre bajo (${free}GB < ${FLOOR}GB). Podando backups viejos…"
  prune "$LOCAL"
  free="$(freeGB "$LOCAL")"
  if [ -n "$free" ] && [ "$free" -lt "$FLOOR" ]; then
    log "CRÍTICO: sigue bajo (${free}GB). Se OMITE el backup para no llenar el disco."
    estado local false "Disco casi lleno (${free} GB libres): no se hizo la copia"
    exit 2
  fi
fi

tmp="$LOCAL/.tmp-$STAMP"
out="$LOCAL/frio-backup-$STAMP.tar.gz"
rm -rf "$tmp"; mkdir -p "$tmp"

log "backup de '$BUCKET' + configuración → $out"
if influx backup "$tmp/influx" --host "$URL" --token "$INFLUXDB_TOKEN" --org "$ORG" --bucket "$BUCKET"; then
  # La configuración (usuarios, horarios, marca, avisos) va junto: con esto se restaura todo
  if [ -d "$CONFIG" ]; then mkdir -p "$tmp/config" && find "$CONFIG" -maxdepth 1 -type f ! -name '.*' -exec cp {} "$tmp/config/" \; ; fi
  tar czf "$out" -C "$tmp" . && rm -rf "$tmp"
  log "OK: $out ($(du -h "$out" 2>/dev/null | cut -f1))"
  estado local true "Copia en el disco de esta PC ($(du -h "$out" 2>/dev/null | cut -f1))" "$(basename "$out")"
else
  log "ERROR: 'influx backup' falló"; rm -rf "$tmp"; estado local false "Falló la copia de la base de datos"; exit 1
fi

prune "$LOCAL"

# ── Fuera de la PC: Google Drive y/o carpeta compartida ──
if [ -s "$DESTINOS" ]; then
  for d in drive red; do if activo "$d"; then subir "$d" "$out"; fi; done
fi

# ── Destino montado (BACKUP_EXTERNAL, configuración vieja) ──
if [ -n "$EXTERNAL" ]; then
  if [ -d "$EXTERNAL" ]; then
    cp -f "$out" "$EXTERNAL/" && log "copiado a $EXTERNAL" && prune "$EXTERNAL"
  else
    log "AVISO: BACKUP_EXTERNAL='$EXTERNAL' no está accesible; se omite la copia externa"
  fi
fi

log "backup finalizado"
