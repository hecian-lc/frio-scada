# Portal estilo C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al portal la forma visual "C": tarjetas, Inter, menú azul, encabezado con estado general, Inicio con indicadores y tarjetas de cámara, Cámara con tarjetas de equipo y un aviso único de sin conexión. Todo sin tocar la API ni el mando.

**Architecture:** La forma vive en tres capas:
1. **Tokens** en `src/hmi/tokens.css` y la escala en `tailwind.config.js`.
2. **Primitivas** en `src/components/ui/` y `Panel.tsx`.
3. **Pantallas.**

Dos funciones puras nuevas en `lib/` llevan la única lógica con pruebas: el estado de la conexión y el resumen de la planta. Las vistas solo ordenan componentes y siguen leyendo el mismo store.

**Tech Stack:** React 18 + TS, Vite, Tailwind 3, shadcn/ui (Radix), zustand y lucide-react. Vitest solo para `lib/`: no hay jsdom ni pruebas de componentes. Fuentes `@fontsource/inter` y `@fontsource/jetbrains-mono`.

**Spec:** `docs/superpowers/specs/2026-11-18-portal-estilo-c-design.md`. Prototipo (fila C): https://claude.ai/artifact/5JHrrdtLSXx3Kj6NZT47B2

## Global Constraints

- **Alcance:**
  - No hay rutas de API nuevas, ni cambios en MQTT, en el store ni en el mando.
  - Las frases de `lib/frases.ts` no cambian.
- **Colores:**
  - Solo tokens: ningún color hex en `.tsx`. Excepción: los fondos de estado que ya devuelve `lib/estadoGrupo.ts` como `var(--…)`.
  - Color nunca solo: cada estado de equipo lleva ícono y texto, y la alarma lleva el cuadrado "!" y la palabra.
- **Tipografía:**
  - Letra mínima de 12 px.
  - Familias: Inter para el texto y JetBrains Mono para horas y números, servidas desde el bundle. Nada de Google Fonts.
  - Números siempre en `font-mono`, alineados a la derecha en las tablas, con su unidad.
  - `html { font-size: 16px }`.
- **Forma:**
  - Tarjetas `rounded-[14px]`, botones y campos `rounded-[10px]`.
  - Sombra de tarjeta `0 1px 2px rgba(16,24,40,.06)` y borde de 1 px `--linea`.
- **Táctil:** 44 px mínimo en el celular, con la clase `toque` que ya existe.
- **Sin emoji** en la interfaz. Telegram no se toca.
- **Un solo título por pantalla:** lo pone el encabezado y las vistas no repiten su `h1`.
- **Pestañas y filtros:** las pestañas de sección usan `Segmentado` y los filtros usan `chipCls`. Nunca se ven iguales.

## Review Focus

1. **Enlace inalámbrico que corta por 5 a 15 s** (NanoStation): los datos se atenúan a los 5 s, como hoy, pero el aviso ámbar recién aparece a los 15 s seguidos. Si no, el aviso parpadea. Prueba en Task 3: `estadoConexion` con 10 s sin dato da `tipo: 'demora'`, no `'cortada'`.
2. **Portal abierto durante un corte, sin ningún dato todavía:** el aviso dice "Sin conexión con el PLC" sin hora y las tarjetas muestran bloques de carga, no guiones. Prueba en Task 3: `ts === null` da `tipo: 'nunca'` con `desde` undefined.
3. **Varias alarmas:**
   - la pastilla dice "3 alarmas activas" (plural correcto, "1 alarma activa");
   - la tarjeta muestra la primera sin ver y "+2 más".
   - Prueba en Task 3: `textoAlarmas(0|1|3)`.
4. **Anclas del tutorial:** cada `el` de `lib/tutorial.ts` tiene que existir como `data-tour="…"` en algún `.tsx` después del rediseño. Si no, el tutorial se saltea pasos en silencio. Prueba en Task 2: `tutorial.anclas.test.ts` lee los `.tsx` con `fs`.
5. **Equipo DESHABILITADO** en el indicador "fuera de servicio": cuenta solo `DESHABILITADO`, no `DETENIDO`, que está parado pero habilitado. Prueba en Task 3.

---

### Task 1: Tokens, escala tipográfica y fuentes locales

