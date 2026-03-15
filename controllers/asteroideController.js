// Importo il Model (il mio "oggetto DAO") che contiene le query SQL
const asteroideModel = require('../models/asteroideModel');

// Controller per gestire la richiesta dei dati per il grafico della dashboard
async function getStats(req, res) {
  try {
    // 1. Leggo i parametri inviati dal frontend tramite l'URL
    const { startDate, endDate } = req.query;

    // Se c'è almeno una data, facciamo i controlli
    if (startDate || endDate) {
        // Controllo che siano presenti entrambe se ne viene passata una
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Devi fornire sia startDate che endDate." });
        }

        // Controllo il formato usando una Regex (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({ error: "Le date devono essere nel formato YYYY-MM-DD." });
        }

        // Controllo la validità sul calendario reale. 
        // In JS, una data inesistente crea un oggetto Date con valore interno NaN.
        // Chiamare .getTime() estrae questo NaN senza causare errori bloccanti.
        if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({ error: "Una delle date inserite non esiste sul calendario." });
        }

        // Controllo logico: la data di inizio non può essere dopo quella di fine!
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ error: "La data di inizio deve precedere la data di fine." });
        }
    }

    // 2. Chiamo il Model per interrogare il DB, nascondendo la complessità SQL
    const datiDashboard = await asteroideModel.getStatsDashboard(startDate, endDate);

    // 3. (In futuro) Qui potrei applicare una logica di "snellimento" dei dati 
    // in stile DTO per alleggerire la risposta, se il DB restituisse troppi campi.

    // 4. Invio la risposta al client in formato JSON e un HTTP 200 (OK)
    res.status(200).json(datiDashboard);
    
  } catch (err) {
    // Gestione degli errori per evitare che il server crashi
    console.error("Errore nel recupero statistiche:", err);
    res.status(500).send("Errore interno del server durante il recupero delle statistiche.");
  }
}

/**
 * Gestisce la richiesta per la Top 10 degli asteroidi più pericolosi.
 */
async function getInsightRischio(req, res) {
    try {
        const dati = await asteroideModel.getInsightRischioMassimo();
        res.status(200).json(dati);
    } catch (error) {
        console.error("Errore nel recupero insight rischio:", error);
        res.status(500).json({ error: "Errore interno del server durante il recupero dei dati di rischio." });
    }
}

/**
 * Gestisce la richiesta per consigliare i mesi con più avvistamenti.
 */
async function getMesiConsigliati(req, res) {
    try {
        // Estraiamo il limite solo se c'è, altrimenti passiamo undefined
        const limite = req.query.limite ? parseInt(req.query.limite, 10) : undefined;
        
        // Se limite è undefined, il Model userà il suo 5 di default!
        const dati = await asteroideModel.getTopMesiAnniAvvistamenti(limite);
        res.status(200).json(dati);
    } catch (error) {
        console.error("Errore nel recupero mesi consigliati:", error);
        res.status(500).json({ error: "Errore interno del server durante il calcolo dei mesi consigliati." });
    }
}

/**
 * Gestisce la richiesta per i dati della mappa spaziale interattiva.
 */
async function getMappaPianeti(req, res) {
    try {
        const { mese, anno } = req.query;

        // Validazione dell'input: 
        // Blocca la richiesta se mancano i parametri fondamentali
        if (!mese || !anno) {
            return res.status(400).json({ error: "Parametri 'mese' e 'anno' obbligatori per la mappa." });
        }
        // Converto in numeri interi
        // Per una validazione rigorosa del formato (Regex):
        // ^\d{1,2}$ : Accetta solo 1 o 2 cifre
        // ^\d{4}$   : Accetta esattamente 4 cifre
        // parseInt "pulisce" automaticamente la stringa ignorando tutti gli zeri non significativi a sinistra
        const numMese = parseInt(mese, 10);
        const numAnno = parseInt(anno, 10);
        // Controllo che siano numeri validi e nei range logici
        if (isNaN(numMese) || numMese < 1 || numMese > 12) {
            return res.status(400).json({ error: "Il mese deve essere un numero compreso tra 1 e 12." });
        }
        if (isNaN(numAnno) || numAnno < 1900 || numAnno > 2100) {
            return res.status(400).json({ error: "Anno non valido." });
        }

        const dati = await asteroideModel.getMappaPianetiByMeseAnno(mese, anno);
        res.status(200).json(dati);
    } catch (error) {
        console.error("Errore nel calcolo mappa pianeti:", error);
        res.status(500).json({ error: "Errore interno del server durante la generazione della mappa." });
    }
}

// Esporto le funzioni affinché il router (asteroideRoutes.js) possa usarle
module.exports = {
  getStats,
  getInsightRischio,
  getMesiConsigliati,
  getMappaPianeti
};