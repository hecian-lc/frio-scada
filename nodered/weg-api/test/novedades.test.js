'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { limpiarNota, novedades } = require('../src/services/novedades');

test('limpiarNota: espacios = sin nota, salto a espacio', () => {
  assert.equal(limpiarNota('   '), null); assert.equal(limpiarNota(3), null); assert.equal(limpiarNota(' a\nb '), 'a b');
});

test('novedades: solo vistos con nota de las últimas 12 h, más nueva primero, una fila por línea', () => {
  const now = 100 * 3600000;
  const m = (ts, comando, nota) => ({ ts, comando, nota, usuario: 'ana', accion: nota ? `Vio la alarma: x · Nota: ${nota}` : 'Vio la alarma: x', camara: 'C4' });
  const r = novedades([m(now - 13 * 3600000, 'visto', 'vieja'), m(now - 1000, 'visto', 'a'), m(now - 999, 'visto', 'a'), m(now - 500, 'visto', ''), m(now - 10, '1', 'z')], now);
  assert.deepEqual(r.map((x) => x.ts), [now - 999, now - 1000]);
  assert.equal(r[0].texto, 'Vio la alarma: x');
});

test('novedades: como máximo 30', () => {
  const now = 100 * 3600000;
  const lista = Array.from({ length: 40 }, (_, i) => ({ ts: now - i, comando: 'visto', nota: 'n', usuario: 'a', accion: 'T · Nota: n', camara: 'C4' }));
  assert.equal(novedades(lista, now).length, 30);
});
