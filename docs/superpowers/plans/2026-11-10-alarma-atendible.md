# Alarma atendible — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada alarma muestra qué hacer (texto editable por el admin) y a quién llamar (guardia del turno). El "Visto" lleva una nota opcional que ve el turno siguiente en Inicio y que sale en Telegram.

**Architecture:**
- **Servidor (`nodered/weg-api`):**
  - un módulo puro `services/guardia.js` hace la validación, el turno de ahora y la instrucción;
  - persiste en `settings.json` a través de `services/settings.js`;
  - las rutas nuevas van en el router de avisos que ya existe;
  - la nota viaja como campo `nota` de la línea `mando` del Visto en Influx.
- **Portal (`frontend-react`):**
  - un store ref-contado nuevo, `lib/guardia.ts`, con el mismo patrón que `lib/vistas.ts`;
  - componentes chicos (`QueHacer`, `ContactoGuardia`, `NovedadesTurno`) que se insertan donde ya se muestran las alarmas;
  - una pestaña nueva de Configuración.

**Tech Stack:**
- Servidor: Node 20, Express y `node:test`.
- Portal: React 18, TS, Tailwind 3, shadcn `ui/`, zustand y Vitest (solo pruebas de `lib/`, porque no hay jsdom).

**Spec:** `docs/superpowers/specs/2026-11-10-alarma-atendible-design.md`

## Global Constraints

**Base:**
- Rama `portal-hmi`, encima del rediseño HMI.
- No se agregan dependencias en ningún paquete.

**Estilo del portal (rediseño HMI):**
- Solo tokens (`var(--…)` o clases de Tailwind mapeadas a tokens); ningún color suelto.
- Sin `rounded-*` salvo `rounded-full`, sin sombras y sin emoji en la interfaz (íconos SVG de `lucide-react`, que ya está instalado).
- `html` mide 14px, así que toda medida fija va en px arbitrario: `h-[28px]`, `min-h-[44px]`.
- Táctil de 44 px como mínimo en el celular (< 768 px).
- Botón secundario con borde `--borde-campo` (3:1).
- Textos de la interfaz en castellano rioplatense, con las palabras exactas de la spec:
  - "Qué hacer:" y "Llamar a {nombre}";
  - "WhatsApp" y "Marcar como vista";
  - "Nota (opcional)" y "Visto", "Cancelar";
  - "Novedades del turno" y "Sin notas en las últimas 12 horas";
  - "Ahora no hay nadie de guardia" y "Usar la de fábrica".

**Límites:**
- Hasta 6 turnos.
- Nombre de 1 a 40 caracteres.
- Teléfono con 6 a 20 dígitos; con WhatsApp tiene que empezar con `+`.
- Instrucción de hasta 300 caracteres y 3 renglones.
- Nota de hasta 200 caracteres.
- Novedades: 12 h y 30 como máximo.
- Store de guardia cada 5 min; Novedades cada 60 s.

**Seguridad:**
- La nota es texto de usuario: en React se muestra como texto, nunca con `dangerouslySetInnerHTML`.
- En Telegram va sin `parse_mode`.
- El PUT de guardia es solo para admin y da 409 en una réplica.
- Los errores del servidor van en castellano, con `{ error }`.

**Tiempo:** la hora de planta es `ahoraMs + TZ_OFFSET_MIN·60000`, leída como UTC. `TZ_OFFSET_MIN` vale -180 por defecto, igual que `alertasCamaras.desvioRelojS`.

## Review Focus

1. **Turno que cruza la medianoche y bordes exactos:** 22:00 a 06:00 vale a las 23:59 y a las 05:59, y no a las 06:00. `desde` está incluido y `hasta` excluido. Lo prueba la Tarea 1.
2. **Nota con salto de renglón, comillas, coma o barra:**
   - la línea de Influx no se rompe;
   - el salto de renglón pasa a espacio y la nota se recorta en los extremos;
   - una nota hecha solo de espacios equivale a no tener nota.

   Lo prueba la Tarea 2.
