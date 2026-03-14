// Importo il Model (il mio "oggetto DAO") che contiene le query SQL
const asteroideModel = require('../models/asteroideModel');

// Controller per gestire la richiesta dei dati per il grafico della dashboard
async function getStats(req, res) {
  try {
    // 1. Leggo i parametri inviati dal frontend tramite l'URL
    const { startDate, endDate } = req.query;

    // 2. Chiamo il Model per interrogare il DB, nascondendo la complessità SQL
    const datiDashboard = await asteroideModel.getStatsDashboard(startDate, endDate);

    // 3. (In futuro) Qui potrei applicare una logica di "snellimento" dei dati 
    // in stile DTO per alleggerire la risposta, se il DB restituisse troppi campi.

    // 4. Invio la risposta al client in formato JSON
    res.json(datiDashboard);
    
  } catch (err) {
    // Gestione degli errori per evitare che il server crashi
    console.error("Errore nel controller getStats:", err);
    res.status(500).send("Errore nel recupero dei dati per la dashboard");
  }
}

// Esporto la funzione per renderla disponibile alle rotte
module.exports = {
  getStats
};