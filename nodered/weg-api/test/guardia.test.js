'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'guardia-'));
process.env.CONFIG_PATH = path.join(DIR, 'config.json');

const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../src/services/settings');
const { guardiaActual, validarGuardia, instruccion } = require('../src/services/guardia');

test('guardiaActual: normal, cruza medianoche, bordes, sin turno', () => {
  const T = [{ nombre: 'Ana', desde: '06:00', hasta: '14:00', telefono: '099 1', whatsapp: false },
             { nombre: 'Noche', desde: '22:00', hasta: '06:00', telefono: '099 2', whatsapp: false }];
  const a = (hhmm) => Date.parse(`2026-11-10T${hhmm}:00Z`) + 180 * 60000; // hora de planta con offset -180
  assert.equal(guardiaActual(T, a('06:00'), -180).nombre, 'Ana');
  assert.equal(guardiaActual(T, a('13:59'), -180).nombre, 'Ana');
  assert.equal(guardiaActual(T, a('14:00'), -180), null);
  assert.equal(guardiaActual(T, a('23:59'), -180).nombre, 'Noche');
  assert.equal(guardiaActual(T, a('05:59'), -180).nombre, 'Noche');
  assert.equal(guardiaActual([], a('10:00'), -180), null);
});
test('validarGuardia: rechaza solapes, WhatsApp sin +, instrucción larga o de 4 renglones, clave desconocida, 7 turnos', () => {
  const t = (desde, hasta, extra = {}) => ({ nombre: 'X', desde, hasta, telefono: '099 123 456', whatsapp: false, ...extra });
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '14:00'), t('13:00', '20:00')] }), /pisan/);
  assert.throws(() => validarGuardia({ turnos: [t('22:00', '06:00'), t('05:00', '07:00')] }), /pisan/);
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '14:00', { whatsapp: true })] }), /código de país/);
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '06:00')] }), /distint/);
  assert.throws(() => validarGuardia({ instrucciones: { alarma_res: 'x'.repeat(301) } }), /300/);
  assert.throws(() => validarGuardia({ instrucciones: { alarma_res: 'a\nb\nc\nd' } }), /3 renglones/);
  assert.throws(() => validarGuardia({ instrucciones: { nada: 'x' } }), /desconocid/);
  assert.throws(() => validarGuardia({ turnos: Array.from({ length: 7 }, (_, i) => t(`0${i}:00`, `0${i}:30`)) }), /6/);
  assert.deepEqual(validarGuardia({ instrucciones: { alarma_res: '  ' } }), { turnos: [], instrucciones: {} });
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '14:00', { nombre: 'x'.repeat(41) })] }), /hasta 40/);
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '14:00', { telefono: '+abc', whatsapp: true })] }), /entre 6 y 20 dígitos/);
  assert.throws(() => validarGuardia({ turnos: [t('06:00', '14:00', { telefono: '12345' })] }), /entre 6 y 20 dígitos/);
  assert.throws(() => validarGuardia({ turnos: 'x' }), (e) => e.status === 400);
  assert.throws(() => validarGuardia({ instrucciones: [] }), (e) => e.status === 400);
});
test('instruccion: del admin, de fábrica, null para com/mapa', () => {
  assert.equal(instruccion('C4.G2.alarma_res', { alarma_res: 'Llamar a Juan' }), 'Llamar a Juan');
  assert.equal(instruccion('C4.G2.alarma_res', {}), 'avisar al técnico para revisar la resistencia');
  assert.equal(instruccion('com', {}), null);
});
test('settings: guardia vacía por defecto y se guarda validada', () => {
  assert.deepEqual(settings.getGuardia(), { turnos: [], instrucciones: {} });
  settings.setGuardia({ turnos: [{ nombre: ' Ana ', desde: '06:00', hasta: '14:00', telefono: '+598 99 1', whatsapp: true }] });
  assert.equal(settings.getGuardia().turnos[0].nombre, 'Ana');
  assert.throws(() => settings.setGuardia({ turnos: 'x' }), (e) => e.status === 400);
});
