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
 * Invia al frontend la lista dei 4 slot profilo disponibili.
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
 * Gestisce la rinomina di un profilo esistente (UPDATE).
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
 * Recupera tutte le note di uno specifico profilo (READ).
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
 * Salva una nuova nota o aggiorna quella esistente (CREATE / UPDATE).
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
 * Elimina una nota specifica (DELETE).
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
 * Resetta un profilo (DELETE delle note + UPDATE del nome a default).
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