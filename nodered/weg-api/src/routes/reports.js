'use strict';

const router = require('express').Router();
const dailyReport = require('../services/dailyReport');
const reporteCamaras = require('../services/reporteCamaras');
const reporteDiario = require('../services/reporteDiario');

// POST /api/reports/camaras/xlsx { fecha } — Excel de cámaras del día
router.post('/camaras/xlsx', async (req, res) => {
  let fecha;
  try { fecha = reporteCamaras.validarFecha(req.body && req.body.fecha); } catch (e) { return res.status(400).json({ error: e.message }); }
  try {
    const { xlsx } = await reporteCamaras.generarXlsx(fecha);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-camaras_${fecha}.xlsx`);
    res.send(xlsx);
  } catch (e) {
    console.error('[API] reports/camaras/xlsx:', e.message);
    res.status(502).json({ error: 'Error consultando el histórico' });
  }
});

// GET /api/reportes/diario.pdf?fecha=YYYY-MM-DD (por defecto ayer) — el PDF del reporte diario de ese día.
// Se monta aparte en server.js (después de requireAuth): cualquier usuario con sesión.
async function diarioPdf(req, res) {
  let fecha;
  try { fecha = reporteCamaras.validarFecha(req.query.fecha === undefined ? reporteCamaras.ayer() : req.query.fecha); } catch (e) { return res.status(400).json({ error: e.message }); }
  try {
    const { pdf } = await reporteDiario.generarPdf(fecha, { sigue: dailyReport.sigueVivo() });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-camaras_${fecha}.pdf`);
    res.send(pdf);
  } catch (e) {
    console.error('[API] reportes/diario.pdf:', e.message);
    res.status(502).json({ error: 'Error consultando el histórico' });
  }
}

// GET /api/reportes/periodo.pdf?tipo=semana|mes[&fecha=YYYY-MM-DD] — semanal o mensual del período que contiene a
// fecha (por defecto el último completo). Cualquier usuario con sesión.
async function periodoPdf(req, res) {
  const reportePeriodo = require('../services/reportePeriodo');
  let p;
  try {
    const tipo = req.query.tipo;
    p = req.query.fecha === undefined
      ? reportePeriodo.ultimoCompleto(tipo, reporteCamaras.ayer())
      : reportePeriodo.periodo(tipo, reporteCamaras.validarFecha(req.query.fecha));
  } catch (e) { return res.status(400).json({ error: e.message }); }
  try {
    const { pdf, nombre } = await reportePeriodo.generarPdf(p.tipo, p.desde);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nombre}`);
    res.send(pdf);
  } catch (e) {
    console.error('[API] reportes/periodo.pdf:', e.message);
    res.status(502).json({ error: 'Error consultando el histórico' });
  }
}

module.exports = router;
module.exports.diarioPdf = diarioPdf;
module.exports.periodoPdf = periodoPdf;

