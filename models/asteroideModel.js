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
async function getStatsDashboard(startDate, endDate) {
  let query = `
    SELECT a.nome, v.velocita_km_h, v.data_passaggio
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
  query += ` ORDER BY v.velocita_km_h DESC LIMIT 10 `;

  // Eseguo la query sul pool e restituisco solo l'array dei risultati (rows)
  const result = await pool.query(query, queryParams);
  return result.rows;
}

/**
 * Recupera la Top 10 degli asteroidi più pericolosi.
 * Query fissa, per una sezione "In Evidenza" della dashboard.
 */
async function getInsightRischioMassimo() {
    const sql = `SELECT * FROM v_insight_rischio_massimo;`;
    // TODO: eseguire query e ritornare i dati
}

/**
 * Aggrega i dati per consigliare all'utente quali mesi/anni guardare.
 * Sfrutta funzioni aggregate e GROUP BY come richiesto nei requisiti minimi.
 */
async function getTopMesiAnniAvvistamenti(limite = 5) {
    const sql = `
        SELECT anno_passaggio, mese_passaggio, COUNT(*) as totale_asteroidi 
        FROM v_mappa_pianeti_mese 
        GROUP BY anno_passaggio, mese_passaggio 
        ORDER BY totale_asteroidi DESC 
        LIMIT $1;
    `;
    // TODO: eseguire query passando 'limite' e ritornare i dati
}

/**
 * Recupera i dati di una specifica finestra temporale per disegnare la mappa interattiva.
 */
async function getMappaPianetiByMeseAnno(mese, anno) {
    const sql = `
        SELECT nome, is_pericoloso, data_passaggio, distanza_miss_km, orbita_corpo 
        FROM v_mappa_pianeti_mese 
        WHERE mese_passaggio = $1 AND anno_passaggio = $2
        ORDER BY distanza_miss_km DESC; 
    `;
    // TODO: eseguire query passando 'mese' e 'anno'
}

// Esporto le funzioni per farle usare ai Controllers
module.exports = {
  getStatsDashboard,
  getInsightRischioMassimo,
  getTopMesiAnniAvvistamenti,
  getMappaPianetiByMeseAnno
};