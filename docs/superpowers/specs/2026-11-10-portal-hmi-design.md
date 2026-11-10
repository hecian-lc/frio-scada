# Portal con la guía HMI industrial (modo claro y oscuro)

Fecha: 2026-11-10. Rediseño del frontend (`frontend-react`) con la guía de la skill `hmi-industrial`
(github.com/walc72/skill-hmi-industrial: ISA-101 / IEC 63303, ISA-18.2, IEC 60073, WCAG 2.2).
Prototipo aprobado por el usuario: https://claude.ai/artifact/T7q78RD1McqdB6sG8gsHx9

## Objetivo

Que el portal se vea y se use como una herramienta de planta:
- lo normal no lleva color;
- solo la alarma grita;
- todo con texto además del color;
- igual de legible en modo claro y en modo oscuro.

Lo que hace el portal **no cambia**. No hay datos nuevos ni rutas nuevas en la API, y el mando sigue igual. Cambia la forma.

## Decisiones tomadas

| Tema | Elegido |
|---|---|
| Base técnica | **Opción A:** se mantienen Tailwind y shadcn, con los tokens de la guía. No se usa Ant Design. |
| Estados de los equipos | **Familia azul de la marca**, siempre con ícono y texto (ver tabla abajo). |
| Alarmas | **Una sola prioridad:** cuadrado rojo con "!" y la palabra "Alarma". |
| Celular | **Opción B:** se queda la barra de botones abajo, con un contador rojo en "Alarmas". Sin banda de alarmas. |
| Computadora | **Banda de alarmas fija abajo** y barra de estado. |
| Temas | **Claro y oscuro**, los dos completos y con los mismos papeles. Se cambia con el botón sol/luna que ya existe. |

### Paleta de estados

Estos colores son exclusivos de los equipos. No se usan para botones, marca ni gráficos de otra cosa.

| Estado (texto del PLC) | Se muestra | Claro | Oscuro | Ícono |
|---|---|---|---|---|
| `FRIO` | Enfriando | `#1F5FAF` | `#5B95DD` | copo |
| `DESCONGELANDO` / `DESCONG.` | Descongelando | `#138A8A` | `#2E9C95` | resistencia |
| `ESCURRIENDO` / `ESCURRE` | Escurriendo | `#9CC3EB`, borde `#1F5FAF` | `#2D5A8E`, borde `#5B95DD` | gotas |
| `MANUAL` | Manual | `#5C7591` | `#7A8FA8` | mano |
| `DESHABILITADO` / `DETENIDO` | Apagado | `--placa`, borde `--borde-campo` | ídem | encendido |
| `ALARMA RES` / `ALARMA` | Alarma | `--estado-alta` | ídem | cuadrado "!" |
| sin dato fresco o mapa incompatible | Sin datos | `--estado-invalido` | ídem | círculo "?" |

**Color del ícono sobre el relleno:**
- Claro: blanco, salvo sobre escurriendo, donde va `#0B3B6E`.
- Oscuro: `#0A1A31`, salvo sobre escurriendo, donde va `#E6EDF6`.

**Regla:** un dato sin valor válido nunca se muestra como 0. Se muestra en violeta con "?".

## 1. Tokens y temas

- **Tokens de la guía:** `tokens.css` de la skill se copia a `src/hmi/tokens.css` y se importa una vez, antes que `index.css`.
  - Trae `--marco`, `--suelo`, `--panel`, `--panel-titulo`, `--linea`, `--texto`, `--texto-2`, `--accion`, `--estado-alta`, `--estado-invalido` y el resto.
  - Se agregan los del proyecto: `--eq-frio`, `--eq-desc`, `--eq-escurre`, `--eq-escurre-borde`, `--eq-manual`, `--eq-sobre` y `--eq-sobre-claro`.
- **Selector del tema oscuro:** `tokens.css` usa `:root[data-theme="dark"]` y `prefers-color-scheme`.
  - El `ThemeProvider` pone **las dos marcas** en `<html>`: la clase `dark`, que usa Tailwind, y `data-theme`.
  - Si el navegador no tiene nada guardado, arranca con el tema del sistema operativo.
