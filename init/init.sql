-- Tabella profili
CREATE TABLE IF NOT EXISTS profili (
    id SERIAL PRIMARY KEY,
    nome_profilo VARCHAR(50) NOT NULL,
    creato_il TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CONSTRAINT limite_profili CHECK (id <= 4) -- <-- BLOCCA LA CREAZIONE DEL 5° PROFILO
);

-- Inserimento dei 4 profili di default (che si possono aggiornare con UPDATE)
-- ON CONFLICT per non generare errori se i profili esistono già
INSERT INTO profili (id, nome_profilo) 
VALUES (1, 'Profilo 1'), (2, 'Profilo 2'), (3, 'Profilo 3'), (4, 'Profilo 4') 
ON CONFLICT (id) DO NOTHING;

-- Tabella Anagrafica: Dati statici dell'asteroide
CREATE TABLE IF NOT EXISTS asteroidi (
    id_nasa VARCHAR(50) PRIMARY KEY, -- ID univoco fornito dalla NASA
    nome VARCHAR(100) NOT NULL,
    magnitudine_assoluta DOUBLE PRECISION,
    is_pericoloso BOOLEAN DEFAULT FALSE
);

-- Tabella Dati Orbitali
CREATE TABLE IF NOT EXISTS dati_orbitali (
    asteroide_id VARCHAR(50) PRIMARY KEY REFERENCES asteroidi(id_nasa) ON DELETE CASCADE,
    eccentricita DOUBLE PRECISION,
    inclinazione DOUBLE PRECISION,
    periodo_orbitale_giorni DOUBLE PRECISION
);

-- Tabella Avvistamenti: Dati variabili per ogni passaggio
CREATE TABLE IF NOT EXISTS avvistamenti (
    id SERIAL PRIMARY KEY,
    asteroide_id VARCHAR(50) REFERENCES asteroidi(id_nasa) ON DELETE CASCADE,
    data_passaggio DATE NOT NULL,
    velocita_km_h DOUBLE PRECISION,
    distanza_miss_km DOUBLE PRECISION,
    orbita_corpo VARCHAR(50),
    CONSTRAINT avvistamento_unico UNIQUE(asteroide_id, data_passaggio) -- Evita duplicati dello stesso passaggio
);

-- Tabella Preferiti E Note (Per le operazioni CRUD dell'utente)
CREATE TABLE IF NOT EXISTS note_profili (
    profilo_id INTEGER REFERENCES profili(id) ON DELETE CASCADE,
    asteroide_id VARCHAR(50) REFERENCES asteroidi(id_nasa) ON DELETE CASCADE,
    nota_personale TEXT,
    data_salvataggio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profilo_id, asteroide_id)
);

-- VIEW 1: Indice di Rischio (Insight: unisce pericolosità, distanza minima e velocità)
CREATE OR REPLACE VIEW v_insight_rischio_massimo AS
SELECT 
    a.nome,
    MIN(av.distanza_miss_km) AS distanza_piu_vicina_km,
    MAX(av.velocita_km_h) AS velocita_max_raggiunta,
    COUNT(av.id) AS numero_avvistamenti_totali
FROM asteroidi a
JOIN avvistamenti av ON a.id_nasa = av.asteroide_id
WHERE a.is_pericoloso = TRUE
GROUP BY a.nome
ORDER BY distanza_piu_vicina_km ASC
LIMIT 10;

-- VIEW 2: Dati per il disegno grafico dei pianeti per mese (per il frontend)
CREATE OR REPLACE VIEW v_mappa_pianeti_mese AS
SELECT 
    a.nome,
    a.is_pericoloso,
    av.data_passaggio,
    EXTRACT(MONTH FROM av.data_passaggio) AS mese_passaggio,
    EXTRACT(YEAR FROM av.data_passaggio) AS anno_passaggio,
    av.distanza_miss_km,
    av.orbita_corpo -- Es: 'Earth', 'Mars', 'Juptr'
FROM asteroidi a
JOIN avvistamenti av ON a.id_nasa = av.asteroide_id;