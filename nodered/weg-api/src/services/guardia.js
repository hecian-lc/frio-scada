'use strict';

// Turnos de guardia (quién atiende de noche) e instrucciones por tipo de alarma.
// Funciones puras: la persistencia está en settings.js.

const frases = require('./frases');

const httpError = (status, msg) => Object.assign(new Error(msg), { status });
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const min = (hhmm) => { const [h, m] = hhmm.split(':'); return +h * 60 + +m; };
// Intervalos [d, h) en minutos; si cruza medianoche se parte en dos.
const tramos = (t) => {
  const d = min(t.desde), h = min(t.hasta);
  return h > d ? [[d, h]] : [[d, 1440], [0, h]];
};

function validarGuardia(p) {
  const b = (p && typeof p === 'object') ? p : {};
  if (b.turnos !== undefined && !Array.isArray(b.turnos)) throw httpError(400, 'Turnos inválidos');
  if (b.instrucciones !== undefined && (!b.instrucciones || typeof b.instrucciones !== 'object' || Array.isArray(b.instrucciones))) {
    throw httpError(400, 'Instrucciones inválidas');
  }
  const crudos = b.turnos || [];
  if (crudos.length > 6) throw httpError(400, 'Hasta 6 turnos');
  const turnos = crudos.map((t) => {
    const x = (t && typeof t === 'object') ? t : {};
    const turno = {
      nombre: String(x.nombre ?? '').trim(),
      desde: String(x.desde ?? '').trim(),
      hasta: String(x.hasta ?? '').trim(),
      telefono: String(x.telefono ?? '').trim(),
      whatsapp: x.whatsapp === true,
    };
    if (!turno.nombre) throw httpError(400, 'Cada turno necesita un nombre');
    if (!HHMM.test(turno.desde) || !HHMM.test(turno.hasta)) throw httpError(400, 'Hora inválida (HH:MM, de 00:00 a 23:59)');
    if (turno.desde === turno.hasta) throw httpError(400, 'Desde y hasta tienen que ser distintos');
    if (turno.whatsapp && !turno.telefono.startsWith('+')) throw httpError(400, 'El teléfono de WhatsApp tiene que empezar con + y el código de país');
    return turno;
  });
  for (let i = 0; i < turnos.length; i++) {
    for (let j = i + 1; j < turnos.length; j++) {
      const pisa = tramos(turnos[i]).some(([a, b2]) => tramos(turnos[j]).some(([c, d]) => a < d && c < b2));
      if (pisa) throw httpError(400, `Dos turnos se pisan: ${turnos[i].nombre} y ${turnos[j].nombre}`);
    }
  }
  const instrucciones = {};
  for (const [k, v] of Object.entries(b.instrucciones || {})) {
    if (!frases.TIPOS_ALARMA.includes(k)) throw httpError(400, `Tipo de alarma desconocido: ${k}`);
    const s = String(v ?? '').trim();
    if (!s) continue;
    if (s.length > 300) throw httpError(400, `Instrucción de ${k}: hasta 300 caracteres`);
    if (s.split(/\r?\n/).length > 3) throw httpError(400, `Instrucción de ${k}: hasta 3 renglones`);
    instrucciones[k] = s;
  }
  return { turnos, instrucciones };
}

// Turno de guardia a la hora de planta (UTC + tzOffsetMin; Uruguay = -180), o null.
function guardiaActual(turnos, ahoraMs, tzOffsetMin = Number(process.env.TZ_OFFSET_MIN ?? -180)) {
  const m = ((Math.floor(ahoraMs / 60000) + tzOffsetMin) % 1440 + 1440) % 1440;
  return (turnos || []).find((t) => tramos(t).some(([d, h]) => m >= d && m < h)) || null;
}

function instruccion(clave, instrucciones) {
  const tipo = String(clave).split('.').pop();
  if (!frases.TIPOS_ALARMA.includes(tipo)) return null;
  return (instrucciones && instrucciones[tipo]) || frases.textoAlarma(tipo).accion;
}

module.exports = { validarGuardia, guardiaActual, instruccion };
