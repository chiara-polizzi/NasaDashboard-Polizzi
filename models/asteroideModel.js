/**
 * @file asteroideModel.js
 * @description Livello DAO (Data Access Object) per l'entità Asteroide.
 * Incapsula l'interazione diretta con il database PostgreSQL, nascondendo la complessità
 * delle query SQL (comprese le Viste analitiche) al resto dell'applicazione.
 * Implementa l'uso sistematico di query parametrizzate per prevenire attacchi di SQL Injection.
 */

// Importo la connessione al database che ho configurato nell'altro file
const pool = require('./db');

/**
 * Estrae i dati (nome, velocità e data di passaggio) per popolare il grafico principale.
 * Costruisce la query dinamicamente per filtrare i risultati se vengono forniti parametri temporali,
 * e gestisce la paginazione in modo sicuro calcolando gli offset.
 *
 * @param {string} [startDate] - Data di inizio ricerca (opzionale, formato YYYY-MM-DD).
 * @param {string} [endDate] - Data di fine ricerca (opzionale, formato YYYY-MM-DD).
 * @param {number} [limit=10] - Numero massimo di record da restituire per pagina.
 * @param {number} [offset=0] - Numero di record da saltare (per la paginazione).
 * @returns {Promise<Array>} Ritorna la lista degli asteroidi trovati.
 */
async function getStatsDashboard(startDate, endDate, limit = 10, offset = 0) {
  let query = `
    SELECT a.id_nasa, a.nome, v.velocita_km_h, v.data_passaggio
    FROM asteroidi a
    JOIN avvistamenti v ON a.id_nasa = v.asteroide_id
  `;
  
  // Array per gestire i parametri in modo sicuro ed evitare SQL Injection
  const queryParams = [];

  // Se mi passano le date, aggiungo il filtro WHERE dinamico
  if (startDate && endDate) {
    query += ` WHERE v.data_passaggio >= $1 AND v.data_passaggio <= $2 `;
    queryParams.push(startDate, endDate);
  }

  // Ordino per velocità decrescente e prendo i top 10
  // query += ` ORDER BY v.velocita_km_h DESC LIMIT 10 `;

  // Aggiungo ordinamento e paginazione. 
  // Uso queryParams.length + 1 per calcolare dinamicamente l'indice ($3 e $4, oppure $1 e $2)
  query += ` ORDER BY v.velocita_km_h DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2} `;
  queryParams.push(limit, offset);

  try {
      // Eseguo la query sul pool e restituisco solo l'array dei risultati (rows)
      const result = await pool.query(query, queryParams);
      return result.rows;
  } catch(error) {
      throw error; // Propago l'errore al Controller
  }
}

/**
 * Recupera gli asteroidi più pericolosi.
 * Interroga una Vista SQL (v_insight_rischio_massimo) precedentemente creata nel database
 * per alleggerire il carico computazionale di Node.js.
 *
 * @returns {Promise<Array>} Array di oggetti contenenti i dati di rischio aggregati.
 */
async function getInsightRischioMassimo() {
    const sql = `SELECT * FROM v_insight_rischio_massimo;`;
    
    try {
        const result = await pool.query(sql);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Aggrega i dati per consigliare all'utente gli anni storici con il maggior numero di avvistamenti.
 * Interroga la vista spaziale sfruttando funzioni aggregate e GROUP BY direttamente in SQL.
 *
 * @param {number} [limite=5] - Numero massimo di anni da restituire nella classifica.
 * @returns {Promise<Array>} Array contenente l'anno e il rispettivo conteggio totale.
 */
async function getTopAnniAvvistamenti(limite = 5) {
    const sql = `
        SELECT anno_passaggio, COUNT(*) as totale_asteroidi 
        FROM v_mappa_pianeti 
        GROUP BY anno_passaggio 
        ORDER BY totale_asteroidi DESC 
        LIMIT $1;
    `;
    
    try {
        const result = await pool.query(sql, [limite]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Recupera i dati di una specifica finestra temporale per disegnare la mappa interattiva.
 * Costruisce dinamicamente la query sulla vista spaziale (v_mappa_pianeti) a seconda della presenza del mese.
 *
 * @param {number} anno - L'anno di riferimento per filtrare gli avvistamenti.
 * @param {number} [mese] - Il mese specifico (opzionale, 1-12).
 * @returns {Promise<Array>} Array di avvistamenti pronti per essere smistati sui vari pianeti nel frontend.
 */
async function getMappaPianetiByAnno(anno, mese) {
    let sql = `
        SELECT id_nasa, nome, is_pericoloso, data_passaggio, distanza_miss_km, orbita_corpo 
        FROM v_mappa_pianeti
        WHERE anno_passaggio = $1 
    `;

    const params = [anno];

    // Se il controller passa un mese valido, aggiungiamo il filtro
    if (mese) {
        sql += ` AND mese_passaggio = $2 `;
        params.push(mese);
    }

    sql += ` ORDER BY distanza_miss_km ASC; `;

    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

// Esporto le funzioni per farle usare ai Controllers
module.exports = {
  getStatsDashboard,
  getInsightRischioMassimo,
  getTopAnniAvvistamenti,
  getMappaPianetiByAnno
};