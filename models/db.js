/**
 * @file db.js
 * @description Modulo di configurazione e connessione al database PostgreSQL.
 * Crea un pool di connessioni riutilizzabile per gestire in modo efficiente gli accessi concorrenti,
 * istanziando i parametri di connessione definiti nell'architettura Docker.
 */

const { Pool } = require('pg');

// Configuro la connessione al database usando le credenziali definite in docker-compose
// Lo metto in un file separato così non devo riscriverlo ogni volta che mi serve il DB!
const pool = new Pool({
  connectionString: 'postgres://chiara_polizzi:password123@db:5432/nasa_db'
});

// Esporto l'oggetto pool in modo da poterlo importare ('require') nei vari Model
module.exports = pool;