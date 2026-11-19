'use strict';

const router = require('express').Router();
const alertService = require('../services/alerts');

// GET /api/status/alerts — alert history
router.get('/alerts', (req, res) => {
  res.json(alertService.getHistory());
});

module.exports = router;
