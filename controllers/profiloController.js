/**
 * @file profiloController.js
 * @description Controller che gestisce la logica di business relativa ai profili utente e alle annotazioni personali.
 * Gestisce le operazioni CRUD (Create, Read, Update, Delete) validando rigorosamente gli input (ID e testi)
 * per garantire l'integrità dei dati prima di interrogare i modelli del database.
 */

const profiloModel = require('../models/profiloModel');
const notaModel = require('../models/notaModel');

// COSTANTI DI VALIDAZIONE
// Per massimizzare la riusabilità e semplificare future modifiche globali, 
// questi parametri potrebbero venire estratti da un modulo separato (es. /config).
const MIN_PROFILO_ID = 1;
const MAX_PROFILO_ID = 4;
const MAX_LUNGHEZZA_NOME = 50;
const MAX_LUNGHEZZA_NOTA = 500;

/**
 * Gestisce la richiesta per recuperare l'elenco dei 4 slot profilo disponibili nel sistema.
 *
 * @param {Object} req - Oggetto della richiesta Express.
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON contenente l'array dei profili.
 */
async function getProfili(req, res) {
    // TODO: Chiamare profiloModel.getAllProfili() e inviare JSON
    try {
        const profili = await profiloModel.getAllProfili();
        res.status(200).json(profili);
    } catch (error) {
        console.error("Errore nel recupero dei profili:", error);
        res.status(500).json({ error: "Impossibile caricare i profili utente." });
    }
}

/**
 * Gestisce la rinomina di un profilo esistente (operazione UPDATE).
 * Esegue validazioni rigorose sul formato e sulla lunghezza del nuovo nome per prevenire errori nel DB.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene req.params.id e req.body.nuovoNome).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia il profilo aggiornato o un messaggio di errore in caso di validazione fallita.
 */
async function aggiornaProfilo(req, res) {
    try {
        const id = parseInt(req.params.id, 10); 
        const { nuovoNome } = req.body;

        // 1. Validazione ID: Range rigoroso
        if (isNaN(id) || id < MIN_PROFILO_ID || id > MAX_PROFILO_ID) {
            return res.status(400).json({ error: `ID Profilo non valido. Deve essere compreso tra ${MIN_PROFILO_ID} e ${MAX_PROFILO_ID}.` });
        }

        // 2. Validazione Tipo: previene crash su .trim()
        if (typeof nuovoNome !== 'string') {
            return res.status(400).json({ error: "Il nome del profilo deve essere in formato testuale." });
        }

        const nomePulito = nuovoNome.trim();

        // 3. Validazione Contenuto e Lunghezza
        if (nomePulito === "") {
            return res.status(400).json({ error: "Il nome del profilo non può essere vuoto." });
        }
        if (nomePulito.length > MAX_LUNGHEZZA_NOME) {
            return res.status(400).json({ error: `Il nome non può superare i ${MAX_LUNGHEZZA_NOME} caratteri.` });
        }

        const profiloAggiornato = await profiloModel.updateNomeProfilo(id, nomePulito);
        res.status(200).json(profiloAggiornato);
    } catch (error) {
        console.error(`Errore nell'aggiornamento del profilo ${req.params.id}:`, error);
        res.status(500).json({ error: "Errore interno durante il salvataggio del nome." });
    }
}

/**
 * Recupera tutte le note scritte da uno specifico profilo utente (operazione READ).
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene req.params.id).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Invia una risposta JSON con l'elenco delle note salvate dall'utente.
 */
async function getNote(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        
        if (isNaN(id) || id < MIN_PROFILO_ID || id > MAX_PROFILO_ID) {
            return res.status(400).json({ error: "ID profilo non valido o fuori range." });
        }

        const note = await notaModel.getNoteByProfilo(id);
        res.status(200).json(note);
    } catch (error) {
        console.error(`Errore nel recupero note per profilo ${req.params.id}:`, error);
        res.status(500).json({ error: "Impossibile caricare le note salvate." });
    }
}

