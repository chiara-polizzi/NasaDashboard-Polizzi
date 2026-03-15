const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// Rotta per forzare il download dalla NASA
router.get('/fetch-data', syncController.syncNasaData);

module.exports = router;