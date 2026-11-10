# Portal HMI (claro y oscuro): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pasar `frontend-react` a la guía HMI industrial, en modo claro y oscuro, sin cambiar lo que hace el portal.

**Architecture:**
- Los tokens de la skill (`src/hmi/tokens.css`) son la única fuente de color.
- Las variables de shadcn apuntan a esos tokens, así los componentes `ui/` se adaptan solos.
- Un marco nuevo (`components/marco/`) reemplaza el encabezado de `App.tsx`.
- Un componente `Panel` reemplaza las `Card` sueltas.
- Un `SimboloEquipo` único reemplaza los cuatro lugares que hoy pintan estados.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind 3, shadcn/ui, Vitest, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-10-portal-hmi-design.md`. Prototipo aprobado: https://claude.ai/artifact/T7q78RD1McqdB6sG8gsHx9

## Global Constraints

- **Rama:** `portal-hmi`, desde `main`.
  - Push, tag y release solo cuando Will lo pida ("subilo a github y sacá vX").
  - Nunca push de `respaldo-historial-privado`.
- **Alcance:** sin cambios en la API, en MQTT ni en `src/store/`.
- **Colores:**
  - Ningún color hex suelto en `src/**/*.tsx` (salvo `BrandingTab` para el selector). Todo pasa por `var(--…)`.
  - Prohibidas las clases `green-*`, `emerald-*`, `amber-*`, `yellow-*`, `orange-*`, `red-*`, `shadow-*` y `rounded-*` (salvo `rounded-full` en el contador del celular).
  - Prohibidos los emoji en la interfaz.
- **Paleta de equipos:** exactamente la de la tabla de la spec.
- **Medidas:**
  - Escala de letra en px: xs 11, sm 12, base 13, lg 15, xl 18, 2xl 24.
  - Barra de la app 40 px (48 px en celular), barra de pantalla 36, navegador 248 (56 compacto), banda de panel 28, banda de alarmas 32, barra de estado 22.
  - Táctil de 44 px en celular.
- **Textos:**
  - El botón de alarma dice **"Visto"**.
  - Códigos de pantalla: N1 Inicio, N2 Cámaras, A1 Alarmas, E1 Eventos, T1 Historial, I1 Reportes, C1 Más.
- **Tema:** clase `dark` y `data-theme` en `<html>`. Sin preferencia guardada, sigue `prefers-color-scheme`.
- **Cada tarea termina con:**
  - `npx vitest run` y `npm run build` en verde, dentro de `frontend-react`;
  - un commit que termine con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Cambiar de tema con la página abierta.** Al tocar sol/luna, el trend (SVG), los símbolos y driver.js cambian en el acto, sin recargar. Para eso, los colores se leen con `var(--…)`, nunca con un hex calculado en JS.
2. **Datos vencidos o mapa incompatible.** Los 8 símbolos de cada cámara pasan a violeta "?", en la tabla de N1, en N2 y en el trend. Nunca quedan en el último estado conocido ni en 0.
3. **Color de portal elegido por el cliente** con poco contraste (por ejemplo `#FFEB3B`). El marco y los botones siguen legibles en los dos temas: cae al tono del tema y Marca lo avisa.
4. **Celular de 360 px con una alarma activa.** El aviso de arriba y la barra de abajo no tapan contenido. La tabla de Cámaras de N1 no genera scroll horizontal de la página; los símbolos pasan a 2 filas de 4.
5. **Operador (no admin).** La barra de estado no pide `/api/settings/copias`, así que no hay 401 en la consola, y oculta "Última copia".

---

### Task 1: Tokens, temas y variables de shadcn

**Files:**
- Create: `frontend-react/src/hmi/tokens.css`, `frontend-react/src/hmi/contraste.ts`, `frontend-react/src/hmi/contraste.test.ts`
- Modify: `frontend-react/src/main.tsx`, `frontend-react/src/index.css`, `frontend-react/tailwind.config.js`, `frontend-react/index.html`, `frontend-react/src/lib/theme.tsx`, `frontend-react/src/lib/color.ts`, `frontend-react/src/lib/color.test.ts`, `frontend-react/src/views/BrandingTab.tsx`

