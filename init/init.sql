-- Tabella Anagrafica: Dati statici dell'oggetto celeste
CREATE TABLE IF NOT EXISTS asteroidi (
    id VARCHAR(50) PRIMARY KEY, -- ID univoco fornito dalla NASA
    nome VARCHAR(100) NOT NULL,
    diametro_min_km DOUBLE PRECISION,
    diametro_max_km DOUBLE PRECISION,
    is_potentially_hazardous BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Avvistamenti: Dati variabili per ogni passaggio
CREATE TABLE IF NOT EXISTS avvistamenti (
    id SERIAL PRIMARY KEY,
    asteroide_id VARCHAR(50) REFERENCES asteroidi(id) ON DELETE CASCADE,
    data_passaggio DATE NOT NULL,
    velocita_km_h DOUBLE PRECISION,
    distanza_miss_km DOUBLE PRECISION,
    orbita_corpo VARCHAR(50),
    UNIQUE(asteroide_id, data_passaggio) -- Evita duplicati dello stesso passaggio
);

-- Esempio di View per la Query Analitica richiesta dal test
-- Calcola la velocità media e il numero di avvistamenti per mese
CREATE OR REPLACE VIEW analisi_mensile_asteroidi AS
SELECT 
    EXTRACT(MONTH FROM data_passaggio) AS mese,
    COUNT(*) AS totale_avvistamenti,
    AVG(velocita_km_h) AS velocita_media_mensile
FROM avvistamenti
GROUP BY mese
ORDER BY mese;