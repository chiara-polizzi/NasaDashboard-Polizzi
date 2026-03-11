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
    console.log("Inizio recupero dati dalla NASA...");
    
    // 1. Chiamata API (Esempio: asteroidi di oggi)
    const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key=${NASA_API_KEY}`);
    const asteroidsData = response.data.near_earth_objects;

    // 2. Iterazione sui dati ricevuti
    for (const date in asteroidsData) {
      for (const asteroid of asteroidsData[date]) {
        
        // Salvataggio nella tabella Anagrafica (Asteroidi)
        // Uso ON CONFLICT per non duplicare l'asteroide se già esiste
        await pool.query(
          `INSERT INTO asteroidi (id, nome, diametro_max_km, is_potentially_hazardous)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [asteroid.id, asteroid.name, asteroid.estimated_diameter.kilometers.estimated_diameter_max, asteroid.is_potentially_hazardous]
        );

        // Salvataggio nella tabella Dettaglio (Avvistamenti)
        for (const approach of asteroid.close_approach_data) {
          await pool.query(
            `INSERT INTO avvistamenti (asteroide_id, data_passaggio, velocita_km_h, distanza_miss_km, orbita_corpo)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [asteroid.id, approach.close_approach_date, approach.relative_velocity.kilometers_per_hour, approach.miss_distance.kilometers, approach.orbiting_body]
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