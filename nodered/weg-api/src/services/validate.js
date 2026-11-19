'use strict';

// ─── Validacion de esquema de config.json ────────────────────────────
// Sin esto, un PUT malformado se escribiría a disco tal cual y el poller lo
// recargaría (p. ej. una IP del PLC rota lo deja sin datos).

function isPort(v) {
  return v === undefined || (Number.isInteger(v) && v >= 1 && v <= 65535);
}

function isUnitId(v) {
  return v === undefined || (Number.isInteger(v) && v >= 0 && v <= 255);
}

const OCTETO = '(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])';
const IPV4 = new RegExp(`^${OCTETO}([.]${OCTETO}){3}$`);
const isIPv4 = (v) => typeof v === 'string' && IPV4.test(v);

// Devuelve una lista de errores; vacia si la config es valida.
function validateConfig(cfg) {
  const errors = [];
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    return ['la config debe ser un objeto JSON'];
  }

  if (cfg.pollIntervalMs !== undefined && (!Number.isInteger(cfg.pollIntervalMs) || cfg.pollIntervalMs < 500)) {
    errors.push('pollIntervalMs debe ser entero >= 500');
  }
  if (cfg.influxWriteIntervalMs !== undefined && (!Number.isInteger(cfg.influxWriteIntervalMs) || cfg.influxWriteIntervalMs < 1000)) {
    errors.push('influxWriteIntervalMs debe ser entero >= 1000');
  }

  // Conexión con el PLC (la lee el poller y la recarga sola: una IP rota lo dejaría sin datos)
  if (cfg.plc !== undefined) {
    const p = cfg.plc;
    if (!p || typeof p !== 'object' || Array.isArray(p)) errors.push('plc debe ser un objeto');
    else {
      if (!isIPv4(p.ip)) errors.push('plc.ip debe ser una IPv4');
      if (!isPort(p.port)) errors.push('plc.port invalido');
      if (!isUnitId(p.unitId)) errors.push('plc.unitId debe ser 0-255');
    }
  }

  for (const key of ['mqtt', 'influxdb']) {
    if (cfg[key] !== undefined && (cfg[key] === null || typeof cfg[key] !== 'object' || Array.isArray(cfg[key]))) {
      errors.push(`${key} debe ser un objeto`);
    }
  }

  return errors;
}

module.exports = { validateConfig, isIPv4 };