3. **Visto de varias claves con una sola nota:** cada línea `mando` lleva la nota, y Novedades muestra una fila por línea. Lo prueba la Tarea 2.
4. **Telegram no configurado o caído al marcar un Visto desde el portal:** el Visto responde 200 igual y el error solo va al log. Lo prueba la Tarea 3.
5. **API de guardia caída o vacía:** `instruccion()` devuelve la frase de fábrica y no hay contacto. Lo prueba la Tarea 4.

---

### Tarea 1: Servicio de guardia (puro) y persistencia

**Files:**
- Create: `nodered/weg-api/src/services/guardia.js`
- Modify: `nodered/weg-api/src/services/frases.js`
  - exportar `TIPOS_ALARMA = Object.keys(ALARMAS)`.
- Modify: `nodered/weg-api/src/services/settings.js`
  - agregar `getGuardia()` y `setGuardia(p)` y exportarlas;
  - seguir el patrón de `getRepeticion` y `setRepeticion` y usar `httpError(400, msg)`.
- Test: `nodered/weg-api/test/guardia.test.js`
  - setear `CONFIG_PATH` a un directorio temporal, como en `repeticion.test.js`.

**Interfaces:**
- Produces, en `services/guardia.js`:
  - `validarGuardia(p) → { turnos, instrucciones }`
    - normaliza: recorta los textos y saca de `instrucciones` las vacías;
    - lanza `Error` con `.status = 400` y mensaje en castellano;
    - `p` sin `turnos` o sin `instrucciones` equivale a `[]` o `{}`.
  - `guardiaActual(turnos, ahoraMs, tzOffsetMin = Number(process.env.TZ_OFFSET_MIN ?? -180)) → turno | null`.
  - `instruccion(clave, instrucciones) → string | null`
    - tipo = último segmento de la clave separada por `.`;
    - si el tipo no está en `TIPOS_ALARMA`, devuelve `null`;
    - si no, `instrucciones[tipo] || frases.textoAlarma(tipo).accion`.
  - Tipo turno: `{ nombre, desde: 'HH:MM', hasta: 'HH:MM', telefono, whatsapp: boolean }`.
- Produces, en `services/settings.js`:
  - `getGuardia() → { turnos, instrucciones }`; con el archivo vacío devuelve `{ turnos: [], instrucciones: {} }`;
  - `setGuardia(p) → getGuardia()`: valida con `validarGuardia` y lo guarda en `settings.json`, clave `guardia`.

- [ ] **Paso 1: escribir las pruebas que fallan**

```js
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
```

- [ ] **Paso 2:** `cd nodered/weg-api && node --test test/guardia.test.js`. Esperado: FALLA, porque el módulo no existe.
- [ ] **Paso 3: implementar `guardia.js`, `TIPOS_ALARMA` y `getGuardia`/`setGuardia`.**
  - **Solapes:** pasar cada turno a minutos `[d, h)`. Si `h <= d`, se parte en `[d, 1440)` y `[0, h)`. Después se compara cada par de intervalos.
  - **Mensajes:**
    - "Dos turnos se pisan: {a} y {b}";
    - "El teléfono de WhatsApp tiene que empezar con + y el código de país";
    - "Desde y hasta tienen que ser distintos";
    - "Hasta 6 turnos";
    - "Instrucción de {tipo}: hasta 300 caracteres";
    - "Instrucción de {tipo}: hasta 3 renglones";
    - "Tipo de alarma desconocido: {k}".
- [ ] **Paso 4:** `node --test`. Esperado: toda la suite pasa.
- [ ] **Paso 5:** commit "Guardia: turnos, instrucciones y turno de ahora (servidor)".

### Tarea 2: Nota del Visto y Novedades (servidor)

**Files:**
- Modify: `nodered/weg-api/src/services/mando.js`
  - `lineaMando` acepta `nota` como opcional y agrega `nota=<escStr>` solo si es un string no vacío.