**Files:**
- Modify: `frontend-react/src/hmi/tokens.css`, `frontend-react/src/hmi/contraste.ts`, `frontend-react/src/hmi/contraste.test.ts`
- Modify: `frontend-react/tailwind.config.js`, `frontend-react/src/index.css`, `frontend-react/index.html`, `frontend-react/src/main.tsx`, `frontend-react/package.json`

**Interfaces:**
- Produces:
  - **Tokens nuevos:** `--linea-boton`, `--alta-suave`, `--alta-texto`, `--ok-suave`, `--ok-texto`, `--aviso-suave`, `--aviso-borde`, `--aviso-texto`, `--eq-apagado`, `--navegador-texto`, `--sombra-tarjeta`.
  - **Clases Tailwind:** `bg-alta-suave`, `text-alta-texto`, `bg-ok-suave`, `text-ok-texto`, `bg-aviso-suave`, `border-aviso-borde`, `text-aviso-texto`, `border-linea-boton`, `bg-eq-apagado`, `text-navegador-texto`, `shadow-tarjeta`.
  - **fontSize:** `xs` 12/16, `sm` 13/18, `base` 15/22, `lg` 18/24, `xl` 24/30, `2xl` 28/36.

- [ ] **Step 1: Escribir las pruebas de contraste nuevas** en `contraste.test.ts`, dentro del `for (const tema …)`:

```ts
it('texto sobre los fondos suaves ≥ 4.5', () => {
  expect(contraste(t['--alta-texto'], t['--alta-suave'])).toBeGreaterThanOrEqual(4.5)
  expect(contraste(t['--ok-texto'], t['--ok-suave'])).toBeGreaterThanOrEqual(4.5)
  expect(contraste(t['--aviso-texto'], t['--aviso-suave'])).toBeGreaterThanOrEqual(4.5)
  expect(contraste(t['--alta-texto'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
})
it('menú y botón primario ≥ 4.5', () => {
  expect(contraste(t['--navegador-texto'], t['--navegador'])).toBeGreaterThanOrEqual(4.5)
  expect(contraste(t['--accion-texto'], t['--accion'])).toBeGreaterThanOrEqual(4.5)
  expect(contraste(t['--accion'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
})
```

- [ ] **Step 2: Correr y ver que fallan.** Run: `cd frontend-react && npx vitest run src/hmi`. Expected: FAIL (`--alta-texto` undefined).

- [ ] **Step 3: Reescribir los valores de `tokens.css`** con la tabla de la spec §1. Cuatro reglas:
  - Se conservan todos los nombres que ya existen. Los que la spec no nombra se dejan como están.
  - `--borde-campo` (campos de formulario, 3:1): claro `#8A94A6`, oscuro `#5C6E86`.
  - `--linea-boton` (borde decorativo de botones secundarios): claro `#D5DBE4`, oscuro `#3A4A60`.
  - El resto, exacto:
    - `--placa`: claro `#FFFFFF`, oscuro `#1E2A3B`;
    - `--accion-texto`: claro `#FFFFFF`, oscuro `#0A1A31`;
    - `--accion-hover`: claro `#184C8C`, oscuro `#8DB8EE`;
    - `--estado-alta-sobre`: `#FFFFFF` en los dos temas;
    - `--navegador-texto`: claro `#C9D8EC`, oscuro `#B8C8DD`;
    - `--sombra-tarjeta`: claro `0 1px 2px rgba(16,24,40,.06)`, oscuro `none`;
    - `--eq-manual`: claro `#5C7591`, oscuro `#7A8FA8`.

  Actualizar el bloque `prefers-color-scheme`, el de `[data-theme="dark"]` y el de impresión. Impresión: claro, con `--sombra-tarjeta: none`.

  Cambiar las tres variables de fuente a:
  - `--fuente: 'Inter', system-ui, sans-serif`;
  - `--fuente-mono: 'JetBrains Mono', ui-monospace, monospace`;
  - `--fuente-condensada: var(--fuente)`.

  La regla `body { font: 13px/1.45 … }` pasa a `15px/22px`.

- [ ] **Step 4: Copiar los hex nuevos a `contraste.ts`** (`TOKENS.claro` y `TOKENS.oscuro`). La prueba "TOKENS coincide con tokens.css" exige que sean idénticos.

