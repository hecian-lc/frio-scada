'use strict';
// Novedades del turno: las notas que dejó la gente al marcar una alarma como vista (últimas 12 h).

const VENTANA_MS = 12 * 3600000;
const MAX = 30;

// string sin saltos de línea, o null si no es texto o queda vacío. El largo lo valida la ruta (400).
function limpiarNota(x) {
  if (typeof x !== 'string' || !x.trim()) return null;
  return x.replace(/\r?\n/g, ' ').trim();
}

// maniobras: salida de parseMando (su accion lleva el sufijo " · Nota: …", que acá se quita).
function novedades(maniobras, ahoraMs) {
  return maniobras.filter((m) => m.comando === 'visto' && m.nota && m.ts >= ahoraMs - VENTANA_MS)
    .sort((a, b) => b.ts - a.ts).slice(0, MAX)
    .map((m) => ({ ts: m.ts, usuario: m.usuario, texto: m.accion.slice(0, m.accion.length - ` · Nota: ${m.nota}`.length), nota: m.nota, camara: m.camara }));
}

module.exports = { limpiarNota, novedades };