**Interfaces:**
- Produces:
  - Variables CSS `--marco`, `--suelo`, `--panel`, `--placa`, `--panel-titulo`, `--panel-titulo-texto`, `--barra-pantalla`, `--navegador`, `--fila-total`, `--linea`, `--linea-fila`, `--borde-campo`, `--texto`, `--texto-2`, `--accion`, `--accion-texto`, `--accion-hover`, `--seleccion`, `--estado-alta`, `--estado-alta-sobre`, `--estado-invalido`, `--marco-texto`, `--marco-texto-2`, `--marco-linea`, `--marco-foco`.
  - Del proyecto: `--eq-frio`, `--eq-desc`, `--eq-escurre`, `--eq-escurre-borde`, `--eq-manual`, `--eq-sobre`, `--eq-sobre-claro`.
  - Clases de Tailwind `bg-suelo`, `bg-panel`, `bg-marco`, `text-texto-2`, `border-linea`, etc., una por token, más las de shadcn ya existentes.
  - `contraste(a: string, b: string): number` (hex a ratio WCAG) y `TOKENS: { claro: Record<string,string>; oscuro: Record<string,string> }` en `src/hmi/contraste.ts`.
  - `aplicarColorPortal(hex: string | null, tema: 'light' | 'dark'): { usado: boolean }`.

- [ ] **Step 1: Write the failing test** `src/hmi/contraste.test.ts`:

  ```ts
  import { contraste, TOKENS } from './contraste'

  for (const tema of ['claro', 'oscuro'] as const) {
    const t = TOKENS[tema]
    it(`${tema}: texto y texto-2 ≥ 4.5 sobre panel`, () => {
      expect(contraste(t['--texto'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--texto-2'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
    })
    it(`${tema}: rellenos fuertes ≥ 3 contra panel`, () => {
      for (const k of ['--eq-frio', '--eq-desc', '--eq-manual', '--estado-alta', '--estado-invalido']) {
        expect(contraste(t[k], t['--panel'])).toBeGreaterThanOrEqual(3)
      }
    })
    it(`${tema}: borde de escurriendo y de campo ≥ 3 contra panel`, () => {
      expect(contraste(t['--eq-escurre-borde'], t['--panel'])).toBeGreaterThanOrEqual(3)
      expect(contraste(t['--borde-campo'], t['--panel'])).toBeGreaterThanOrEqual(3)
    })
    it(`${tema}: ícono ≥ 3 sobre su relleno`, () => {
      for (const k of ['--eq-frio', '--eq-desc', '--eq-manual']) {
        expect(contraste(t['--eq-sobre'], t[k])).toBeGreaterThanOrEqual(3)
      }
      expect(contraste(t['--eq-sobre-claro'], t['--eq-escurre'])).toBeGreaterThanOrEqual(3)
    })
  }
  ```

- [ ] **Step 2:** Run `npx vitest run src/hmi`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement.**
  - **`tokens.css`:**
    - Copy the skill's `references/tokens.css`. The local copy is in the session scratchpad `skill-hmi/references/tokens.css`; otherwise get it from github.com/walc72/skill-hmi-industrial.
    - Add `:root.dark` next to `:root[data-theme="dark"]`, with the same values.
    - Add the `--eq-*` values from the spec's table, light and dark:
      - `--eq-escurre-borde`: `#1F5FAF` / `#5B95DD`;
      - `--eq-sobre`: `#FFFFFF` / `#0A1A31`;
      - `--eq-sobre-claro`: `#0B3B6E` / `#E6EDF6`.
  - **`contraste.ts`:** keeps `TOKENS` as a literal copy of those values. A test checks they match: it reads `tokens.css` with `fs` and compares every `--x: #hex` with `TOKENS`, so the two can't drift apart.
  - **`index.css`:**
    - In `:root` and `.dark`, the shadcn variables point to tokens: `--background: var(--suelo)`, `--card: var(--panel)`, `--primary: var(--accion)`, `--border: var(--linea)`, `--muted-foreground: var(--texto-2)`, `--destructive: var(--estado-alta)`, `--radius: 0px`.
    - Remove `html { font-size: 14px }` and set `body` to 13px.
    - Restyle driver.js with tokens, no radius.
  - **`tailwind.config.js`:**
    - Colors become `var(--x)` instead of `hsl(var(--x))`, plus one entry per HMI token.
    - fontSize in px from the Global Constraints.
    - fontFamily adds `cond: ['"IBM Plex Sans Condensed"', …]`.
  - **`index.html`:** add Plex Sans Condensed (weights 500 and 600) to the Google Fonts link.
  - **`theme.tsx`:**
    - The initial value is `localStorage` or `matchMedia('(prefers-color-scheme: dark)')`.
    - Set the `dark` class and `data-theme` together.
  - **`color.ts`:** `aplicarColorPortal` sets `--accion`, `--marco` (the hex darkened to L≤25 %) and `--accion-texto`.
    - In dark it lightens until it reaches 4.5:1 against `#19232F`.
    - If it can't, it removes the overrides and returns `{usado:false}`.
  - **`BrandingTab`:** with `usado:false`, shows "Ese color no se lee bien sobre el fondo; se usa el del tema."

