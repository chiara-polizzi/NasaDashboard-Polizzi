// Importo il Service che contiene la logica complessa
const nasaApiService = require('../services/nasaApiService');

// Controller per forzare il download dei dati dalla NASA
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