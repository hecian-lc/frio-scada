'use strict';

// Copias de seguridad fuera de la PC (Google Drive y carpeta compartida de la red). El portal guarda los destinos en
// config/backup-destinos.json y deja pedidos (.copia-ahora, .probar-drive|red) que frio-backup atiende cada minuto;
// frio-backup escribe el resultado en backups/estado-copias.json.

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.dirname(process.env.CONFIG_PATH || '/app/config/config.json');
const BACKUP_DIR = process.env.BACKUP_DIR || '/app/backups';
const ARCHIVO = () => path.join(CONFIG_DIR, 'backup-destinos.json');
const httpError = (status, msg) => Object.assign(new Error(msg), { status });
const DESTINOS = ['drive', 'red'];

function leer() {
  try { return JSON.parse(fs.readFileSync(ARCHIVO(), 'utf8')) || {}; } catch { return {}; }
}
function escribir(d) {
  const tmp = `${ARCHIVO()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, ARCHIVO());
}

// Sin secretos (token de Drive, contraseña de la carpeta)
function getPublic() {
  const d = leer();
  const dr = d.drive || {}, rd = d.red || {};
  return {
    drive: { activo: !!dr.activo, carpeta: dr.carpeta || 'frio-scada-copias', conectado: !!dr.token },
    red: { activo: !!rd.activo, ruta: rd.ruta || '', usuario: rd.usuario || '', hasPassword: !!rd.password },
  };
}

const RUTA_RE = /^(\\\\|\/\/)[\w.-]+[\\/][^\\/:*?"<>|]+([\\/][^:*?"<>|]*)?$/; // \\servidor\carpeta[\sub]
const CARPETA_RE = /^[\w .\-/]{1,100}$/;

// patch: { drive?: {activo?, token?, carpeta?}, red?: {activo?, ruta?, usuario?, password?} }; '' en token/password = no cambiar
function set(patch) {
  const p = (patch && typeof patch === 'object') ? patch : {};
  const d = leer();
  if (p.drive !== undefined) {
    const b = p.drive || {}; const cur = { ...(d.drive || {}) };
    if (b.token !== undefined && b.token !== '') {
      let t;
      try { t = JSON.parse(String(b.token).trim()); } catch { throw httpError(400, 'El texto de Google no es válido: pegá todo lo que devolvió rclone, desde { hasta }'); }
      if (!t || !t.refresh_token || !t.access_token) throw httpError(400, 'Falta el refresh_token: volvé a correr rclone authorize "drive"');
      cur.token = JSON.stringify(t);
    }
    if (b.carpeta !== undefined) {
      const c = String(b.carpeta).trim();
      if (!CARPETA_RE.test(c)) throw httpError(400, 'Carpeta de Drive inválida (letras, números, espacios, - _ . /)');
      cur.carpeta = c;
    }
    if (b.activo !== undefined) {
      if (typeof b.activo !== 'boolean') throw httpError(400, 'activo: sí o no');
      if (b.activo && !cur.token) throw httpError(400, 'Primero conectá la cuenta de Google Drive');
      cur.activo = b.activo;
    }
    d.drive = { carpeta: 'frio-scada-copias', ...cur };
  }
  if (p.red !== undefined) {
    const b = p.red || {}; const cur = { ...(d.red || {}) };
    if (b.ruta !== undefined) {
      const r = String(b.ruta).trim();
      if (r && !RUTA_RE.test(r)) throw httpError(400, 'Ruta inválida: tiene que ser como \\\\SERVIDOR\\Carpeta');
      cur.ruta = r;
    }
    if (b.usuario !== undefined) cur.usuario = String(b.usuario).trim().slice(0, 100);
    if (b.password !== undefined && b.password !== '') cur.password = String(b.password).slice(0, 200);
    if (b.activo !== undefined) {
      if (typeof b.activo !== 'boolean') throw httpError(400, 'activo: sí o no');
      if (b.activo && !cur.ruta) throw httpError(400, 'Primero cargá la ruta de la carpeta');
      cur.activo = b.activo;
    }
    d.red = cur;
  }
  escribir(d);
  return getPublic();
}

// Pedido para frio-backup: 'ahora' o 'probar-drive' | 'probar-red'
function pedir(que) {
  if (que !== 'ahora' && !DESTINOS.some((x) => que === `probar-${x}`)) throw httpError(400, 'Pedido inválido');
  fs.writeFileSync(path.join(CONFIG_DIR, que === 'ahora' ? '.copia-ahora' : `.${que}`), String(Date.now()));
}

// { local, drive, red, prueba_drive, prueba_red } con { ts, ok, detalle, archivo, ultimaOk } (lo que escribió frio-backup)
function estado() {
  try { return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'estado-copias.json'), 'utf8')) || {}; } catch { return {}; }
}

// Avisos (pura): falla nueva de un destino activo, o más de `maxDias` sin una copia buena en un destino activo.
// avisados: Set de claves ya avisadas (se devuelve el nuevo). destinos: getPublic().
const NOMBRE = { local: 'en esta PC', drive: 'en Google Drive', red: 'en la carpeta de red' };
function avisos(est, destinos, ahora, avisados = new Set(), maxDias = 8) {
  const activos = ['local', ...DESTINOS.filter((x) => destinos[x] && destinos[x].activo)];
  const textos = []; const nuevos = new Set();
  for (const k of activos) {
    const e = est[k];
    if (e && e.ok === false) {
      const clave = `falla:${k}:${e.ts}`; nuevos.add(clave);
      if (!avisados.has(clave)) textos.push(`💾 Falló la copia de seguridad ${NOMBRE[k]}: ${e.detalle}`);
    }
    const ultima = e ? e.ultimaOk : null;
    if (ultima != null && ahora - ultima > maxDias * 864e5) {
      const clave = `vieja:${k}:${ultima}`; nuevos.add(clave);
      if (!avisados.has(clave)) textos.push(`💾 Hace más de ${maxDias} días que no hay una copia de seguridad buena ${NOMBRE[k]}`);
    }
  }
  return { textos, avisados: nuevos };
}

let timer = null;
function start(notify) {
  let avisados = null; // la primera pasada solo aprende lo que ya estaba (no avisa fallas viejas al arrancar)
  const tick = async () => {
    const r = avisos(estado(), getPublic(), Date.now(), avisados || new Set());
    if (avisados) for (const t of r.textos) await notify(t).catch(() => {});
    avisados = r.avisados;
  };
  tick();
  timer = setInterval(tick, 10 * 60e3);
  if (timer.unref) timer.unref();
}

module.exports = { getPublic, set, pedir, estado, avisos, start };