- Modify: `nodered/weg-api/src/services/camaras.js`
  - `parseMando` devuelve `nota: o.nota ?? ''`;
  - si hay nota, `accion` y `texto` le agregan ` · Nota: {nota}` al final. Así E1 y los reportes muestran la nota sin otro cambio.
- Modify: `nodered/weg-api/src/services/alertasCamaras.js`
  - `marcarVistas(memoria, claves, usuario, ahoraMs, nota)` guarda `visto: { usuario, ts, nota }`, con `nota` solo si viene;
  - `reconocer(claves, usuario, ahoraMs, nota)` la pasa.
- Create: `nodered/weg-api/src/services/novedades.js`
  - `limpiarNota(x) → string | null`;
  - `novedades(maniobras, ahoraMs) → [{ ts, usuario, texto, nota, camara }]`.
- Modify: `nodered/weg-api/src/routes/avisos.js`
  - `POST /visto` acepta `nota`, la limpia y llama a `marcarVisto(claves, usuario, nota)`;
  - `GET /novedades` usa `getNovedades()`, que se inyecta.
- Modify: `nodered/weg-api/src/server.js`
  - `marcarVisto(claves, usuario, nota)` pasa `nota` a `reconocer` y a `lineaMando`;
  - inyecta `getNovedades`, que hace `queryCsv(fluxMando({ desde: now - 12h, hasta: now }))`, después `parseMando` y después `novedades`.
- Test: `nodered/weg-api/test/novedades.test.js` y casos nuevos en `test/mando.test.js`, `test/alertasCamaras.test.js` y `test/avisosPrueba.test.js`.

**Interfaces:**
- Produces:
  - `limpiarNota(x)`:
    - si `x` no es string, o queda vacío al recortarlo, devuelve `null`;
    - si no, cambia `\r?\n` por espacio y recorta;
    - **no** corta en 200: la ruta valida el largo antes y responde 400.
  - `novedades(maniobras, ahoraMs)`:
    - filtra `comando === 'visto'`, `nota` no vacía y `ts >= ahoraMs - 12*3600000`;
    - ordena del más nuevo al más viejo y devuelve 30 como máximo;
    - `texto` es la `accion` **sin** el sufijo de la nota, o sea el texto original de `lineaMando`.
  - `GET /api/avisos/activas` devuelve `visto.nota` cuando existe.
  - El router recibe una opción nueva, `getNovedades = async () => []`.
  - `marcarVisto(claves, usuario, nota)` devuelve `[{ clave, texto }]`, como hoy.
- Consumes: nada de la Tarea 1.

- [ ] **Paso 1: escribir las pruebas que fallan**

```js
// mando.test.js
test('lineaMando: nota con coma, comillas, barra y salto queda en una línea', () => {
  const l = lineaMando({ usuario: 'ana', camara: 'C4', comando: 'visto', destino: 0, anterior: null, valor: 0, resultado: 1, motivo: 0,
    texto: 'Vio la alarma: x', respuesta: '', ts: 1, nota: 'llamé, "Juan"\\ viene\na las 16' });
  assert.equal(l.split('\n').length, 1);
  assert.match(l, /nota="llamé, \\"Juan\\"\\\\ viene a las 16"/);
  assert.doesNotMatch(lineaMando({ usuario: 'a', camara: 'C4', comando: 'visto', destino: 0, anterior: null, valor: 0, resultado: 1, motivo: 0, texto: 't', respuesta: '', ts: 1 }), /nota=/);
});
// novedades.test.js
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
// alertasCamaras.test.js
test('marcarVistas guarda la nota y activas la devuelve', () => { /* memoria con una activa → marcarVistas(..., 'llamé') → activas(m)[0].visto.nota === 'llamé' */ });
// avisosPrueba.test.js
test('avisos/visto: nota de 201 → 400; nota de espacios → marcarVisto recibe null; GET /novedades', async () => { /* … */ });
```

- [ ] **Paso 2:** `node --test`. Esperado: FALLAN las nuevas.
- [ ] **Paso 3: implementar.**
  - Mensaje del 400: "Nota: hasta 200 caracteres".
  - En la ruta: `nota !== undefined && typeof nota !== 'string'` da 400 "Nota inválida". Se controla el largo y después se aplica `limpiarNota`.