- [ ] **Step 4: Tests in `color.test.ts`.**

  ```ts
  aplicarColorPortal('#FFEB3B','light').usado === false
  aplicarColorPortal('#1F5FAF','dark').usado === true
  ```

  With `#1F5FAF` in dark, `getComputedStyle(document.documentElement).getPropertyValue('--accion')` must reach ≥4.5:1 against `#19232F` (jsdom: read `style.getPropertyValue`).

  Run `npx vitest run`. Expected: PASS.

- [ ] **Step 5:** Run `npm run build`, then commit `HMI: tokens de la guía, tema claro/oscuro y variables de shadcn`.

---

### Task 2: Símbolo de equipo único

**Files:**
- Create: `frontend-react/src/components/SimboloEquipo.tsx`
- Modify:
  - `frontend-react/src/lib/estadoGrupo.ts`, `frontend-react/src/lib/estadoGrupo.test.ts`, `frontend-react/src/lib/frases.ts` (`EQUIPO`, `estadoEquipo`, `badgeCamara`);
  - `frontend-react/src/components/Icono.tsx`, `BotonEquipo.tsx`, `GrupoChip.tsx`, `TablaEquipos.tsx`, `TrendEquipos.tsx`;
  - `frontend-react/src/lib/paginaCamara.ts` (`COLOR_TRAMO`, `HACHURA`).

**Interfaces:**
- Produces:
  - `colorEstadoGrupo(estado: string): { fondo: string; texto: string; borde?: string }`. Returns `var(--…)` strings.
    - `ALARMA RES` → `var(--estado-alta)`;
    - `DESHABILITADO` and `DETENIDO` → `var(--placa)` with `borde: 'var(--borde-campo)'` and `texto: 'var(--texto-2)'`.
  - `COLOR_SIN_DATOS = { fondo: 'var(--estado-invalido)', texto: 'var(--estado-alta-sobre)' }`.
  - `NombreIcono` adds `'sin-datos'` (circle with "?"). `alarma` becomes a square with "!" and `apagado` becomes a power symbol.
  - `estadoEquipo(...)`:
    - returns `{ clave, texto, icono, color, borde?, sobre }`;
    - `sin-datos` → violet "?";
    - `DETENIDO` → text "Apagado";
    - `ALARMA RES` → text "Alarma".
  - `<SimboloEquipo c g size={24|32} conTexto? />`:
    - a square of `size` px, the state's fill, its border if it has one, and the icon in `sobre`;
    - the equipment number below;
    - `aria-label="Equipo {g}: {texto}"`;
    - `conTexto` shows the state's text on the right (N2 table).
    - It replaces `BotonEquipo`, which is deleted, and `GrupoChip`, which renders `SimboloEquipo` if it's still used, and is deleted if not.

- [ ] **Step 1: Failing test.** In `estadoGrupo.test.ts`:

  ```ts
  colorEstadoGrupo('MANUAL').fondo === 'var(--eq-manual)'
  colorEstadoGrupo('DESCONG.').fondo === 'var(--eq-desc)'
  colorEstadoGrupo('ESCURRE').borde === 'var(--eq-escurre-borde)'
  colorEstadoGrupo('DETENIDO').borde === 'var(--borde-campo)'
  colorEstadoGrupo('ALARMA').fondo === 'var(--estado-alta)'
  colorEstadoGrupo('xx').fondo === 'var(--placa)'
  ```

  In `frases.test.ts`: `estadoEquipo` with no state for `C1.G1` → `{clave:'sin-datos', icono:'sin-datos', color:'var(--estado-invalido)'}`.

