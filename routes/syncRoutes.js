/**
 * @file syncRoutes.js
 * @description Definisce l'endpoint di sistema dedicato alle operazioni di manutenzione 
 * e aggiornamento dati. Separa logicamente le chiamate di sistema da quelle di navigazione utente.
 */

const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

/** * GET /api/system/fetch-data 
 * Rotta per forzare il download asincrono dei dati dall'API pubblica della NASA.
 */
router.get('/fetch-data', syncController.syncNasaData);

module.exports = router;