/**
 * @file asteroideController.js
 * @description Controller che gestisce la logica di business relativa agli asteroidi e alle statistiche.
 * Agisce da intermediario tra le rotte HTTP (routes) e il database (models),
 * occupandosi della validazione rigorosa degli input prima di inoltrare le richieste.
 */

// Importo il Model (il mio "oggetto DAO") che contiene le query SQL
const asteroideModel = require('../models/asteroideModel');

const MIN_LIMITE_ANNI = 1;
const MAX_LIMITE_ANNI = 50;
const ITEMS_PER_PAGE = 10;

/**
 * Gestisce la richiesta dei dati storici per popolare il grafico principale della dashboard.
 * Applica filtri temporali (opzionali) e gestisce la paginazione dei risultati.
 * Esegue una validazione complessa sulle date in ingresso per prevenire query errate.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene query params: startDate, endDate, page).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON con i dati degli asteroidi o un messaggio di errore.
 */
async function getStats(req, res) {
  try {
    // 1. Leggo i parametri inviati dal frontend tramite l'URL
    const { startDate, endDate, page } = req.query;

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
        const startObj = new Date(startDate);
        const endObj = new Date(endDate);
        if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
            return res.status(400).json({ error: "Una delle date inserite non esiste sul calendario." });
        }

        // Controllo Anno (1800 - 2500)
        const startYear = startObj.getFullYear();
        const endYear = endObj.getFullYear();
        if (startYear < 1800 || startYear > 2500 || endYear < 1800 || endYear > 2500) {
            return res.status(400).json({ error: "L'anno delle date deve essere compreso tra 1800 e 2500." });
        }

        // Controllo logico: la data di inizio non può essere dopo quella di fine!
        if (startObj > endObj) {
            return res.status(400).json({ error: "La data di inizio deve precedere la data di fine." });
        }
    }

    // Validazione pagina
    let paginaAttuale = 1; // Valore di default sicuro
    
    // Se il client ha inviato il parametro
    if (page !== undefined) {
        paginaAttuale = parseInt(page, 10);
        
        if (isNaN(paginaAttuale) || paginaAttuale < 1) {
            return res.status(400).json({ error: "Il parametro 'page' deve essere un numero intero maggiore di zero." });
        }
        
        // Mettere un tetto massimo per evitare richieste 
        // che potrebbero far calcolare offset enormi al database
        if (paginaAttuale > 100) {
             return res.status(400).json({ error: "Pagina richiesta oltre il limite massimo consentito." });
        }
    }

    const offset = (paginaAttuale - 1) * ITEMS_PER_PAGE;

    // 2. Chiamo il Model per interrogare il DB, nascondendo la complessità SQL
    const datiDashboard = await asteroideModel.getStatsDashboard(startDate, endDate, ITEMS_PER_PAGE, offset);

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
 * Gestisce la richiesta per estrarre gli asteroidi classificati come più pericolosi.
 * Interroga la vista analitica pre-calcolata nel database.
 *
 * @param {Object} req - Oggetto della richiesta Express.
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON con l'elenco degli asteroidi a rischio.
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
 * Gestisce la richiesta per calcolare l'insight statistico sugli anni con il maggior numero di avvistamenti.
 * Applica validazioni sui limiti richiesti dal frontend per prevenire query eccessivamente pesanti.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene query param opzionale: limite).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON contenente gli anni e i relativi conteggi.
 */
async function getAnniConsigliati(req, res) {
    try {
        let limite = undefined;

        // Se il frontend ci ha mandato un limite, lo validiamo
        if (req.query.limite) {
            limite = parseInt(req.query.limite, 10);
            
            // Controllo che sia un numero valido e non negativo
            if (isNaN(limite) || limite < MIN_LIMITE_ANNI) {
                return res.status(400).json({ error: "Il limite deve essere un numero intero maggiore di zero." });
            }
            
            // Controllo di sicurezza: evitiamo query troppo pesanti (es. LIMIT 1000000)
            if (limite > MAX_LIMITE_ANNI) {
                return res.status(400).json({ error: "Il limite massimo consentito è 50." });
            }
        }
        
        // Se limite è rimasto 'undefined' (campo vuoto nel frontend), 
        // il Model applicherà il suo default (5).
        const dati = await asteroideModel.getTopAnniAvvistamenti(limite);
        res.status(200).json(dati);
    } catch (error) {
        console.error("Errore nel recupero mesi consigliati:", error);
        res.status(500).json({ error: "Errore interno del server durante il calcolo dei mesi consigliati." });
    }
}

/**
 * Gestisce la richiesta per i dati spaziali necessari a popolare la mappa geografica visiva.
 * Richiede un parametro obbligatorio (anno) e ne accetta uno facoltativo (mese), validandone i range.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene query params: anno, mese).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON con gli asteroidi filtrati per data e raggruppabili per orbita.
 */
async function getMappaPianeti(req, res) {
    try {
        const { mese, anno } = req.query;

        // Validazione dell'input: 
        // Blocca la richiesta se mancano i parametri fondamentali
        if (!anno) {
            return res.status(400).json({ error: "Parametro 'anno' obbligatorio per la mappa." });
        }
        // Converto in numeri interi
        // Per una validazione rigorosa del formato (Regex):
        // ^\d{1,2}$ : Accetta solo 1 o 2 cifre
        // ^\d{4}$   : Accetta esattamente 4 cifre
        // parseInt "pulisce" automaticamente la stringa ignorando tutti gli zeri non significativi a sinistra
        const numAnno = parseInt(anno, 10);

        // Controllo che siano numeri validi e nei range logici
        if (isNaN(numAnno) || numAnno < 1800 || numAnno > 2500) {
            return res.status(400).json({ error: "Anno non valido." });
        }

        let numMese = null;
        // Se il mese è stato inserito, lo validiamo
        if (mese) {
            numMese = parseInt(mese, 10);
            if (isNaN(numMese) || numMese < 1 || numMese > 12) {
                return res.status(400).json({ error: "Il mese deve essere compreso tra 1 e 12." });
            }
        }

        const dati = await asteroideModel.getMappaPianetiByAnno(numAnno, numMese);
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
  getAnniConsigliati,
  getMappaPianeti
};