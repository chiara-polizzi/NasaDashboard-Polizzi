/**
 * @file profiloModel.js
 * @description Livello DAO (Data Access Object) per la gestione dei profili utente.
 * Gestisce il recupero, la rinomina e il ripristino dei profili.
 * Implementa le Transazioni SQL (BEGIN...COMMIT...ROLLBACK) per garantire l'integrità
 * logica e fisica dei dati durante le operazioni complesse come il reset.
 */

const pool = require('./db');

/**
 * Recupera tutti i 4 profili disponibili dal database per popolare la selezione iniziale nel frontend.
 *
 * @returns {Promise<Array>} Ritorna un array contenente i dati anagrafici dei profili.
 */
async function getAllProfili() {
    const sql = `SELECT id, nome_profilo, creato_il FROM profili ORDER BY id ASC;`;
    
    try {
        const result = await pool.query(sql);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Permette di rinominare uno slot profilo esistente.
 * Sfrutta la clausola RETURNING di PostgreSQL per restituire immediatamente il record aggiornato.
 * Copre il requisito dell'operazione di UPDATE (CRUD).
 *
 * @param {number} profiloId - L'ID del profilo da aggiornare.
 * @param {string} nuovoNome - La stringa di testo validata contenente il nuovo nome.
 * @returns {Promise<Object>} Ritorna l'oggetto completo del profilo appena modificato.
 */
async function updateNomeProfilo(profiloId, nuovoNome) {
    const sql = `
        UPDATE profili 
        SET nome_profilo = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    
    try {
        // Attenzione all'ordine: $1 -> nuovoNome, $2 -> profiloId
        const result = await pool.query(sql, [nuovoNome, profiloId]);
        
        // Uso result.rows[0] perché mi aspetto che l'UPDATE modifichi un solo profilo
        return result.rows[0]; 
    } catch (error) {
        throw error;
    }
}

/**
 * Resetta un profilo riportandolo allo stato iniziale.
 * Utilizza una TRANSAZIONE SQL per garantire l'integrità dei dati: 
 * cancella tutte le note associate e ripristina il nome di default ('Profilo ' + id).
 *
 * @param {number} profiloId - L'ID del profilo da resettare (da 1 a 4)
 * @returns {Promise<Object>} Ritorna un oggetto di conferma con un messaggio di successo.
 */
async function resetProfilo(profiloId) {
    // Otteniamo un "client" dedicato dal pool per fare la transazione
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Inizio della transazione

        // 1. Cancello tutte le note di questo profilo
        await client.query('DELETE FROM note_profili WHERE profilo_id = $1', [profiloId]);

        // 2. Ripristino il nome di default concatenando la stringa 'Profilo ' con l'ID
        await client.query(`
            UPDATE profili 
            SET nome_profilo = 'Profilo ' || $1 
            WHERE id = $1
        `, [profiloId]);

        await client.query('COMMIT'); // Se tutto va bene, confermo le modifiche!
        return { success: true, message: "Profilo resettato con successo." };
        
    } catch (error) {
        await client.query('ROLLBACK'); // Se c'è un errore, annullo tutto per evitare danni
        throw error;
    } finally {
        client.release(); // Rilascio la connessione per non intasare il DB
    }
}

module.exports = {
    getAllProfili,
    updateNomeProfilo,
    resetProfilo
};