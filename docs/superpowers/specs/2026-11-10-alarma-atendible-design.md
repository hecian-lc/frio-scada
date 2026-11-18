# Alarma atendible: qué hacer, guardia y nota del Visto

Fecha: 2026-11-10. Es el subproyecto A de las mejoras para el operador (mejoras 1 y 2). Va sobre la rama `portal-hmi` (rediseño HMI).

Los demás subproyectos van aparte, cada uno con su propia especificación:
- B: pantalla de sala;
- C: app en el celular (PWA y push);
- D: temperatura con módulo TM3.

## Objetivo

Cuando suena una alarma, el operador tiene que ver tres cosas sin buscarlas:

- **qué hacer**, con los pasos de su planta;
- **a quién llamar**, el responsable del turno de esa hora;
- **qué pasó antes:** si alguien ya la vio y qué anotó.

El turno siguiente ve esas notas en Inicio.

## Decisiones tomadas

| Tema | Elegido |
|---|---|
| Contacto | **Un responsable por turno**, con horario. Se muestra el del turno de la hora actual de la planta. |
| Instrucciones | **Las edita el admin** por tipo de alarma. Si el campo queda vacío, se usa la frase de fábrica. |
| Nota del Visto | **Opcional.** Se ve junto a la alarma, en E1 y en el panel **"Novedades del turno"** de Inicio (últimas 12 h). También sale en Telegram. |
| Almacenamiento | Guardia e instrucciones en `settings.json`. La nota, como campo de la línea `mando` del Visto, en Influx. |

## 1. Datos

### Guardia e instrucciones (`settings.json`, clave `guardia`)

```json
{
  "turnos": [
    { "nombre": "Juan", "desde": "06:00", "hasta": "14:00", "telefono": "+598 99 123 456", "whatsapp": true }
  ],
  "instrucciones": { "alarma_res": "1. Mirar la luz del tablero.\n2. Si está roja, llamar a Juan." }
}
```

**Validación**, en el servidor (`services/settings.js`); si algo falla, responde 400 con el motivo en castellano:

- **Turnos:**
  - hasta 6 turnos;
  - `nombre`: de 1 a 40 caracteres;
  - `desde` y `hasta`: `HH:MM` y distintos. Si `hasta` es menor que `desde`, el turno cruza la medianoche;
  - dos turnos no pueden pisarse. Puede haber horas sin turno.
- **Teléfono:**
  - solo dígitos, espacios, `+` y `-`, con 6 a 20 dígitos;
  - con `whatsapp: true` tiene que empezar con `+` y el código de país, porque `wa.me` lo necesita.
- **Instrucciones:**
  - las claves válidas son los tipos de `ALARMAS` de `services/frases.js`: `alarma_reloj`, `alarma_indice`, `alarma_espera`, `alarma_recuperacion`, `alarma_manual`, `alarma_res`, `alarma_sin_desc`, `hora_invalida`, `solapado` y `tiempo_invalido`;
  - cada texto tiene hasta 300 caracteres y 3 renglones;
  - un texto vacío borra la clave.

**Guardia actual:** es el turno que contiene la hora de la planta. La hora de la planta es la del servidor corregida con `TZ_OFFSET_MIN`, igual que en `alertasCamaras`. Esta cuenta se hace solo en el servidor.

Es una función pura, `guardiaActual(turnos, ahoraMs, tzOffsetMin) → turno | null`.

### Nota del Visto (Influx)

- La línea `mando` con `comando=visto` (creada en `marcarVisto` de `server.js`) suma el campo `nota`, un string de hasta 200 caracteres. Sin nota el campo no se escribe.
- `lineaMando` acepta `nota` como opcional.
- `parseMando` devuelve `nota: o.nota ?? ''`.
- Los reportes (diario y período) muestran la nota detrás de la acción: "Vio la alarma: … · Nota: …".

## 2. API

| Ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/avisos/guardia` | cualquier usuario con sesión | Devuelve `{ turnos, actual, instrucciones }`. `actual` es el turno de ahora o `null`. |
| `PUT /api/avisos/guardia` | admin | Reemplaza `{ turnos, instrucciones }` y valida todo junto. En una réplica responde 409 "La guardia se configura en la planta". |
| `POST /api/avisos/visto` | cualquier usuario (ya existe) | El cuerpo pasa a ser `{ claves, nota? }`. Una `nota` que no es string o que supera 200 caracteres da 400. La nota se aplica a todas las claves marcadas. |
| `GET /api/avisos/novedades` | cualquier usuario con sesión | Devuelve los Visto con nota de las últimas 12 h, el más nuevo primero: `[{ ts, usuario, texto, nota, camara }]`, como máximo 30. |

La nota llega de un usuario y se trata como texto. El portal la muestra como texto de React, nunca como HTML. En Telegram se manda en texto plano, sin `parse_mode`.

## 3. Telegram

- **Aviso de alarma**, armado en `alertasCamaras.tick`:
  - cada renglón de alarma nueva o repetida suma debajo "   Qué hacer: …", con la instrucción del admin o la frase de fábrica. Los renglones de comunicación y de mapa no tienen frase y no suman nada;
  - si el mensaje trae al menos una alarma y hay guardia actual, cierra con "Guardia: Juan (06:00–14:00) +598 99 123 456".
- **Visto desde el portal:** ahora también avisa al chat con "👀 Pedro vio: <texto>", y si hay nota agrega " — Nota: <nota>". Hasta ahora este mensaje solo salía cuando el Visto se marcaba desde Telegram.
- **Visto desde el botón de Telegram:** sigue igual y sin nota.

## 4. Portal

### Instrucción visible

- `BandaAlarmas`, `AvisoAlarmaCelular` y `PanelAlarmas` (A1 y N2) muestran la instrucción en un renglón propio: **"Qué hacer:"** en negrita y el texto en `--texto`, no en gris.
- En la banda de 32 px va en una sola línea, recortada con "…". El texto completo queda en `title` y en A1.
- En el resto, los saltos de renglón se respetan con `whitespace-pre-line`.
- La instrucción sale de `useGuardia()`, un store nuevo en `lib/guardia.ts` con el mismo patrón ref-contado que `lib/vistas.ts`:
  - pide `GET /api/avisos/guardia` cada 5 minutos;
  - `instruccion(clave)` devuelve la instrucción del admin para el tipo, o si no, `textoAlarma(clave).accion`.
- Las frases de fábrica quedan donde están: las dos copias, con su prueba de sincronía.

### Contactar a la guardia

- Junto a la instrucción, si hay `actual`, van dos botones:
  - **"Llamar a Juan"**, un enlace `tel:` con el número sin espacios;
  - **"WhatsApp"**, un enlace `https://wa.me/<dígitos>`, solo si `whatsapp: true`.
