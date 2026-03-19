/**
 * @file syncController.js
 * @description Controller dedicato alla sincronizzazione dei dati esterni.
 * Agisce da punto di ingresso per le richieste di aggiornamento manuale provenienti dal client.
 * Mantiene la logica di business snella delegando le complesse operazioni di fetch (API NASA) 
 * e persistenza (database) al service specializzato (nasaApiService).
 */

// Importo il Service che contiene la logica complessa
const nasaApiService = require('../services/nasaApiService');

/**
 * Gestisce la richiesta HTTP per forzare il download e il salvataggio dei dati dalla NASA.
 * Coordina l'esecuzione asincrona tramite il service e restituisce un feedback testuale all'utente.
 *
 * @param {Object} req - Oggetto della richiesta Express.
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta di testo confermando l'avvio del processo o notificando un errore (HTTP 200 o 500).
 */
async function syncNasaData(req, res) {
  try {
    // Il controller delega il lavoro pesante al Service
    const result = await nasaApiService.fetchAndSaveNasaData();
    
    // Se tutto va bene, avvisa l'utente
    res.status(200).send("Processo di sincronizzazione avviato. Controlla i log di Docker!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Si è verificato un errore durante la sincronizzazione con la NASA.");
  }
}

module.exports = {
  syncNasaData
};