const axios = require('axios');
// Importo il pool del database
const pool = require('../models/db');

const NASA_API_KEY = '8S4z9xeA4LHErrYx4b99wltzJ002Gd4WfBpkRXPs'; // chiave da api.nasa.gov

// Funzione Service per scaricare e salvare i dati
async function fetchAndSaveNasaData() {
  try {
    console.log("Inizio recupero dati dalla NASA... (Catalogo Completo)...");
    
    // 1. Chiamata API all'endpoint neo/browse
    const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/neo/browse?detailed=true&api_key=${NASA_API_KEY}`);
    const asteroidsData = response.data.near_earth_objects;

    // 2. Iterazione sui dati ricevuti.
    // Applico il concetto di "snellimento" dati:
    // estraggo e salvo SOLO i campi previsti dal mio schema relazionale per non appesantire il DB.
    for (const asteroid of asteroidsData) {
        
        // Salvataggio in Asteroidi
        await pool.query(
          `INSERT INTO asteroidi (id_nasa, nome, magnitudine_assoluta, is_pericoloso)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id_nasa) DO NOTHING`,
          [asteroid.id, asteroid.name, asteroid.absolute_magnitude_h, asteroid.is_potentially_hazardous]
        );

        // Salvataggio in Dati Orbitali
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

        // Salvataggio in Avvistamenti
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
    return { success: true, message: "Sincronizzazione completata" };
  } catch (err) {
    console.error("Errore durante il recupero o il salvataggio:", err.message);
    // Rilancio l'errore al controller per farglielo gestire
    throw new Error("Impossibile sincronizzare i dati con la NASA"); 
  }
}

module.exports = {
  fetchAndSaveNasaData
};