- [ ] **Step 5: `tailwind.config.js`:**
  - `fontSize` con la escala de Interfaces;
  - `fontFamily`: `sans: ['Inter', …]`, `cond: ['Inter', …]` (se conserva el nombre para no romper clases), `mono: ['"JetBrains Mono"', …]`;
  - los colores nuevos de Interfaces;
  - `boxShadow: { tarjeta: 'var(--sombra-tarjeta)' }`;
  - `borderRadius: { lg: '14px', md: '10px', sm: '6px' }`.

  En `index.css`:
  - `html { font-size: 16px }` y `--radius: 10px`;
  - el tutorial de driver.js con `border-radius: 14px` en el popover y `10px` en los botones, y la familia `Inter`.

- [ ] **Step 6: Fuentes locales.**
  - `npm i @fontsource/inter @fontsource/jetbrains-mono`;
  - en `main.tsx`, antes de `tokens.css`: `import '@fontsource/inter/400.css'`, `…/500.css`, `…/600.css`, `…/700.css`, `import '@fontsource/jetbrains-mono/400.css'` y `…/500.css`;
  - borrar los dos `<link>` de `fonts.googleapis.com` de `index.html`.

- [ ] **Step 7: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: todas PASS y el build OK.
  - Run: `grep -c googleapis index.html`. Expected: `0`.

- [ ] **Step 8: Commit.** `git commit -am "Estilo C: tokens claro/oscuro, escala Inter/JetBrains Mono y fuentes locales"`

---

### Task 2: Primitivas (Panel, Button, Segmentado, Pastilla, chips) y anclas del tutorial

**Files:**
- Modify: `frontend-react/src/components/Panel.tsx`, `frontend-react/src/components/ui/button.tsx`, `frontend-react/src/components/Filtros.tsx`
- Create: `frontend-react/src/components/ui/segmentado.tsx`, `frontend-react/src/components/ui/pastilla.tsx`
- Test: `frontend-react/src/lib/tutorial.anclas.test.ts`

**Interfaces:**
- Produces:
  - `Panel({ titulo, accion?, grande?, className?, children, 'data-tour'? })`. Tarjeta `rounded-lg border border-linea bg-panel shadow-tarjeta p-[18px]`. Título `h2` de 15 px 700 (18 px con `grande`), sin mayúsculas ni banda de color.
  - `Segmentado({ items: { id: string; label: string; to?: string; marca?: boolean }[]; activo: string; onCambio?: (id: string) => void; grande?: boolean; 'aria-label': string })`.
    - Fondo `bg-fila-total rounded-[12px] p-1`.
    - El activo, `bg-panel shadow-tarjeta font-semibold`.
    - Con `to` renderiza `<Link>` y `aria-current="page"`; sin `to`, `<button role="tab" aria-selected>`.
    - `marca`: punto rojo de 8 px con `aria-label="con alarma"`.
    - `grande`: 18 px y alto de 40 px; si no, 13 px y alto de 30 px.
  - `Pastilla({ tono: 'alta' | 'ok' | 'accion' | 'neutro' | 'aviso'; children; className? })`. `rounded-full h-[24px] px-[10px] text-xs font-semibold`, con fondo y texto del tono.
  - `chipCls(on: boolean): string`, exportado desde `ui/segmentado.tsx`. Es `rounded-full border` de 30 px de alto: activo `bg-accion text-accion-texto border-accion` y, si no, `bg-panel border-linea-boton`.
  - `Button`:
    - todas las variantes llevan `rounded-md`;
    - `outline` y `secondary` usan `border-linea-boton bg-panel` y `font-semibold text-accion`.

- [ ] **Step 1: Escribir `lib/tutorial.anclas.test.ts`.** Lee `lib/tutorial.ts`, saca cada `el: '…'` con una regex, junta el texto de todos los `.tsx` de `src/` (con `fs.readdirSync` recursivo) y exige que exista `data-tour="${el}"` o el template `data-tour={\`nav-${…}\`}` para los `nav-*`:

