#!/bin/bash
# Cada minuto (cron): atiende los pedidos que deja el portal en /config — ".copia-ahora" y ".probar-drive|red".
for f in /config/.probar-drive /config/.probar-red; do
  [ -f "$f" ] && rm -f "$f" && /usr/local/bin/backup.sh --probar "${f##*-}"
done
if [ -f /config/.copia-ahora ]; then rm -f /config/.copia-ahora; /usr/local/bin/backup.sh; fi
