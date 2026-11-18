# Portal con estilo C (estética de producto, información de HMI)

Fecha: 2026-11-18. Rama `portal-hmi`. Reemplaza la forma visual del rediseño HMI (`2026-11-10-portal-hmi-design.md`) y mantiene sus reglas de estados, alarma única y "color nunca solo".

Prototipo aprobado (opción C): https://claude.ai/artifact/5JHrrdtLSXx3Kj6NZT47B2. Fila C: Inicio, Cámara 4, modo oscuro, sin conexión y celular.

## Objetivo

Que el portal se vea como un producto profesional, sin perder lo que el operador necesita de un vistazo:
- el estado general siempre visible;
- la alarma con qué hacer y a quién llamar;
- el gráfico del día;
- las novedades del turno.

Lo que hace el portal **no cambia**: no hay datos nuevos, ni rutas nuevas en la API, ni cambios en el mando. Cambia la forma.

## Decisiones tomadas

| Tema | Elegido |
|---|---|
| Dirección visual | **C:** la estética de B con la información de A. |
| Temas | **Claro y oscuro.** Claro es el de la lámina C · Inicio y oscuro el de C · Oscuro. Se cambia con el botón sol/luna que ya existe. |
| Forma | Tarjetas de radio 14 px, botones y campos de radio 10 px, sombra suave (`0 1px 2px rgba(16,24,40,.06)`) y borde de 1 px. Esto deja sin efecto la regla "radius 0, sin sombras" del rediseño HMI. |
| Tipografía | **Inter** para el texto y **JetBrains Mono** para horas y valores. La escala está en la sección 2. |
| Colores de estado | Se mantiene la familia azul de los equipos y la alarma roja única. El verde solo se usa para "conectado / sin alarmas", siempre con texto. |
| Celular | Se mantiene la barra de 5 botones abajo, con el contador rojo en Alarmas. |

## 1. Tokens

Todos en `src/hmi/tokens.css`, con un juego para claro y otro para oscuro bajo `[data-theme="dark"]`. Los nombres actuales se conservan donde ya existen, para que las vistas no cambien de clases.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--suelo` | `#F3F5F8` | `#0E1622` | fondo de la página |
| `--panel` | `#FFFFFF` | `#172231` | tarjetas |
| `--linea` | `#E4E8EE` | `#263449` | bordes de tarjetas |
| `--borde-campo` | `#D5DBE4` | `#3A4A60` | botones secundarios y campos |
| `--texto` | `#101828` | `#E6EDF6` | texto principal |
| `--texto-2` | `#5A6578` | `#9AA8BA` | texto secundario |
| `--navegador` | `#0F2A4D` | `#091425` | menú lateral (texto `#C9D8EC` / `#B8C8DD`) |
| `--accion` | `#1F5FAF` | `#5B95DD` | botón primario, ítem activo, enlaces |
| `--estado-alta` | `#E5484D` | `#E5484D` | alarma |
| `--alta-suave` | `#FDECEC` / texto `#B42318` | `#3A1A1D` / texto `#FFA3A6` | pastillas y fondos de alarma |
| `--ok-suave` | `#EAF7EF` / texto `#17663A` | `#12301F` / texto `#7FD8A4` | "PLC en línea", "Sin alarmas" |
| `--aviso-suave` | `#FFF7E6` / borde `#F2C46D` / texto `#5C3A00` | `#33260F` / borde `#8A6420` / texto `#F2C46D` | aviso de sin conexión |
| `--eq-frio` | `#1F5FAF` | `#5B95DD` | equipo enfriando |
| `--eq-desc` | `#138A8A` | `#2E9C95` | equipo descongelando |
| `--eq-escurre` | `#9CC3EB` | `#2D5A8E`, borde `#5B95DD` | equipo escurriendo |
| `--eq-apagado` | `#E4E8EE` | `#2A3646` | fuera de servicio |
| `--eq-sobre` | `#FFFFFF` (sobre escurre `#0B3B6E`) | `#0A1A31` (sobre escurre `#E6EDF6`) | ícono sobre el relleno |

La prueba de contraste (`src/hmi/contraste.test.ts`) se actualiza con estos pares. Exige ≥ 4,5:1 para el texto y ≥ 3:1 para el ícono sobre su relleno y para el relleno contra `--panel`, salvo escurre y apagado, que llevan borde.

## 2. Tipografía

| Estilo | Medida (px) | Uso |
|---|---|---|
| Indicador | 28 / 36 · 700, cifras tabulares | solo los 4 indicadores de Inicio |
| Título de pantalla | 24 / 30 · 700, interletra −1 % | uno por pantalla |
| Título de tarjeta | 18 / 24 · 700 (15 en tarjetas chicas) | |
| Texto | 15 / 22 · 400 | cuerpo, listas, menú |
| Texto destacado | 15 / 22 · 600 | nombres, botones |
| Secundario | 13 / 18 · 400 | ayudas, etiquetas de datos |
| Etiqueta | 12 / 16 · 600 | pastillas, chips |
| Datos | JetBrains Mono 15 / 22 · 500 (13 en listas) | horas, contadores, números |

- Nada más chico que 12 px. La regla de 11 px de las leyendas pasa a 12 px.
- Los números van siempre en mono, alineados a la derecha en las tablas, con su unidad.
- `html { font-size: 16px }`: se abandona la base de 14 px, y el `fontSize` de Tailwind pasa a esta escala.
- Las fuentes se sirven desde el propio frontend (`@fontsource/inter` y `@fontsource/jetbrains-mono`), no desde Google, para que funcione sin internet en planta.

## 3. Marco de la aplicación

### Computadora (768 px o más)

