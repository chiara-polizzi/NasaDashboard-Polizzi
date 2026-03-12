const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configurazione della connessione al database
const pool = new Pool({
  connectionString: 'postgres://chiara_polizzi:password123@db:5432/nasa_db'
});

const NASA_API_KEY = '8S4z9xeA4LHErrYx4b99wltzJ002Gd4WfBpkRXPs'; // chiave da api.nasa.gov

// Funzione per scaricare e salvare i dati
async function fetchAndSaveNasaData() {
  try {
    console.log("Inizio recupero dati dalla NASA... (Catalogo Completo)...");
    
    // 1. Chiamata API (Esempio: asteroidi di oggi)
    const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/neo/browse?detailed=true&api_key=${NASA_API_KEY}`);
    const asteroidsData = response.data.near_earth_objects;

    // 2. Iterazione sui dati ricevuti (Con 'browse' i dati sono un array semplice)
    for (const asteroid of asteroidsData) {
        
        // --- A. Salvataggio in Asteroidi (Nuovo schema) ---
        await pool.query(
          `INSERT INTO asteroidi (id_nasa, nome, magnitudine_assoluta, is_pericoloso)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id_nasa) DO NOTHING`,
          [asteroid.id, asteroid.name, asteroid.absolute_magnitude_h, asteroid.is_potentially_hazardous]
        );

        // --- B. Salvataggio in Dati Orbitali (La nostra tabella di normalizzazione!) ---
        if (asteroid.orbital_data) {
            await pool.query(
              `INSERT INTO dati_orbitali (asteroide_id, eccentricita, inclinazione, periodo_orbitale_giorni)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (asteroide_id) DO NOTHING`,
              [
                asteroid.id, 
                asteroid.orbital_data.eccentricity, 
                asteroid.orbital_data.inclination, 
                asteroid.orbital_data.orbital_period
              ]
            );
        }

        // --- C. Salvataggio in Avvistamenti ---
        // Attenzione: alcuni asteroidi potrebbero non avere close_approach_data nel browse
        if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
            for (const approach of asteroid.close_approach_data) {
              await pool.query(
                `INSERT INTO avvistamenti (asteroide_id, data_passaggio, velocita_km_h, distanza_miss_km, orbita_corpo)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT ON CONSTRAINT avvistamento_unico DO NOTHING`,
                [
                  asteroid.id, 
                  approach.close_approach_date, 
                  approach.relative_velocity.kilometers_per_hour, 
                  approach.miss_distance.kilometers, 
                  approach.orbiting_body
                ]
              );
            }
        }
    }
    console.log("Dati salvati con successo nel database!");
  } catch (err) {
    console.error("Errore durante il recupero o il salvataggio:", err.message);
  }
}

// Rotta per attivare il download manualmente
app.get('/fetch-data', async (req, res) => {
  await fetchAndSaveNasaData();
  res.send('Processo di sincronizzazione avviato. Controlla i log di Docker!');
});

app.listen(port, () => {
  console.log(`App di Chiara in ascolto su http://localhost:${port}`);
});

// Serve i file statici (HTML, CSS, JS) dalla cartella 'public'
app.use(express.static('public'));

// Rotta che restituisce i dati per la dashboard
app.get('/api/stats', async (req, res) => {
  try {
    // Recuperiamo le date passate dall'utente tramite l'URL
    const { startDate, endDate } = req.query;

    let query = `
      SELECT a.nome, v.velocita_km_h, v.data_passaggio
      FROM asteroidi a
      JOIN avvistamenti v ON a.id_nasa = v.asteroide_id
    `;
    
    // Array per i parametri sicuri
    const queryParams = [];

    // Se l'utente ha inserito entrambe le date, aggiungiamo il filtro WHERE
    if (startDate && endDate) {
      query += ` WHERE v.data_passaggio >= $1 AND v.data_passaggio <= $2 `;
      queryParams.push(startDate, endDate);
    }

    query += ` ORDER BY v.velocita_km_h DESC LIMIT 10 `;

    // Eseguiamo la query passando i parametri (se ci sono)
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore nel recupero dei dati");
  }
});