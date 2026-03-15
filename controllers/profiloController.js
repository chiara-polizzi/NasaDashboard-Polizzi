const profiloModel = require('../models/profiloModel');
const notaModel = require('../models/notaModel');

/**
 * Invia al frontend la lista dei 4 slot profilo disponibili.
 */
async function getProfili(req, res) {
    // TODO: Chiamare profiloModel.getAllProfili() e inviare JSON
}

/**
 * Gestisce la rinomina di un profilo esistente (UPDATE).
 */
async function aggiornaProfilo(req, res) {
    // TODO: Estrarre ID profilo (da req.params) e il nuovo nome (da req.body)
    // TODO: Chiamare profiloModel.updateNomeProfilo()
}

/**
 * Recupera tutte le note di uno specifico profilo (READ).
 */
async function getNote(req, res) {
    // TODO: Estrarre ID profilo (da req.params)
    // TODO: Chiamare notaModel.getNoteByProfilo()
}

/**
 * Salva una nuova nota o aggiorna quella esistente (CREATE / UPDATE).
 */
async function salvaNota(req, res) {
    // TODO: Estrarre ID profilo, ID asteroide e testo della nota (da req.body)
    // TODO: Chiamare notaModel.upsertNotaPersonale()
}

/**
 * Elimina una nota specifica (DELETE).
 */
async function eliminaNota(req, res) {
    // TODO: Estrarre ID profilo e ID asteroide
    // TODO: Chiamare notaModel.deleteNotaPersonale()
}

module.exports = {
    getProfili,
    aggiornaProfilo,
    getNote,
    salvaNota,
    eliminaNota
};