- [ ] **Step 2:** Run `npx vitest run src/lib`. Expected: FAIL on the new expectations.

- [ ] **Step 3: Implement.**
  - **Trend:**
    - `COLOR_TRAMO` uses the same `var(--eq-…)` colors.
    - `HACHURA` and the SVG pattern use `var(--linea-fila)` / `var(--linea)`.
    - The "ahora" line goes in `var(--accion)`.
    - The SVG uses `fill="var(--…)"`, which works inline.
  - **`badgeCamara`:** the "atención" level stops using `#F59E0B`. It returns `null` (no badge); the alarm returns `{t:'Alarma', c:'var(--estado-alta)'}`.

- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.

  Run `grep -rnE "#[0-9A-Fa-f]{6}" src/components src/lib --include=*.tsx --include=*.ts | grep -v test`. Expected: empty.

- [ ] **Step 5:** Commit `HMI: símbolo de equipo único con la paleta azul, alarma y sin datos`.

---

### Task 3: Panel y componentes `ui/`

**Files:**
- Create: `frontend-react/src/components/Panel.tsx`
- Modify: `frontend-react/src/components/ui/card.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `table.tsx`, `dialog.tsx`, `switch.tsx`

**Interfaces:**
- Produces:
  - `<Panel titulo: string; accion?: ReactNode; className?; children; 'data-tour'?>`:
    - border `border-linea` and `bg-panel`;
    - a 28 px band (`h-7 px-2 bg-panel-titulo text-panel-titulo-texto font-cond font-semibold text-xs uppercase tracking-wide`), with the title on the left and `accion` on the right;
    - body `p-2`.
  - `<Panel>` is the container for every screen from Task 5 on.
  - `TablaHmi`: the `table.tsx` classes get row height 28 px, `border-linea-fila` separators, hover `bg-fila-total`, and numbers in `font-mono`.

- [ ] **Step 1:** Restyle the `ui/` components, removing `rounded-*` and `shadow-*`:
  - primary button: `bg-accion text-accion-texto hover:bg-accion-hover`;
  - secondary button: border `border-borde-campo`;
  - inputs: `bg-placa border-borde-campo`;
  - tabs: active one underlined in `--accion`, without a pill;
  - dialog: `bg-panel border-linea` with a title band like `Panel`.
- [ ] **Step 2:** Create `Panel.tsx`. The only check is the build; it's presentational, with no logic to test.
- [ ] **Step 3:** Run `npm run build` and `npx vitest run`. Expected: PASS.

  Run `grep -rn "rounded-\|shadow-" src/components/ui`. Expected: empty.
- [ ] **Step 4:** Commit `HMI: Panel con banda de título y componentes ui sin esquinas ni sombras`.

---

### Task 4: Marco (barra de la app, barra de pantalla, navegador, banda de alarmas, barra de estado, celular)

**Files:**
- Create:
  - `frontend-react/src/lib/pantallas.ts` and `frontend-react/src/lib/pantallas.test.ts`;
  - `frontend-react/src/components/marco/BarraApp.tsx`, `BarraPantalla.tsx`, `BandaAlarmas.tsx`, `BarraEstado.tsx`, `AvisoAlarmaCelular.tsx`;
  - `frontend-react/src/lib/useAlarmasActivas.ts`.
- Modify: `frontend-react/src/App.tsx`, `frontend-react/src/components/Navegacion.tsx`, `frontend-react/src/lib/tutorial.ts` (selectors that change).

**Interfaces:**
- Consumes:
  - `alarmasActivasVista`, `agruparActivas`, `ultimoPorClave` (`lib/alarmas`);
  - `useVistas`, `vistoDe` (`lib/vistas`);
  - `BotonVisto`.
- Produces:
  - `pantallaDe(pathname: string): { codigo: 'N1'|'N2'|'A1'|'E1'|'T1'|'I1'|'C1'; ruta: string[] }`.
  - `useAlarmasActivas(): { grupos: GrupoActivo[]; sinVer: GrupoActivo[] }`. It has the same logic `PanelAlarmas` and `Camara` use today, without a camera filter.
  - `BandaAlarmas` and `AvisoAlarmaCelular` use it.

- [ ] **Step 1: Failing test.** In `pantallas.test.ts`:

  ```ts
  pantallaDe('/') -> {codigo:'N1', ruta:['Inicio']}
  pantallaDe('/camara/C4') -> {codigo:'N2', ruta:['Cámaras','Cámara 4']}
  pantallaDe('/alarmas').codigo === 'A1'
  pantallaDe('/eventos').codigo === 'E1'
  pantallaDe('/historial/descongelados') -> {codigo:'T1', ruta:['Historial','Descongelados']}
  pantallaDe('/reportes').codigo === 'I1'
  pantallaDe('/config').codigo === 'C1'
  pantallaDe('/usuarios').codigo === 'C1'
  pantallaDe('/nada').codigo === 'N1'
  ```

- [ ] **Step 2:** Run `npx vitest run src/lib/pantallas.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**, with the measurements from the Global Constraints and the spec §2.
  - **`App.tsx`:**
    - layout `grid-rows-[40px_36px_1fr_32px_22px]` from `md` up;
    - on phones, a 48 px bar and the bottom nav.
  - **`Navegacion`:**
    - desktop: 248 px (56 compact), with the code in `font-mono text-xs` before the icon; active entry `bg-seleccion` with a 3 px left bar in `--accion`;
    - phone: 5 buttons (no Eventos) and a counter `rounded-full bg-estado-alta text-estado-alta-sobre` with `sinVer.length` on Alarmas, hidden at 0;
    - Eventos is reached from a tab inside A1 on phones.
  - **`BarraEstado`:** asks for `/api/settings/copias` only if `isAdminRole(role)`, every 5 min.
  - "Powered By" moves into the status bar.
  - The header's green/amber connection chips go away; that state lives in `BarraEstado` (desktop) and Más › Sistema (phone).

- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS. Run `npm run build`. Expected: OK.

- [ ] **Step 5:** Commit `HMI: marco con códigos de pantalla, banda de alarmas, barra de estado y aviso en el celular`.

---

### Task 5: N1 Inicio

**Files:**
- Create: `frontend-react/src/components/TablaCamaras.tsx`
- Modify: `frontend-react/src/views/General.tsx`, `frontend-react/src/components/ResumenHoy.tsx`, `frontend-react/src/lib/tutorial.ts`, `frontend-react/src/lib/tutorial.test.ts`
- Delete: `frontend-react/src/components/TarjetaCamara.tsx`, `frontend-react/src/components/Semaforo.tsx`, if nothing else imports them.

**Interfaces:**
- Consumes:
  - `SimboloEquipo` (Task 2), `Panel` (Task 3);
  - `fraseCamara`, `proximoTexto`, `alarmasActivas` (`lib/frases`);
  - `TrendEquipos`, `EventosHoy`.

- [ ] **Step 1:** In `tutorial.test.ts`, the 'inicio' steps point to `data-tour` values that `General` renders: `camaras`, `trend`, `hoy`, `eventos`. Update the test with those names. Run it. Expected: FAIL.
- [ ] **Step 2: Implement the N1 panels** (spec §3):
  - **Cámaras:**
    - `TablaCamaras` has one `<tr>` per camera, clickable to `/camara/:c` (`role="link"`, Enter key);
    - symbols at `size=24`, wrapping into 2 rows of 4 below 640 px;
    - stale data or incompatible map: `SimboloEquipo` already shows "?"; the status column says "Sin datos desde HH:MM" in `text-estado-invalido`.
  - **Qué hizo cada equipo:** today's trend for each camera, one below the other, with the existing component.
  - **Hoy:** `ResumenHoy` becomes a table with a total row.
  - **Últimos eventos.**
  - **Layout:** `lg:grid-cols-[1.4fr_1fr]`, with Cámaras + trend on the left and Hoy + eventos on the right.
- [ ] **Step 3:** Run `npx vitest run` and `npm run build`. Expected: PASS.
- [ ] **Step 4:** Commit `HMI: N1 Inicio con tabla de cámaras, trend, hoy y eventos en paneles`.

---

### Task 6: N2 Cámara

**Files:**
- Modify: `frontend-react/src/views/Camara.tsx`, `frontend-react/src/components/TablaEquipos.tsx`, `TablaHorarios.tsx`, `PanelAlarmas.tsx`, `EventosHoy.tsx`, `HojaEquipo.tsx`, `AjustesCamara.tsx`, `Confirmar.tsx`, `EditorProgramacion.tsx`