- [ ] **Paso 4:** `node --test`. Esperado: toda la suite pasa.
- [ ] **Paso 5:** commit "Visto con nota y Novedades del turno (servidor)".

### Tarea 3: API de guardia y textos de Telegram

**Files:**
- Modify: `nodered/weg-api/src/routes/avisos.js`
  - `GET /guardia` devuelve `{ turnos, instrucciones, actual }`, con `actual = guardiaActual(turnos, ahora())`;
  - `PUT /guardia` va con `requireAdmin`. En una réplica responde 409 "La guardia se configura en la planta". Si no, llama a `setGuardia(req.body)` y responde lo mismo que el GET. Un error con `.status` responde ese status y `{ error: e.message }`;
  - `POST /visto`, con cambiadas, llama a `avisarVisto(usuario, cambiadas, nota)` sin esperarla (`.catch` va a `console.error`).
- Create: funciones puras en `nodered/weg-api/src/services/guardia.js`
  - `textoVisto(usuario, texto, nota) → string`;
  - `textoAvisoAlarmas(items, { instruccion, guardia }) → string`.
- Modify: `nodered/weg-api/src/services/alertasCamaras.js`
  - `tick` arma el mensaje con `textoAvisoAlarmas(r.items, { instruccion: (c) => guardia.instruccion(c, settings.getGuardia().instrucciones), guardia: guardia.guardiaActual(settings.getGuardia().turnos, ahora) })`;
  - el historial (`addHistory`) sigue guardando `it.texto` sin cambios.
- Modify: `nodered/weg-api/src/services/telegramBot.js`
  - el aviso después del botón pasa a usar `textoVisto(nombre, c.texto)`.
- Modify: `nodered/weg-api/src/server.js`
  - el router recibe `getGuardia: settings.getGuardia`, `setGuardia: settings.setGuardia` y `avisarVisto`;
  - `avisarVisto` manda `textoVisto(usuario, c.texto, nota)` por cada cambiada con `alerts.notifyCanal('telegram', …)`, solo si `alerts.telegramConfigurado()`.
- Test: `nodered/weg-api/test/guardia.test.js` y `test/avisosPrueba.test.js`. Para PUT, extender el helper `servir` con un tercer argumento `method`.

**Interfaces:**
- Consumes: de la Tarea 1, `guardiaActual`, `instruccion`, `getGuardia` y `setGuardia`; de la Tarea 2, la ruta `/visto` con `nota`.
- Produces:
  - `GET /api/avisos/guardia` → `{ turnos: Turno[], instrucciones: Record<string,string>, actual: Turno | null }`;
  - `PUT /api/avisos/guardia` con cuerpo `{ turnos, instrucciones }` y la misma respuesta.
  - Opciones nuevas del router: `getGuardia = () => ({ turnos: [], instrucciones: {} })`, `setGuardia`, `avisarVisto = async () => {}` y `ahora` (que ya existe).

- [ ] **Paso 1: escribir las pruebas que fallan**