- Botones con borde de 3:1 y 44 px de alto en el celular, con el ícono del teléfono y el de mensaje como SVG, sin emoji.
- Sin guardia actual no se muestra nada. En la banda de la computadora solo va "Llamar a Juan", sin WhatsApp, para que entre en 32 px.

### Visto con nota

- `BotonVisto` abre un diálogo chico:
  - título: "Marcar como vista";
  - debajo, el texto de la alarma;
  - un campo "Nota (opcional)" de hasta 200 caracteres con contador;
  - botones **"Visto"** (primario) y "Cancelar".
- Si se manda vacía, el Visto queda sin nota. Enter con el campo vacío confirma.
- La firma pasa a ser `marcar(claves, nota?)`. `lib/vistas.ts` manda la nota en el POST.
- **"Vista por Pedro a las 14:32"** suma la nota cuando existe, en `--texto-2`. `GET /api/avisos/activas` devuelve `visto.nota` y `alertasCamaras.reconocer` la guarda en `visto`.
- En E1, la fila del Visto muestra la nota debajo del texto.

### Novedades del turno (N1 Inicio)

- Panel nuevo **"Novedades del turno"** debajo de "Últimos eventos".
- Lista de las novedades con hora en Plex Mono, usuario, alarma y nota.
- Sin novedades: "Sin notas en las últimas 12 horas".
- Se refresca cada 60 s y también al marcar un Visto en esta pestaña.

### Configuración › Guardia (solo admin)

Pestaña nueva en `views/Config.tsx` (C1 Más › Configuración), con los componentes de `ui/` del rediseño.

- **Turnos:** tabla editable con nombre, desde (`<input type="time">`), hasta, teléfono y WhatsApp (switch).
  - Botones "Agregar turno" y quitar.
  - Debajo, "Ahora: Juan (06:00–14:00)" o "Ahora no hay nadie de guardia", tomado de la respuesta del servidor al guardar.
- **Qué hacer con cada alarma:** una fila por tipo con el texto de la alarma y un `textarea` de 3 renglones.
  - El placeholder muestra la frase de fábrica.
  - Botón "Usar la de fábrica", que vacía el campo.
- **Guardar** manda todo con PUT. Los errores del servidor se muestran con toast y la pestaña queda como estaba.

## 5. Errores y casos borde

- **`GET /api/avisos/guardia` falla:** se usan las frases de fábrica y no hay botón de contacto. El portal no se rompe.
- **`settings.json` sin `guardia`:** `{ turnos: [], actual: null, instrucciones: {} }`.
- **Réplica:** muestra su propio `settings.json`, normalmente vacío, así que tiene frases de fábrica y no tiene contacto. No marca Visto, como hoy. Las novedades salen de Influx y se ven donde haya datos.
- **Falla la escritura en Influx del Visto:** como hoy, se registra en el log y el Visto queda marcado en memoria.
- **Cambio de turno con el portal abierto:** se refleja en 5 minutos como máximo.

## 6. Verificación

- **Servidor (`node --test`):**
  - `guardiaActual`: turno normal, turno que cruza la medianoche, bordes exactos (`desde` incluido, `hasta` excluido), hora sin turno;
  - validación de la guardia: turnos que se pisan, teléfono de WhatsApp sin `+`, más de 300 caracteres o más de 3 renglones, clave desconocida;
  - el Visto con nota y sin nota, y nota de 201 caracteres;
  - `lineaMando` con nota, y `parseMando` devuelve la nota;
  - novedades: filtro de 12 h y que solo devuelva Visto con nota;
  - texto de Telegram: "Qué hacer" por alarma y "Guardia" al final.
- **Portal (Vitest):**
  - `instruccion()` con instrucción del admin y sin ella;
  - el diálogo de Visto manda la nota;
  - Novedades vacío y con datos;
  - la pestaña Guardia muestra el error del servidor.
- **Visual en WSL:**
  - alarma con instrucción de 3 renglones y guardia cargada;
  - en la banda a 1280 px y en el aviso del celular a 390 px;
  - en claro y en oscuro.

## 7. Fuera de alcance

- Nota desde Telegram.
- Responsables distintos por tipo de alarma.
- Avisar por Telegram directo a la persona de guardia, en lugar del chat del grupo.
- PIN, resumen de turno y "por qué está en manual": quedan para ver con el cliente.