1. **Menú lateral de 232 px, `--navegador`:**
   - arriba, el logo de la marca en un recuadro blanco de 40 px, el nombre de la planta y "Cámaras de frío 4 y 5";
   - ítems de 42 px con radio 10; el activo con fondo `--accion`; contador rojo en Alarmas;
   - abajo, el usuario con sus iniciales y su rol.
   - Con ☰ queda en 64 px, solo íconos.
2. **Encabezado de 72 px, `--panel`:**
   - a la izquierda, el **único título** de la pantalla, con la fecha o un subtítulo;
   - a la derecha, el estado general: pastilla roja "N alarmas activas", que lleva a Alarmas, o nada si no hay; pastilla "PLC en línea · hh:mm:ss" (verde) o "PLC sin conexión" (gris); reloj mono de 18 px; sol/luna; salir.
   - Desaparece la barra de pantalla de 36 px con la ruta.
3. **Contenido** sobre `--suelo`, con márgenes de 24 px arriba y abajo y 32 px a los lados, y 16–20 px entre tarjetas.
4. **Barra de estado de 36 px**, `--panel`: PLC, servidor, última copia (solo admin) y "Tecno Electric S.A. · versión".
5. La banda de alarmas fija de abajo **se quita**: la reemplazan la pastilla del encabezado y la tarjeta de alarma de Inicio.

### Celular (menos de 768 px)

- Encabezado de 60 px `--navegador`: logo, planta, "PLC en línea · hh:mm" y reloj.
- Una alarma sin ver va primero, como tarjeta con "Qué hacer", **Visto** y **Llamar a {guardia}**, botones de 44 px.
- Tarjetas de cámara con los 8 equipos en 4 × 2 (número dentro del círculo y estado abajo), próximo descongelado y compresores.
- Barra de 5 botones de 64 px: Inicio, Cámaras, Alarmas (contador), Historial, Más.

## 4. Pantallas

### Inicio
1. **4 indicadores:** compresores en marcha (n/16), descongelados hoy (n/m), alarmas activas (rojo si > 0) y equipos fuera de servicio, cada uno con una línea de detalle. Todo sale de los datos que ya calcula el panel Hoy.
2. **Una tarjeta por cámara:**
   - modo y alarma en pastillas;
   - los 8 equipos con ícono, número y estado;
   - abajo, próximo descongelado, descongelados hoy y compresores.
   - El título y la flecha llevan a la cámara.
3. **Columna derecha de 300 px:** la tarjeta de alarma (la primera sin ver, con Qué hacer, "Marcar como vista" y "Llamar a {guardia}") y Novedades del turno.
4. **"Qué hizo cada equipo hoy"** a todo el ancho, con selector Cámara 4 / Cámara 5, filas de 16 px y una línea de "ahora". Al lado, Últimos eventos.

### Cámara
- En el encabezado, un selector segmentado Cámara 4 / Cámara 5 (con punto rojo si la otra cámara tiene alarma), el modo, el estado general y "Ajustes".
- **8 tarjetas de equipo** en 4 × 2, cada una con:
  - el ícono y el estado;
  - los chips Comp./Evap./Resist. (relleno = en marcha);
  - horas de marcha, arranques y horas sin descongelar;
  - "Cambiar modo", que abre el mismo diálogo de mando de hoy.
- **Columna derecha:** descongelados de hoy (hecho, en curso, programado o apagado), alarmas de la cámara y eventos de hoy.
- Debajo de las tarjetas, el gráfico de la cámara.

### Alarmas, Eventos, Historial, Reportes, Más y Login
- Mismo contenido, con tarjetas y la tipografía nueva.
- Las pestañas de sección son siempre un **selector segmentado**, como el de Cámara. Los filtros (Hoy, Ayer, 7 días…) son **chips**. Nunca tienen el mismo aspecto.
- **Login:** tarjeta centrada de 400 px con el logo de 80 px, el nombre de la planta, los campos de 44 px y el botón primario `--accion` con buen contraste. Debajo, "Powered by Tecno Electric S.A.".

## 5. Sin conexión con el PLC

Se aplica cuando el último dato tiene más de 5 s, el mismo umbral de "sin datos" que hoy (`estaVencido` en `lib/estadoGrupo.ts`):
- **Un solo aviso** ámbar debajo del encabezado: "Sin conexión con el PLC desde las hh:mm (hace N minutos)" y una línea de qué hacer.
- La pastilla del encabezado pasa a "PLC sin conexión" (gris).
- Las tarjetas muestran el **último dato atenuado** (opacidad 0,55) con la etiqueta "Último dato hh:mm". No se pintan los equipos con "?".
- Los botones de mando quedan deshabilitados con el motivo en `title` y en el diálogo.
- Si **nunca** llegó un dato desde que abrió el portal, se muestran bloques de carga grises en lugar de guiones, y el mismo aviso.

## 6. Lo que no cambia

- API, MQTT, store y la lógica de `lib/`.
- Rutas y permisos por rol.
- PDF y email de los reportes.
- Mando remoto y sus confirmaciones.
- Alarma atendible: Visto con nota, guardia y Qué hacer.
- La regla "color nunca solo": cada estado lleva ícono y texto.

## 7. Verificación

- **Pruebas:** `npx vitest run` y `npm run build` en verde. La prueba de contraste, con los tokens nuevos.
- **Visual en WSL:** Inicio, Cámara, Alarmas y Login, en claro y en oscuro, a 1280×800 y a 390×844, con alarma y sin conexión.
- Comparar contra las láminas de la fila C del prototipo.

## 8. Fuera de alcance

- Temperaturas (módulo TM3) y PWA: van aparte.
- Los íconos de la barra del celular de la lámina son de relleno: se usan los de lucide que ya tiene el portal.
- Cambios al PDF.