- [ ] **Step 1: Implement** spec §3 N2.
  - **Camera selector:** tabs with `--accion` underline.
  - **Header line** (camera, mode, "faltan N min"): plain text, with no color badge; only an alarm gets the "!" square.
  - **Panels:** Equipos, Alarmas, Horarios y etapas, Qué hizo cada equipo, Eventos de hoy.
  - **`TablaHorarios`:**
    - `hecho` → plain text "hecho";
    - `solapado` and `mal configurado` → "!" square plus "revisar";
    - no emoji.
  - **Confirmations and editor:** same flow, restyled with tokens.
  - Keep all existing `data-tour` values.
- [ ] **Step 2:** Run `grep -nE "green-|amber-|red-[0-9]|emerald-|✅|⚠️|🚨|⏳" src/views/Camara.tsx src/components/*.tsx`. Expected: empty.
- [ ] **Step 3:** Run `npx vitest run` and `npm run build`. Expected: PASS.
- [ ] **Step 4:** Commit `HMI: N2 Cámara en paneles, horarios sin verde ni emoji`.

---

### Task 7: A1, E1, T1, I1, C1 y Login

**Files:**
- Modify:
  - `frontend-react/src/views/Historial.tsx`, `Reportes.tsx`, `Avisos.tsx`, `Mas.tsx`, `Sistema.tsx`;
  - `Config.tsx`, `ConexionTab.tsx`, `CopiasTab.tsx`, `BrandingTab.tsx`, `CamarasTab.tsx`, `ReplicasTab.tsx`;
  - `Usuarios.tsx`, `Programacion.tsx`, `Login.tsx`;
  - `frontend-react/src/components/ReplicaBadge.tsx`, `AvisoArranque.tsx`, `Filtros.tsx`, `PanelGrafana.tsx`.

- [ ] **Step 1: `Historial.tsx`.**
  - `COLOR_BADGE`: `completo` becomes no color; cut or skipped → `var(--eq-desc)`.
  - `COLOR_AVISO`:
    - `alarma` → `var(--estado-alta)` with the "!" square;
    - `atencion` and `resuelto` → plain text;
    - `cortado` → `var(--eq-desc)`.
  - The equipment squares (BloqueEquipos) use `COLOR_TRAMO` from Task 2.
  - With `fija="alarmas"` on phones, it shows "Alarmas | Eventos" tabs, which navigate to `/alarmas` and `/eventos`.
- [ ] **Step 2: The other views.** Swap `Card` for `Panel`, apply tokens, remove emoji and forbidden classes. Mas › Sistema shows PLC, servidor and última copia (admin) for phones.
- [ ] **Step 3:** Run `grep -rnE "green-|emerald-|amber-|yellow-|orange-|red-[0-9]|shadow-|rounded-(sm|md|lg|xl|2xl)|✅|⚠️|🚨|⏳|💾" src --include=*.tsx`. Expected: empty.
- [ ] **Step 4:** Run `npx vitest run` and `npm run build`. Expected: PASS.
- [ ] **Step 5:** Commit `HMI: resto de pantallas y login con paneles y tokens`.

---

### Task 8: Visual check and WSL deploy

- [ ] **Step 1:** Deploy to WSL:
  - from `/home/walc72/frio-scada`, `git fetch /mnt/c/Users/walc7/Projects/frio-scada portal-hmi` and check it out;
  - build the frontend with `build_front.sh` from the scratchpad.
- [ ] **Step 2: Visual check** in the built-in browser with an admin session (`sesion.sh`).
  - Screens N1, N2 (C4) and A1, each at:
    - 1280×800 light;
    - 1280×800 dark (toggle sol/luna without reloading);
    - 390×844 light and dark.
  - Check that:
    - nothing has horizontal scroll;
    - text is readable;
    - the symbols show the 5 states;
    - the bottom band and the phone notice show up with an active alarm.
  - Repeat at 390×844 as operador, without opening the console: no 401.
- [ ] **Step 3:** Fix whatever turns up, in separate commits with tests where there's logic.
- [ ] **Step 4:** Send Will screenshots of N1 in light and dark, and of the phone. Wait for the OK before any release.