/**
 * Gestisce il salvataggio o l'aggiornamento di una nota personale (operazione CREATE / UPDATE tramite Upsert).
 * Valida l'ID dell'asteroide e la lunghezza massima del testo.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene parametri e corpo della richiesta).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Conferma l'avvenuto salvataggio con HTTP 201 (Created).
 */
async function salvaNota(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { asteroideId, testoNota } = req.body;

        // Validazione ID Profilo
        if (isNaN(id) || id < MIN_PROFILO_ID || id > MAX_PROFILO_ID) {
            return res.status(400).json({ error: "ID profilo non autorizzato per questa operazione." });
        }

        // Validazione ID Asteroide (deve essere un numero positivo)
        const parsedAsteroideId = parseInt(asteroideId, 10);
        if (isNaN(parsedAsteroideId) || parsedAsteroideId <= 0) {
            return res.status(400).json({ error: "ID Asteroide mancante o non valido." });
        }

        // Validazione Tipo e Lunghezza della Nota
        if (typeof testoNota !== 'string') {
            return res.status(400).json({ error: "Il testo della nota deve essere in formato testuale." });
        }

        const notaPulita = testoNota.trim();

        if (notaPulita === "") {
            return res.status(400).json({ error: "Il testo della nota non può essere vuoto." });
        }
        if (notaPulita.length > MAX_LUNGHEZZA_NOTA) {
            return res.status(400).json({ error: `La nota è troppo lunga. Massimo consentito: ${MAX_LUNGHEZZA_NOTA} caratteri.` });
        }

        await notaModel.upsertNotaPersonale(id, parsedAsteroideId, notaPulita);
        res.status(201).json({ message: "Nota salvata con successo!" });
    } catch (error) {
        console.error(`Errore nel salvataggio nota per profilo ${req.params.id}:`, error);
        res.status(500).json({ error: "Impossibile salvare la nota nel database." });
    }
}

/**
 * Elimina definitivamente una specifica nota dal database (operazione DELETE).
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene req.params.id e req.params.asteroideId).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Conferma l'avvenuta eliminazione con HTTP 200 (OK).
 */
async function eliminaNota(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const asteroideId = parseInt(req.params.asteroideId, 10);

        if (isNaN(id) || id < MIN_PROFILO_ID || id > MAX_PROFILO_ID) {
            return res.status(400).json({ error: "ID profilo non valido." });
        }
        if (isNaN(asteroideId) || asteroideId <= 0) {
            return res.status(400).json({ error: "ID Asteroide non valido." });
        }

        await notaModel.deleteNotaPersonale(id, asteroideId);
        res.status(200).json({ message: "Nota eliminata con successo." });
    } catch (error) {
        console.error(`Errore nell'eliminazione della nota:`, error);
        res.status(500).json({ error: "Impossibile eliminare la nota." });
    }
}

/**
 * Gestisce il ripristino alle condizioni di default di un profilo.
 * L'operazione delega al Model una transazione SQL che cancella a cascata le note e resetta il nome.
 *
 * @param {Object} req - Oggetto della richiesta Express (contiene req.params.id).
 * @param {Object} res - Oggetto della risposta Express.
 * @returns {Promise<void>} Conferma l'avvenuto ripristino.
 */
async function ripristinaProfilo(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        
        if (isNaN(id) || id < MIN_PROFILO_ID || id > MAX_PROFILO_ID) {
            return res.status(400).json({ error: "ID profilo non valido." });
        }

        // Chiamo la funzione del model che esegue la transazione SQL
        const risultato = await profiloModel.resetProfilo(id);
        
        // Uso direttamente il risultato restituito dal model!
        res.status(200).json(risultato); 
    } catch (error) {
        console.error(`Errore nel reset del profilo ${req.params.id}:`, error);
        res.status(500).json({ error: "Impossibile resettare il profilo." });
    }
}

module.exports = {
    getProfili,
    aggiornaProfilo,
    getNote,
    salvaNota,
    eliminaNota,
    ripristinaProfilo
};