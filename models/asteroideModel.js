// Importo la connessione al database che ho configurato nell'altro file
const pool = require('./db');

// Queste funzioni si occupano SOLO di interrogare il DB per i dati della dashboard.
// Nascondono la query SQL al resto dell'applicazione (approccio DAO).

/**
 * Estraggo i dati (nome, velocità e data di passaggio) per il grafico principale.
 * Se l'utente seleziona un periodo di tempo, costruisco la query dinamicamente 
 * per filtrare i risultati.
 *
 * @param {string} [startDate] - Data di inizio ricerca (opzionale, formato YYYY-MM-DD)
 * @param {string} [endDate] - Data di fine ricerca (opzionale, formato YYYY-MM-DD)
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
 * Recupera la Top 10 degli asteroidi più pericolosi.
 * Query fissa, per una sezione "In Evidenza" della dashboard.
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
 * Aggrega i dati per consigliare all'utente quali mesi/anni guardare.
 * Sfrutta funzioni aggregate e GROUP BY come richiesto nei requisiti minimi.
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