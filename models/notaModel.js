/**
 * @file notaModel.js
 * @description Livello DAO (Data Access Object) per la gestione delle annotazioni personali.
 * Incapsula l'interazione diretta con il database PostgreSQL per la tabella 'note_profili'.
 * Implementa le operazioni CRUD delegando la logica SQL al database, utilizzando i 
 * Prepared Statements per garantire la massima sicurezza contro le SQL Injection.
 */

const pool = require('./db');

/**
 * Recupera tutte le note scritte da un determinato profilo.
 * Esegue una JOIN con la tabella 'asteroidi' per arricchire il risultato con il nome del corpo celeste.
 * Copre le operazioni di lettura (READ) e l'uso di JOIN analitiche.
 *
 * @param {number} profiloId - L'ID del profilo utente di cui recuperare le note.
 * @returns {Promise<Array>} Ritorna un array di oggetti contenenti i dati delle note e i nomi degli asteroidi.
 */
async function getNoteByProfilo(profiloId) {
    const sql = `
        SELECT n.asteroide_id, a.nome as nome_asteroide, n.nota_personale, n.data_salvataggio
        FROM note_profili n
        JOIN asteroidi a ON n.asteroide_id = a.id_nasa
        WHERE n.profilo_id = $1
        ORDER BY n.data_salvataggio DESC;
    `;
    
    try {
        // Passo profiloId per sostituire $1
        const result = await pool.query(sql, [profiloId]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Crea una nuova nota o aggiorna quella esistente se l'utente aveva già commentato quell'asteroide.
 * Sfrutta la clausola UPSERT (ON CONFLICT DO UPDATE) per eseguire l'operazione in modo atomico,
 * evitando chiamate multiple al database. Copre le operazioni di CREATE e UPDATE.
 *
 * @param {number} profiloId - L'ID del profilo utente.
 * @param {number} asteroideId - L'ID numerico dell'asteroide commentato.
 * @param {string} testoNota - Il contenuto testuale della nota da salvare.
 * @returns {Promise<Object>} Ritorna un oggetto di conferma { success: true }.
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
    
    try {
        // Passo i tre parametri nell'ordine in cui appaiono nella query SQL
        await pool.query(sql, [profiloId, asteroideId, testoNota]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

/**
 * Rimuove definitivamente una specifica nota dal database.
 * Copre il requisito dell'operazione di DELETE (CRUD).
 *
 * @param {number} profiloId - L'ID del profilo utente.
 * @param {number} asteroideId - L'ID dell'asteroide associato alla nota da eliminare.
 * @returns {Promise<Object>} Ritorna un oggetto di conferma { success: true }.
 */
async function deleteNotaPersonale(profiloId, asteroideId) {
    const sql = `
        DELETE FROM note_profili 
        WHERE profilo_id = $1 AND asteroide_id = $2;
    `;
    
    try {
        await pool.query(sql, [profiloId, asteroideId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getNoteByProfilo,
    upsertNotaPersonale,
    deleteNotaPersonale
};