```js
test('textoVisto', () => {
  assert.equal(textoVisto('Pedro', 'C4 G2: resistencia'), '👀 Pedro vio: C4 G2: resistencia');
  assert.equal(textoVisto('Pedro', 'x', 'llamé a Juan'), '👀 Pedro vio: x — Nota: llamé a Juan');
});
test('textoAvisoAlarmas: qué hacer debajo de cada alarma, guardia al final solo si hay alarma', () => {
  const items = [{ clave: 'C4.G2.alarma_res', texto: '🚨 C4 G2: resistencia', alarma: true }, { clave: 'com', texto: '🚨 PLC sin comunicacion', alarma: true }];
  const ins = (c) => (c === 'com' ? null : 'Llamar a Juan');
  const g = { nombre: 'Juan', desde: '06:00', hasta: '14:00', telefono: '+598 99 1', whatsapp: true };
  assert.equal(textoAvisoAlarmas(items, { instruccion: ins, guardia: g }),
    '🚨 C4 G2: resistencia\n   Qué hacer: Llamar a Juan\n🚨 PLC sin comunicacion\nGuardia: Juan (06:00–14:00) +598 99 1');
  assert.equal(textoAvisoAlarmas([{ clave: 'x', texto: '✅ resuelto: y' }], { instruccion: ins, guardia: g }), '✅ resuelto: y');
  assert.equal(textoAvisoAlarmas(items.slice(1), { instruccion: ins, guardia: null }), '🚨 PLC sin comunicacion');
});
test('avisos/guardia: GET con actual; PUT operador 403, réplica 409, inválido 400, ok', async () => { /* … */ });
test('avisos/visto: avisarVisto que falla no rompe el 200', async () => {
  const router = createAvisosRouter({ notifyCanal: async () => {}, marcarVisto: async (c) => c.map((clave) => ({ clave, texto: 't' })),
    avisarVisto: async () => { throw new Error('caído') } });
  /* POST /visto {claves:['C4.alarma_manual'], nota:'n'} → 200 */
});
```

Para instrucciones de varios renglones, cada renglón extra va indentado con tres espacios: `'   Qué hacer: ' + ins.split('\n').join('\n   ')`.

- [ ] **Paso 2:** `node --test`. Esperado: FALLAN las nuevas.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** `node --test`. Esperado: toda la suite pasa.
- [ ] **Paso 5:** commit "Guardia por API y Telegram con qué hacer, guardia y nota".

### Tarea 4: Stores del portal (guardia y Visto con nota)

**Files:**
- Create: `frontend-react/src/lib/guardia.ts` y `frontend-react/src/lib/guardia.test.ts`.
- Modify: `frontend-react/src/lib/vistas.ts`
  - `Visto` suma `nota?: string`;
  - `marcar(claves: string[], nota?: string)` manda `{ claves, nota }` y omite `nota` si está vacía.

**Interfaces:**
- Produces, en `lib/guardia.ts`:
  - `export interface Turno { nombre: string; desde: string; hasta: string; telefono: string; whatsapp: boolean }`
  - `export interface Guardia { turnos: Turno[]; instrucciones: Record<string, string>; actual: Turno | null }`
  - `export const guardiaStore`, un store de zustand con `{ guardia: Guardia }`, que arranca en `{ turnos: [], instrucciones: {}, actual: null }`.
  - `export function activarGuardia(): () => void`
    - ref-contado;
    - el primero pide `GET /avisos/guardia` (con `apiJson`) y arranca un `setInterval` de 300000 ms;
    - si falla, deja el estado como estaba.
  - `export function useGuardia(activo = true): Guardia`
  - `export async function recargarGuardia(): Promise<void>`, que usa la pestaña después del PUT.
  - `export function instruccion(clave: string, instrucciones: Record<string, string> | undefined): string | undefined`
    - tipo = último segmento;
    - devuelve `instrucciones?.[tipo] || textoAlarma(clave).accion`.
  - `export function telHref(t: string): string`: `tel:` más el teléfono sin espacios ni guiones, conservando el `+`.
  - `export function waHref(t: string): string`: `https://wa.me/` más solo los dígitos.

- [ ] **Paso 1: escribir las pruebas que fallan**

```ts
test('instruccion: admin, fábrica, sin datos de la API', () => {
  expect(instruccion('C4.G2.alarma_res', { alarma_res: 'Llamar a Juan' })).toBe('Llamar a Juan')
  expect(instruccion('C4.G2.alarma_res', {})).toBe('avisar al técnico para revisar la resistencia')
  expect(instruccion('C4.G2.alarma_res', undefined)).toBe('avisar al técnico para revisar la resistencia')
})
test('enlaces de contacto', () => {
  expect(telHref('+598 99-123 456')).toBe('tel:+59899123456')
  expect(waHref('+598 99-123 456')).toBe('https://wa.me/59899123456')
})
test('marcar manda la nota y la omite si está vacía', async () => {
  // vi.mock('./api') → apiJson espía; marcar(['a'], 'n') → body {claves:['a'],nota:'n'}; marcar(['a'], '') → body {claves:['a']}
})
```

