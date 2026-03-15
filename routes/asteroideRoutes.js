const express = require('express');
const router = express.Router();
const asteroideController = require('../controllers/asteroideController');

// Rotte per Analisi e Dashboard (Read-Only)
// Il prefisso '/api/asteroidi' è in app.js
router.get('/stats', asteroideController.getStats);
router.get('/rischio', asteroideController.getInsightRischio);
router.get('/mesi-consigliati', asteroideController.getMesiConsigliati);
router.get('/mappa', asteroideController.getMappaPianeti);

module.exports = router;