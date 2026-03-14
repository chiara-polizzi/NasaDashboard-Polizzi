const pool = require('./db');

/**
 * Recupera tutte le note scritte da un determinato profilo (con JOIN per avere il nome dell'asteroide).
 * Copre il requisito di lettura (READ) e l'uso di JOIN.
 */
async function getNoteByProfilo(profiloId) {
    const sql = `
        SELECT n.asteroide_id, a.nome as nome_asteroide, n.nota_personale, n.data_salvataggio
        FROM note_profili n
        JOIN asteroidi a ON n.asteroide_id = a.id_nasa
        WHERE n.profilo_id = $1
        ORDER BY n.data_salvataggio DESC;
    `;
    // TODO: eseguire query
}

/**
 * Crea una nuova nota o aggiorna quella esistente se l'utente aveva già commentato quell'asteroide.
 * Query UPSERT (Insert on conflict)
 * Copre le operazioni di CREATE e UPDATE.
 */
async function upsertNotaPersonale(profiloId, asteroideId, testoNota) {
    const sql = `
        INSERT INTO note_profili (profilo_id, asteroide_id, nota_personale) 
        VALUES ($1, $2, $3)
        ON CONFLICT (profilo_id, asteroide_id) 
        DO UPDATE SET 
            nota_personale = EXCLUDED.nota_personale,
            data_salvataggio = CURRENT_TIMESTAMP;
    `;
    // TODO: eseguire query
}

/**
 * Rimuove una nota.
 * Copre il requisito dell'operazione di DELETE (CRUD).
 */
async function deleteNotaPersonale(profiloId, asteroideId) {
    const sql = `
        DELETE FROM note_profili 
        WHERE profilo_id = $1 AND asteroide_id = $2;
    `;
    // TODO: eseguire query
}

module.exports = {
    getNoteByProfilo,
    upsertNotaPersonale,
    deleteNotaPersonale
};