/**
 * @file asteroideRoutes.js
 * @description Gestisce gli endpoint HTTP (rotte) relativi all'analisi e alla visualizzazione
 * dei dati degli asteroidi. Mappa le richieste in ingresso ai metodi specifici del controller.
 * Tutte le rotte qui definite sono di sola lettura (operazioni GET).
 */

const express = require('express');
const router = express.Router();
const asteroideController = require('../controllers/asteroideController');

// Rotte per Analisi e Dashboard (Read-Only)
// Il prefisso '/api/asteroidi' è in app.js

// GET /api/asteroidi/stats - Recupera i dati storici per il grafico principale 
router.get('/stats', asteroideController.getStats);
// GET /api/asteroidi/rischio - Recupera gli asteroidi più pericolosi 
router.get('/rischio', asteroideController.getInsightRischio);
// GET /api/asteroidi/anni-consigliati - Recupera l'insight sugli anni con più avvistamenti 
router.get('/anni-consigliati', asteroideController.getAnniConsigliati);
// GET /api/asteroidi/mappa - Recupera i dati filtrati per popolare la mappa spaziale 
router.get('/mappa', asteroideController.getMappaPianeti);

module.exports = router;