```ts
test('cada paso del tutorial tiene su ancla en algún componente', () => {
  for (const el of anclas) expect(fuentes.includes(`data-tour="${el}"`) || (el.startsWith('nav-') && fuentes.includes('data-tour={`nav-'))).toBe(true)
})
```

- [ ] **Step 2: Correr.** Run: `npx vitest run src/lib/tutorial.anclas.test.ts`. Expected: PASS hoy. Queda como red para las Tasks 4 a 6.

- [ ] **Step 3: Crear `ui/segmentado.tsx` y `ui/pastilla.tsx`; reestilar `Panel` y `Button`** según Interfaces. Usar `chipCls` en `Filtros.tsx` en lugar de su `chip` local.

- [ ] **Step 4: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: PASS y build OK.
  - Run: `grep -rn "font-cond" src/components/Panel.tsx`. Expected: sin salida.

- [ ] **Step 5: Commit.** `git commit -am "Estilo C: Panel tarjeta, Button, Segmentado, Pastilla y chips"`

---

### Task 3: Lógica pura (conexión y resumen de la planta)

**Files:**
- Create: `frontend-react/src/lib/conexion.ts`, `frontend-react/src/lib/resumen.ts`
- Test: `frontend-react/src/lib/conexion.test.ts`, `frontend-react/src/lib/resumen.test.ts`

**Interfaces:**
- Consumes:
  - `estaVencido(ts, ahora, umbralMs = 5000)` de `lib/estadoGrupo.ts`;
  - `estadoEquipo`, `alarmasActivas` y `proximoTexto` de `lib/frases.ts`;
  - `contarDescongelados` de `lib/historial.ts`;
  - `horariosVista` de `lib/paginaCamara.ts`;
  - `CAMARAS`, `GRUPOS`, `num` y `nombreCamara` de `lib/camaras.ts`.
- Produces:
  - `AVISO_MS = 15000`.
  - `estadoConexion(recibidoEn: number | null, ahora: number): { tipo: 'ok' | 'demora' | 'cortada' | 'nunca'; desde?: number; minutos?: number }`. Reglas:
    - `recibidoEn === null` → `'nunca'`;
    - ≤ 5000 ms → `'ok'`;
    - de 5001 a 15000 ms → `'demora'`;
    - más → `'cortada'`, con `desde: recibidoEn` y `minutos: Math.floor((ahora - recibidoEn) / 60000)`.
  - `textoAlarmas(n: number): string`: `''` si 0, `'1 alarma activa'` y `'N alarmas activas'`.
  - `resumenPlanta(estado: Estado, filas: FilaDescongelado[] | null, ahora: number)`, que devuelve:
    - `compresores: { en: number; de: number }`, donde `de` vale `CAMARAS.length * GRUPOS.length`;
    - `descongelados: { hechos: number | null; de: number }`;
    - `alarmas: number`;
    - `fuera: { n: number; detalle: string }`;
    - `proximo: string`.
  - `porCamara(estado: Estado, c: string, filas: FilaDescongelado[] | null, ahora: number): { compresores: string; hechos: string; proximo: string }`, con textos tipo `'5/8'`, `'2 de 3'` y `'hoy 20:00'`.

- [ ] **Step 1: Escribir las pruebas.**

```ts
// conexion.test.ts
test('nunca llegó', () => expect(estadoConexion(null, 1e6)).toEqual({ tipo: 'nunca' }))
test('fresco', () => expect(estadoConexion(1e6 - 3000, 1e6).tipo).toBe('ok'))
test('10 s es demora, no corte (enlace inalámbrico)', () => expect(estadoConexion(1e6 - 10000, 1e6).tipo).toBe('demora'))
test('más de 15 s es corte, con desde y minutos', () => expect(estadoConexion(1e6 - 400000, 1e6)).toEqual({ tipo: 'cortada', desde: 1e6 - 400000, minutos: 6 }))
test('textoAlarmas', () => { expect(textoAlarmas(0)).toBe(''); expect(textoAlarmas(1)).toBe('1 alarma activa'); expect(textoAlarmas(3)).toBe('3 alarmas activas') })
```

```ts
// resumen.test.ts: estado con C1.G1..G8 y C2.G1..G8; claves `${c}.G${g}.estado` y `${c}.G${g}.comp`
test('compresores en marcha sobre 16', () => expect(resumenPlanta(est, [], AHORA).compresores).toEqual({ en: 11, de: 16 }))
test('fuera de servicio cuenta solo DESHABILITADO, no DETENIDO', () => expect(resumenPlanta(est, [], AHORA).fuera).toEqual({ n: 1, detalle: 'Cámara 4 equipo 8' }))
test('descongelados de = horarios habilitados de las dos cámaras', () => expect(resumenPlanta(est, [], AHORA).descongelados.de).toBe(5))
test('sin filas todavía, hechos es null', () => expect(resumenPlanta(est, null, AHORA).descongelados.hechos).toBeNull())
```

Armar `est` en la prueba con 11 compresores en 1 y un equipo `DESHABILITADO` (`C2.G8`). Poner otro `DETENIDO`, con 3 horarios habilitados en C2 y 2 en C1 (claves `${c}.H${h}.estado` / `.hora`, como en `paginaCamara.test.ts`). `nombreCamara('C2')` es "Cámara 4".

- [ ] **Step 2: Correr y ver que fallan.** Run: `npx vitest run src/lib/conexion.test.ts src/lib/resumen.test.ts`. Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar `conexion.ts` y `resumen.ts`** con las firmas de Interfaces:
  - `descongelados.de` es la suma de `horariosVista(estado, c, ahora, filas).length`;
  - `hechos` es `contarDescongelados(filas).hechos` (null si `filas` es null);
  - `alarmas` es `alarmasActivas(estado).length`;
  - `proximo` es el `proximoTexto` más temprano de las dos cámaras, con el nombre de la cámara.

- [ ] **Step 4: Correr.** Run: `npx vitest run`. Expected: todas PASS.

- [ ] **Step 5: Commit.** `git commit -am "Estilo C: estadoConexion (aviso a los 15 s) y resumen de la planta"`

---

### Task 4: Marco (menú, encabezado, aviso de conexión, barra de estado y celular)

**Files:**
- Modify: `frontend-react/src/App.tsx`, `frontend-react/src/components/Navegacion.tsx`, `frontend-react/src/components/marco/BarraApp.tsx` (pasa a ser el encabezado), `frontend-react/src/components/marco/BarraEstado.tsx`, `frontend-react/src/components/marco/AvisoAlarmaCelular.tsx`
- Create: `frontend-react/src/components/marco/AvisoConexion.tsx`
- Delete: `frontend-react/src/components/marco/BarraPantalla.tsx`; `BandaAlarmas.tsx` (mover `CuadroAlarma` y `desdeTexto` a `AvisoAlarmaCelular.tsx` y actualizar sus importadores con `grep -rn "BandaAlarmas" src`)

**Interfaces:**
- Consumes:
  - `estadoConexion` y `textoAlarmas` (Task 3);
  - `Pastilla` (Task 2);
  - `useAlarmasActivas()` (`grupos`, `sinVer`, `vistas`, `marcar`);
  - `pantallaDe(pathname).ruta` de `lib/pantallas.ts`, cuyo último elemento es el título;
  - `useCamarasStore(s => s.recibidoEn)`.
- Produces:
  - `AvisoConexion()`: `role="alert"`, solo cuando el tipo es `'cortada'` o `'nunca'`.
    - Con corte: "Sin conexión con el PLC desde las {hh:mm} (hace {N} minutos)".
    - Sin datos nunca: "Sin conexión con el PLC".
    - Segunda línea: "Lo que ves son los últimos datos recibidos. Las cámaras siguen funcionando con el tablero. Revisá la red de la planta o avisá al técnico."
  - `NavegadorPc({ compacto })`: 232 px (64 px compacto). Menú `bg-navegador`, con el logo de la marca en un recuadro blanco de 40 px `rounded-md`, `brandName` y "Cámaras de frío". Ítems de 42 px `rounded-md`, el activo `bg-accion`, el contador rojo en Alarmas y abajo el usuario con sus iniciales y su rol.

- [ ] **Step 1: Encabezado** (`BarraApp.tsx`), 72 px, `bg-panel border-b border-linea`, de izquierda a derecha:
  - ☰;
  - el `h1` de 24 px 700 con el último elemento de `pantallaDe(pathname).ruta` y debajo la fecha de planta de 13 px `text-texto-2`;
  - `Pastilla tono="alta"` con `textoAlarmas(grupos.length)`, un `Link` a `/alarmas` (oculta si es 0);
  - `Pastilla tono="ok"` "PLC en línea · hh:mm:ss" o `tono="neutro"` "PLC sin conexión", según `estadoConexion`;
  - el reloj mono de 18 px;
  - sol/luna y salir.

  En el celular, 60 px `bg-navegador text-navegador-texto`: logo, `brandName`, "PLC en línea · hh:mm" y reloj, sin título.

- [ ] **Step 2: Menú** (`Navegacion.tsx`):
  - `NavegadorPc` según Interfaces.
  - `NavegadorCelular`: 64 px, `bg-panel` y los íconos lucide de hoy. El contador queda igual.
  - Mantener `data-tour={\`nav-${i.icono}\`}`.

- [ ] **Step 3: `AvisoConexion.tsx`**, según Interfaces: `bg-aviso-suave border-aviso-borde text-aviso-texto rounded-lg`, ícono `WifiOff` de lucide en un círculo de 40 px y "Reintentando…" a la derecha. Va debajo del encabezado, con margen de 24 px arriba y 32 px a los lados.

- [ ] **Step 4: `BarraEstado`:** 36 px, `bg-panel border-t border-linea text-sm text-texto-2`, mismo contenido. Agregar puntos de 8 px `rounded-full`: `bg-ok-texto` si hay conexión y `bg-texto-2` si no.

- [ ] **Step 5: `AvisoAlarmaCelular`** como tarjeta, según la spec §3 Celular:
  - `rounded-lg border border-alta-texto/30 bg-panel`, con el cuadrado "!" de 30 px `rounded-[8px]`, el título y "desde";
  - `QueHacer` en una caja `bg-fila-total rounded-[8px]`;
  - `BotonVisto` y `ContactoGuardia compacto`, los dos de 44 px.

- [ ] **Step 6: `App.tsx` `Marco`.**
  - Computadora: grilla de columnas `[auto_1fr]`, con el menú a la izquierda a todo el alto. A la derecha, una columna con encabezado (72 px), `AvisoConexion`, `main` (`p-6 px-8 overflow-auto`) y `BarraEstado`.
  - Celular: encabezado, `AvisoConexion`, `AvisoAlarmaCelular`, `main` y `NavegadorCelular`.
  - Quitar `BarraPantalla` y `BandaAlarmas`.

- [ ] **Step 7: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: PASS (incluida `tutorial.anclas`) y build OK.
  - Run: `grep -rn "BarraPantalla\|BandaAlarmas" src`. Expected: sin salida.

- [ ] **Step 8: Commit.** `git commit -am "Estilo C: menú azul, encabezado con estado general, aviso de conexión y barra de estado"`

---

### Task 5: Inicio

**Files:**
- Modify: `frontend-react/src/views/General.tsx`
- Create: `frontend-react/src/components/Indicadores.tsx`, `frontend-react/src/components/TarjetaCamara.tsx`, `frontend-react/src/components/TarjetaAlarma.tsx`
- Delete: `frontend-react/src/components/TablaCamaras.tsx` y `frontend-react/src/components/ResumenHoy.tsx`, si quedan sin uso (verificar con grep)

**Interfaces:**
- Consumes:
  - `resumenPlanta` y `porCamara` (Task 3);
  - `estadoConexion` (Task 3);
  - `Panel`, `Pastilla` y `Segmentado` (Task 2);
  - `estadoEquipo(estado, c, g)`, que da `{ clave, texto, icono, color, borde, sobre }`;
  - `Icono` de `components/Icono`;
  - `useAlarmasActivas()`, `BotonVisto`, `QueHacer`, `ContactoGuardia`, `NovedadesTurno`, `EventosHoy` y `TrendEquipos` (mismas props que hoy en `General.tsx`).
- Produces:
  - `Indicadores()`: cuatro tarjetas en `grid-cols-4` (2 × 2 en el celular).
    - Etiqueta de 13 px, cifra de 28 px 700 tabular (más "/ de" en 16 px `text-texto-2`) y línea de detalle de 13 px.
    - La de alarmas, con borde `border-alta-texto/40` y cifra `text-alta-texto` si es mayor que 0.
    - `data-tour="hoy"`.
  - `TarjetaCamara({ cam })`:
    - el título es un `Link` a `/camara/{cam}`, con `Pastilla` de modo y `Pastilla tono="alta"` "N alarma(s)";
    - grilla de 4 × 2 de equipos, cada uno con fondo suave, círculo de 32 px con `eq.color`/`eq.sobre` (más `eq.borde`) e `Icono`, "Equipo N" y `eq.texto`;
    - pie de 3 columnas con `porCamara`;
    - `data-tour="camaras"` en la primera.
  - `TarjetaAlarma()`: la primera de `sinVer` (o de `grupos`), con "+N más" a `/alarmas`. Sin alarmas, la tarjeta dice "Sin alarmas activas" con un ícono `Check` y `text-ok-texto`.

- [ ] **Step 1: Componentes,** según Interfaces. Con `estadoConexion(...).tipo`:
  - en `'cortada'` o `'demora'`, la grilla de equipos de `TarjetaCamara` y los indicadores van con `opacity-[.55] grayscale-[.6]` y una `Pastilla tono="neutro"` "Último dato hh:mm";
  - en `'nunca'`, bloques `animate-pulse bg-fila-total rounded-[10px]` del mismo tamaño en lugar de los valores.
  - Nunca círculos con "?".

- [ ] **Step 2: `General.tsx`:**
  - `Indicadores`;
  - `grid-cols-[1fr_1fr_300px]`, con las dos `TarjetaCamara` y una columna con `TarjetaAlarma` y `NovedadesTurno`;
  - `grid-cols-[1fr_300px]`, con un `Panel grande` "Qué hizo cada equipo hoy" (`data-tour="trend"`, `Segmentado` Cámara 4 / Cámara 5 en `accion`, un solo `TrendCamara` a la vez, estado local) y `EventosHoy` (`data-tour="eventos"`, máximo 6, "Ver todos" a `/eventos`).
  - En el celular, todo apilado en ese orden, sin indicadores en 2 × 2 si no entran: usar `grid-cols-2`.
  - `AvisoArranque` queda primero, como hoy.

- [ ] **Step 3: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: PASS y build OK.
  - Run: `grep -rln "TablaCamaras\|ResumenHoy" src`. Expected: sin salida.

- [ ] **Step 4: Commit.** `git commit -am "Estilo C: Inicio con indicadores, tarjetas de cámara, alarma y gráfico por cámara"`

---

### Task 6: Cámara

**Files:**
- Modify: `frontend-react/src/views/Camara.tsx`, `frontend-react/src/components/TablaHorarios.tsx`, `frontend-react/src/components/PanelAlarmas.tsx`
- Create: `frontend-react/src/components/TarjetaEquipo.tsx`
- Delete: `frontend-react/src/components/TablaEquipos.tsx`, si queda sin uso

**Interfaces:**
- Consumes:
  - `Segmentado` y `Pastilla` (Task 2);
  - `estadoConexion` (Task 3);
  - de `TablaEquipos` de hoy: `usePermiso(1)`, `HojaEquipo` (diálogo de mando), `faltanMin`, `horasTxt` y las claves `${cam}.G${g}.comp|eva|res`, `.horas`, `.arranques` y `.horas_sin_desc` (las mismas que lee `dato()` en `TablaEquipos.tsx`; copiarlas de ahí).
- Produces:
  - `TarjetaEquipo({ estado, cam, g, hayDatos, atenuado, onCambiar })`:
    - círculo de 38 px con ícono, "Equipo N" de 15 px 700 y el estado de 13 px 600 (con "· faltan N min" si descongela);
    - tres chips "Comp." "Evap." "Resist." de 24 px `rounded-[6px]`, relleno `bg-accion text-accion-texto` cuando están en marcha (la resistencia descongelando, `bg-eq-desc`) y `bg-fila-total text-texto-2` cuando no, cada uno con `aria-label` "Compresor: en marcha/parado";
    - tres renglones dato-valor mono: horas de marcha, arranques y sin descongelar;
    - `Button variant="outline"` "Cambiar modo", deshabilitado sin permiso o sin conexión, con `title` "Sin conexión con el PLC".

- [ ] **Step 1: Encabezado de contenido** (primera fila de `Camara.tsx`, porque el título "Cámara 4" ya lo pone el marco):
  - `Segmentado grande` con `CAMARAS` y `to=/camara/{k}`, `marca` si esa cámara tiene alarmas (`data-tour="cam-selector"`);
  - `Pastilla` con el modo, "faltan N min" o el próximo descongelado (`data-tour="cam-estado"`);
  - a la derecha, el badge de alarma y "Ajustes" `Button variant="outline"` (`data-tour="cam-ajustes"`, solo admin).

- [ ] **Step 2: Cuerpo.**
  - `grid-cols-[1fr_300px]`: a la izquierda, `grid-cols-4` con 8 `TarjetaEquipo` (`data-tour="cam-equipos"`; en el celular 1 columna) y debajo `Panel grande` con `TrendEquipos` (`data-tour="cam-trend"`).
  - A la derecha:
    - `TablaHorarios` como `Panel` "Descongelados de hoy": hora mono, detalle y `Pastilla` (hecho `neutro`, en curso `accion` y programado `accion`; apagado `neutro`). `data-tour="cam-horarios"`.
    - `PanelAlarmas` "Alarmas de la cámara" (vacío con `Check` y "Sin alarmas activas" en `text-ok-texto`). `data-tour="cam-alarmas"`.
    - `EventosHoy` "Eventos de hoy". `data-tour="cam-eventos"`.
  - Sin conexión: atenuado como en la Task 5.

- [ ] **Step 3: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: PASS (`tutorial.anclas` incluida) y build OK.

- [ ] **Step 4: Commit.** `git commit -am "Estilo C: Cámara con tarjetas de equipo, descongelados del día y gráfico"`

---

### Task 7: Resto de pantallas y Login

**Files:**
- Modify: `frontend-react/src/views/Historial.tsx`, `Reportes.tsx`, `Mas.tsx`, `Avisos.tsx`, `Sistema.tsx`, `Config.tsx` (sus pestañas), `Usuarios.tsx`, `Programacion.tsx` y `Login.tsx`
- Modify (solo si tienen `rounded-none`, bandas `font-cond uppercase` o colores sueltos): los componentes que encuentre `grep -rln "font-cond\|uppercase\|rounded-none" src`

**Interfaces:**
- Consumes: `Segmentado`, `chipCls`, `Panel` y `Pastilla` (Task 2).

- [ ] **Step 1: Pestañas y títulos.**
  - En cada vista, borrar el `h1` propio: el título lo da el marco. Si `pantallaDe` no tiene ruta para esa pantalla, agregarla en `lib/pantallas.ts` con su prueba en `pantallas.test.ts`.
  - Cambiar `pestanaCls` de `Historial.tsx` y las pestañas de `Config.tsx` por `Segmentado` (con `to` cuando la pestaña es una ruta, y `onCambio` si no).
  - Los filtros quedan con `chipCls`.

- [ ] **Step 2: Login.**
  - Tarjeta centrada de 400 px `rounded-lg shadow-tarjeta bg-panel p-8` sobre `bg-suelo`, con el logo de 80 px, el nombre de la marca en 24 px 700 y la planta en `text-texto-2`.
  - Campos de 44 px `rounded-md border-borde-campo`.
  - Botón primario `bg-accion text-accion-texto` de 44 px, con contraste completo también cuando está deshabilitado: `disabled:opacity-60`, no 50.
  - Debajo, "Powered by {footer}".

- [ ] **Step 3: Verificar.**
  - Run: `npx vitest run && npm run build`. Expected: PASS y build OK.
  - Run: `grep -rn "uppercase" src/views src/components`. Expected: sin salida, salvo los textos que lo necesiten por contenido.

- [ ] **Step 4: Commit.** `git commit -am "Estilo C: pestañas segmentadas, chips, sin títulos repetidos y Login"`

---

### Task 8: Despliegue en WSL y revisión visual (controlador)

- [ ] **Step 1: Despliegue.**
  - En WSL: `git pull --ff-only origin portal-hmi`.
  - Compilar el frontend con el comando de siempre. Si Docker sigue sin red, compilar en Windows y copiar `dist` con un contenedor, como en la sesión del 2026-11-12.
- [ ] **Step 2: Capturas.**
  - Inicio, Cámara, Alarmas y Login, en claro y en oscuro, a 1280×800 y a 390×844.
  - Una de sin conexión: hoy el PLC no responde desde esta PC, así que sale sola.
  - Comparar contra la fila C del prototipo.
- [ ] **Step 3:** Mandar las capturas al usuario y anotar las diferencias para corregir.