- **Variables de shadcn:** `--background`, `--card`, `--primary`, `--border`, `--muted-foreground`, `--destructive`, etc. pasan a apuntar a los tokens en los dos temas.
  - Así los componentes de `ui/` cambian sin tocarlos uno por uno.
  - Como shadcn espera "h s% l%", en `tailwind.config.js` esos colores pasan a ser `var(--x)` directo, en lugar de `hsl(var(--x))`.
- **Forma:** `--radius: 0`, sin sombras (`shadow-*` quedan sin uso), sin emoji en la interfaz. Los botones y campos llevan borde de 3:1 (`--borde-campo`).
- **Letra:**
  - Fuentes IBM Plex Sans, Plex Sans Condensed (bandas de título y tablas densas) y Plex Mono (horas y valores).
  - La escala de 11 a 24 px de la guía reemplaza la escala actual de `tailwind.config.js`: xs 11, sm 12, base 13, lg 15, xl 18, 2xl 24.
  - Sin números gigantes de KPI.
- **Color de la marca editable** (`colorPortal`, en Marca): ahora cambia `--accion` y `--marco`, en lugar de `--primary`.
  - En oscuro se aclara el tono para mantener 4,5:1 sobre `--panel`.
  - Si no alcanza el contraste, se usa el del tema y la pantalla de Marca lo avisa.
- **Impresión:** siempre en claro. Ya viene en `tokens.css`.

## 2. Marco de la aplicación

### Computadora (768 px o más)

De arriba hacia abajo:

1. **Barra de la app, 40 px, fondo `--marco`:**
   - ☰, logo (alto 28 px), "Cámaras de frío" en negrita;
   - a la derecha: reloj con segundos, usuario y rol, botón sol/luna y salir.
2. **Barra de pantalla, 36 px, `--barra-pantalla`:**
   - a la izquierda: el código de pantalla y la ruta (por ejemplo "N2 · Cámaras › Cámara 4");
   - a la derecha: "Dato del PLC" con la hora del último dato.
3. **Navegador a la izquierda, 248 px, `--navegador`:**
   - cada entrada lleva su código, su ícono y su nombre;
   - con ☰ queda en 56 px, solo íconos.

   | Código | Pantalla |
   |---|---|
   | N1 | Inicio |
   | N2 | Cámaras |
   | A1 | Alarmas |
   | E1 | Eventos |
   | T1 | Historial |
   | I1 | Reportes |
   | C1 | Más |

4. **Contenido sobre `--suelo`, armado con paneles:**
   - borde `--linea`;
   - banda de título de 28 px en mayúsculas chicas, Plex Condensed, `--panel-titulo`;
   - cuerpo `--panel`.
5. **Banda de alarmas fija, 32 px:**
   - sin alarmas: "Sin alarmas activas", sin color;
   - con alarmas: cuadrado rojo "!", cámara, texto, hora y botón **Visto**, más "+N más" que lleva a A1.
6. **Barra de estado, 22 px, `--marco`:**
   - PLC conectado o desconectado;
   - servidor (o réplica);
   - última copia: esta PC y Drive, de `GET /api/settings/copias`; solo admin, el resto no la ve;
   - versión.
   - El pie "Powered By" pasa acá.

### Celular (menos de 768 px)

- Barra de la app oscura de 48 px, con logo, título y reloj, sin barra de pantalla.
- Los paneles van apilados.
- La barra de botones queda abajo: Inicio, Cámaras, Alarmas, Historial, Más.
  - Eventos entra desde Alarmas, con una pestaña.
  - Alarmas lleva un contador rojo con el número de alarmas activas no vistas.
- Con una alarma activa sin ver, aparece arriba de todo un aviso: cuadrado rojo, texto y botón **Visto** de 44 px de alto.
- Sin banda de alarmas abajo y sin barra de estado. Lo de la barra de estado pasa a Más › Sistema.

