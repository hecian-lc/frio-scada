'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'copias-'));
process.env.CONFIG_PATH = path.join(DIR, 'config.json');
process.env.BACKUP_DIR = path.join(DIR, 'backups');
fs.mkdirSync(process.env.BACKUP_DIR);

const test = require('node:test');
const assert = require('node:assert/strict');
const copias = require('../src/services/copias');

const TOKEN = JSON.stringify({ access_token: 'a', token_type: 'Bearer', refresh_token: 'r', expiry: '2026-01-01T00:00:00Z' });

test('destinos: por defecto apagados; Drive necesita token; la carpeta de red se valida; no se devuelven secretos', () => {
  assert.deepEqual(copias.getPublic(), {
    drive: { activo: false, carpeta: 'frio-scada-copias', conectado: false },
    red: { activo: false, ruta: '', usuario: '', hasPassword: false },
  });
  assert.throws(() => copias.set({ drive: { activo: true } }), /Primero conectá la cuenta/);
  assert.throws(() => copias.set({ drive: { token: 'hola' } }), /no es válido/);
  assert.throws(() => copias.set({ drive: { token: '{"access_token":"a"}' } }), /refresh_token/);
  const d = copias.set({ drive: { token: `  ${TOKEN}\n`, activo: true, carpeta: 'Copias/Planta' } }).drive;
  assert.deepEqual(d, { activo: true, carpeta: 'Copias/Planta', conectado: true });
  assert.throws(() => copias.set({ red: { ruta: 'C:/copias' } }), /Ruta inválida/);
  assert.throws(() => copias.set({ red: { activo: true } }), /Primero cargá la ruta/);
  const r = copias.set({ red: { ruta: String.raw`\\PC-OFICINA\Copias\frio`, usuario: 'copias', password: 'secreta', activo: true } }).red;
  assert.deepEqual(r, { activo: true, ruta: String.raw`\\PC-OFICINA\Copias\frio`, usuario: 'copias', hasPassword: true });
  copias.set({ red: { password: '' } }); // vacío = no cambiar
  const guardado = JSON.parse(fs.readFileSync(path.join(DIR, 'backup-destinos.json'), 'utf8'));
  assert.equal(guardado.red.password, 'secreta');
  assert.equal(JSON.parse(guardado.drive.token).refresh_token, 'r');
  assert.equal(JSON.stringify(copias.getPublic()).includes('secreta') || JSON.stringify(copias.getPublic()).includes('refresh'), false);
});

test('pedidos: dejan el archivo para frio-backup; otro pedido 400', () => {
  copias.pedir('ahora');
  copias.pedir('probar-drive');
  assert.ok(fs.existsSync(path.join(DIR, '.copia-ahora')));
  assert.ok(fs.existsSync(path.join(DIR, '.probar-drive')));
  assert.throws(() => copias.pedir('probar-../x'), /Pedido inválido/);
});

test('estado: lee lo que escribió frio-backup', () => {
  fs.writeFileSync(path.join(process.env.BACKUP_DIR, 'estado-copias.json'), JSON.stringify({ local: { ts: 1, ok: true, ultimaOk: 1 } }));
  assert.deepEqual(copias.estado(), { local: { ts: 1, ok: true, ultimaOk: 1 } });
});

test('avisos: falla nueva de un destino activo una sola vez; copia vieja > 8 días; destinos apagados no avisan', () => {
  const D = 864e5, ahora = 100 * D;
  const dest = { drive: { activo: true }, red: { activo: false } };
  const est = { local: { ts: ahora, ok: true, ultimaOk: ahora }, drive: { ts: ahora, ok: false, detalle: 'token vencido', ultimaOk: ahora - 9 * D }, red: { ts: ahora, ok: false, detalle: 'x' } };
  let r = copias.avisos(est, dest, ahora);
  assert.deepEqual(r.textos, ['💾 Falló la copia de seguridad en Google Drive: token vencido', '💾 Hace más de 8 días que no hay una copia de seguridad buena en Google Drive']);
  r = copias.avisos(est, dest, ahora + 600e3, r.avisados);
  assert.deepEqual(r.textos, []); // ya avisado
  assert.deepEqual(copias.avisos({ local: { ts: 1, ok: true, ultimaOk: ahora - D } }, dest, ahora).textos, []);
});