- [ ] **Paso 2:** `cd frontend-react && npx vitest run src/lib/guardia.test.ts src/lib/vistas.test.ts`. Esperado: FALLA.
- [ ] **Paso 3:** implementar `lib/guardia.ts`, copiando la forma de `activarVistas`/`useVistas`, y el cambio en `vistas.ts`.
- [ ] **Paso 4:** `npx vitest run` y `npm run build`. Esperado: todo en verde.
- [ ] **Paso 5:** commit "Portal: store de guardia y Visto con nota".

### Tarea 5: Qué hacer, contacto, Visto con nota y Novedades (portal)

**Files:**
- Create: `frontend-react/src/components/QueHacer.tsx`
  - `QueHacer({ clave, compacto }: { clave: string; compacto?: boolean })`;
  - muestra **"Qué hacer:"** en negrita y la instrucción en `text-texto`;
  - `compacto` (la banda): una línea con `truncate` y `title` con el texto completo; si no, `whitespace-pre-line`;
  - incluye `ContactoGuardia`.
- Create: `frontend-react/src/components/ContactoGuardia.tsx`
  - `ContactoGuardia({ compacto }: { compacto?: boolean })`;
  - si `useGuardia().actual` es null, no muestra nada;
  - "Llamar a {nombre}" con `<a href={telHref}>` y el ícono `Phone`;
  - "WhatsApp" con `<a href={waHref} target="_blank" rel="noreferrer">` y el ícono `MessageCircle`, solo si `whatsapp` es true y no es `compacto`;
  - con borde `--borde-campo`, `min-h-[44px]` en el celular y `h-[24px]` en compacto.
- Modify: `frontend-react/src/components/marco/BandaAlarmas.tsx`
  - reemplazar el `· {g.accion}` gris por `<QueHacer clave={g.claves[0]} compacto />`.
- Modify: `frontend-react/src/components/marco/AvisoAlarmaCelular.tsx`
  - sacar `g.accion` del renglón gris y agregar `<QueHacer clave={g.claves[0]} />` debajo.
- Modify: `frontend-react/src/components/PanelAlarmas.tsx`
  - reemplazar `{a.accion && <span>…}` por `<QueHacer clave={a.clave} />` en su propio renglón.
- Modify: `frontend-react/src/components/BotonVisto.tsx`
  - abre el `Dialog` de `ui/dialog`: título "Marcar como vista", el texto de la alarma (prop nueva `texto?: string`) y un `Input` "Nota (opcional)" con `maxLength={200}` y contador `n/200`;
  - "Visto" (primario, `type="submit"`) y "Cancelar";
  - al enviar llama a `marcar(pendientes, nota.trim() || undefined)`;
  - `marcar` pasa a tener el tipo `(c: string[], nota?: string) => Promise<void>`;
  - "Vista por {usuario} a las {hh:mm}" suma ` — {nota}` en `text-texto-2` cuando existe.
- Modify: los que usan `BotonVisto` (BandaAlarmas, AvisoAlarmaCelular, PanelAlarmas e Historial) para pasarle `texto`, que es el título del grupo o de la alarma.
- Create: `frontend-react/src/components/NovedadesTurno.tsx`
  - es un `Panel` "Novedades del turno";
  - pide `GET /avisos/novedades` al montarse, cada 60000 ms y cada vez que cambia `vistasStore` (con `vistasStore.subscribe`);
  - cada fila: hora en `font-mono` (`hhmm` de `lib/camaras`), usuario, texto y, en un renglón propio, la nota;
  - si la lista está vacía: "Sin notas en las últimas 12 horas".
- Modify: `frontend-react/src/views/General.tsx`
  - `<NovedadesTurno />` va debajo del bloque `data-tour="eventos"`.