### Nombre del botón

**Se mantiene "Visto"**, la palabra que ya usan Telegram, los registros (`comando=visto`) y los operadores. En el prototipo decía "Reconocer".

## 3. Pantallas

### N1 Inicio

Reemplaza las tarjetas, el semáforo grande y los números de Hoy. Paneles:

- **Cámaras:** una tabla con una fila por cámara.
  - Columnas: nombre, los 8 símbolos de equipo (24 px, con el número debajo), estado en texto, próximo descongelado y alarmas.
  - La fila con alarma lleva el cuadrado "!" y el texto en `--estado-alta`; el resto de la fila no se pinta.
  - La leyenda de símbolos va debajo de la tabla.
  - La fila entera lleva a N2.
- **Qué hizo cada equipo:** el trend actual (`TrendEquipos`) con los colores nuevos y la línea "ahora" en `--accion`. El rojo queda reservado para la alarma.
- **Hoy:** una tabla por cámara con los mismos tres datos de hoy (descongelados hechos, alarmas activas, compresores en marcha "n/8") y una fila de total en `--fila-total` ("n/16"). Cifras en Plex Mono, tamaño de tabla. Sin datos nuevos.
- **Últimos eventos:** los 8 últimos, con hora y texto.

El tutorial (`data-tour`) se reubica en estos paneles.

### N2 Cámara

Mismo contenido que hoy, en paneles:
- equipos (tabla con símbolo, estado, salidas C/E/R y botón "Cambiar…");
- ficha técnica (arranques, horas de marcha, horas sin descongelar);
- alarmas de la cámara con Visto;
- horarios y etapas;
- trend.

Los estados de horario dejan el verde y los emoji:

| Estado | Se muestra |
|---|---|
| "hecho" | texto normal |
| "revisar" | cuadrado "!" |

### A1, E1, T1, I1, C1 y Login

Mismo contenido, con paneles, tablas densas y tokens. Se reemplazan:
- verdes de "completo/resuelto": texto normal sin color;
- ámbar de "atención": se usa la alarma única, o texto normal si no es alarma;
- naranja de descongelando: `--eq-desc`;
- emoji (✅ ⚠️ 🚨 ⏳): íconos SVG con texto.

En Login, el logo de 80 px va sobre `--suelo`, con un panel para el formulario.

## 4. Lo que no cambia

- API, MQTT, store y lógica de `lib/` (frases, alarmas, vistas, historial).
  - Solo cambian las funciones que devuelven colores: ahora devuelven `var(--eq-…)`.
- Rutas y permisos por rol.
- PDF y email de reportes: siguen con `colorInforme` y su propio diseño.
- Mando remoto: mismas confirmaciones.

## 5. Accesibilidad y verificación

- **Contraste**, medido con WCAG en claro y en oscuro (prueba automática en `src/hmi/contraste.test.ts`):
  - ≥ 4,5:1 para texto sobre su fondo;
  - ≥ 3:1 para cada relleno de equipo contra `--panel`, salvo escurriendo y apagado, que llevan borde de 3:1;
  - ≥ 3:1 para el ícono sobre su relleno.
- **Foco visible** en todo (`:focus-visible` de `tokens.css`).
- **Táctil:** 44 px mínimo en celular.
- **Color nunca solo:** cada estado lleva ícono y texto, y la alarma lleva cuadrado, "!" y la palabra.
- **Verificación visual:**
  - N1, N2 y A1;
  - en claro y oscuro;
  - a 1280×800 y 390×844;
  - con y sin alarma (datos de `src/mock`).
- **Pruebas:** `npx vitest run` y `npm run build` en verde, y despliegue en WSL antes de pedir release.

## 6. Fuera de alcance

- PWA (mejora 6) y temperatura (módulo TM3): van aparte.
- Ant Design.
- Cambios al PDF.
- Registrar las decisiones en `references/decisiones.md` y `proyectos.md` de la skill: solo cuando el usuario lo pida.
