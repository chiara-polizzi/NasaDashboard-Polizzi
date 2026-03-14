const express = require('express');
// Inizializzo il Router di Express (il mio centralino)
const router = express.Router();

// Importo il controllers
const asteroideController = require('../controllers/asteroideController');
const syncController = require('../controllers/syncController');

// Quando ricevo una richiesta GET sull'endpoint '/stats', 
// delego il lavoro alla funzione getStats del mio controller.
router.get('/stats', asteroideController.getStats);

// Rotta per scaricare i dati dalla NASA (sostituisce la vecchia app.get('/fetch-data'))
router.get('/fetch-data', syncController.syncNasaData);

// Esporto il router configurato
module.exports = router;