**Interfaces:**
- Consumes: de la Tarea 4, `useGuardia`, `instruccion`, `telHref`, `waHref` y `marcar(claves, nota?)`; de la Tarea 2, `GET /api/avisos/novedades` → `[{ ts, usuario, texto, nota, camara }]`.
- Produces: `QueHacer` y `ContactoGuardia` (la Tarea 6 no los usa).

- [ ] **Paso 1:** implementar los componentes. No hay pruebas de componentes, porque no hay jsdom. La lógica ya está probada en la Tarea 4.
- [ ] **Paso 2:** `rg -n "dangerouslySetInnerHTML|rounded-(?!full)|#[0-9a-fA-F]{3,6}\b" src/components/QueHacer.tsx src/components/ContactoGuardia.tsx src/components/NovedadesTurno.tsx src/components/BotonVisto.tsx`. Esperado: sin resultados.
- [ ] **Paso 3:** `npx vitest run` y `npm run build`. Esperado: todo en verde.
- [ ] **Paso 4:** commit "Portal: qué hacer, contacto de guardia, Visto con nota y Novedades del turno".

### Tarea 6: Configuración › Guardia

**Files:**
- Create: `frontend-react/src/views/GuardiaTab.tsx`
- Modify: `frontend-react/src/views/Config.tsx`
  - agregar `<TabsTrigger value="guardia">Guardia</TabsTrigger>` y su `TabsContent`, en todas las instancias, después de Telegram;
  - aceptar `?tab=guardia` en el `defaultValue`.
- Modify: `frontend-react/src/lib/frases.ts`
  - exportar `TIPOS_ALARMA = Object.keys(ALARMAS)`, para listar las filas.

**Interfaces:**
- Consumes: de la Tarea 4, `useGuardia`, `recargarGuardia`, `Turno` y `textoAlarma`; de la Tarea 3, `PUT /api/avisos/guardia`.
- Produces: nada.

**Comportamiento:**
- **Borrador:** copia local de `turnos` y de `instrucciones`.
- **Tabla de turnos:**
  - columnas: nombre (`Input`), desde y hasta (`<Input type="time">`), teléfono (`Input type="tel"`), WhatsApp (`Switch`) y quitar;
  - "Agregar turno", deshabilitado con 6 turnos.
- **Debajo de la tabla:** "Ahora: {nombre} ({desde}–{hasta})" o "Ahora no hay nadie de guardia", según `actual`.
- **"Qué hacer con cada alarma":**
  - por cada `TIPOS_ALARMA`, una fila con `textoAlarma(tipo).texto` con mayúscula inicial;
  - un `<textarea rows={3} maxLength={300}>` con `placeholder` igual a la frase de fábrica;
  - "Usar la de fábrica", que vacía el campo.
- **"Guardar":**
  - hace `apiJson('/avisos/guardia', { method: 'PUT', body })`;
  - si sale bien: `toast.success('Guardia guardada')` y `recargarGuardia()`;
  - si falla: `toast.error(e.message)` y el borrador queda como estaba.

- [ ] **Paso 1:** implementar.
- [ ] **Paso 2:** `npx vitest run` y `npm run build`. Esperado: todo en verde.
- [ ] **Paso 3:** commit "Portal: pestaña Guardia en Configuración".

### Tarea 7: Despliegue en WSL y revisión visual (controlador)

- [ ] Hacer `git pull` de `portal-hmi` en `/home/walc72/frio-scada`.
- [ ] Reconstruir `weg-api` con `docker compose up -d --build weg-api`, o el nombre del servicio que figure en `docker-compose.yml`.
- [ ] Compilar el frontend con el comando de build en Docker que está en el ledger del HMI.
- [ ] Con el usuario ya logueado en el panel del navegador:
  - cargar 2 turnos, uno de ellos nocturno, y una instrucción de 3 renglones;
  - con una alarma del mock: banda a 1280×800 y aviso a 390×844, en claro y en oscuro;
  - marcar Visto con nota y comprobar que aparece en Novedades, en E1 y en el chat de Telegram de prueba.
- [ ] Mandar las capturas al usuario.
