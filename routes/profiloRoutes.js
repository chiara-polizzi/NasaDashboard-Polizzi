/**
 * @file profiloRoutes.js
 * @description Gestisce gli endpoint RESTful per i profili utente e le relative note personali.
 * Copre l'intero spettro delle operazioni CRUD (Create, Read, Update, Delete),
 * instradando le richieste al profiloController.
 */

const express = require('express');
const router = express.Router();
const profiloController = require('../controllers/profiloController');

// Rotte per Profili e Note (CRUD RESTful)
// Il prefisso '/api/profili' è in app.js

// READ: Ottieni tutti i profili
router.get('/', profiloController.getProfili); 
// UPDATE: Aggiorna il nome del profilo (uso di :id come parametro dinamico nell'URL)
router.put('/:id', profiloController.aggiornaProfilo); 
// DELETE: Elimina le note del profilo e ripristina il nome di default
router.delete('/:id', profiloController.ripristinaProfilo);
// READ: Ottieni le note di un profilo
router.get('/:id/note', profiloController.getNote); 
// CREATE/UPDATE: Salva una nota per un profilo
router.post('/:id/note', profiloController.salvaNota); 
// DELETE: Elimina una specifica nota
router.delete('/:id/note/:asteroideId', profiloController.eliminaNota); 
module.exports = router;