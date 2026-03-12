# NASA Asteroids Dashboard - Test Pratico Developer

**Autore:** Chiara Polizzi

Questo progetto è una soluzione Full-Stack per il recupero, la persistenza e l'analisi dei dati provenienti dall'API pubblica della NASA (NeoWs). È stato sviluppato per valutare le competenze di progettazione architetturale, gestione database relazionali e integrazione API.

## Stack Tecnologico
* Infrastruttura: Docker e Docker Compose
* Backend: Node.js, Express.js, Axios
* Database: PostgreSQL (Schema relazionale normalizzato)
* Frontend: HTML5, JS Vanilla, Chart.js

## Prerequisiti
Per eseguire il progetto è necessario avere installato:
* Docker Desktop (con virtualizzazione attiva)
* Un client database come DBeaver (opzionale, per esplorare i dati SQL)

## Guida all'Avvio 

1. Clona la repository sul tuo PC:
   git clone https://github.com/tuo-username/NasaDashboard-Polizzi.git
   cd NasaDashboard-Polizzi

2. Avvia i container tramite Docker Compose:
   docker-compose up --build

3. Inizializza e popola il database:
   Apri il browser e visita http://localhost:3000/fetch-data per avviare il download asincrono dei dati dalla NASA.

4. Visualizza la Dashboard:
   Visita http://localhost:3000 per visualizzare la dashboard interattiva con i filtri applicati.

5. Gestione dei Dati e Reset:
    I dati (profili utente, note e dati NASA) sono salvati in un Volume Docker permanente. Se spegni il progetto con docker-compose down, i dati non andranno persi. Se desideri resettare completamente il database e ricominciare da zero (forzando la rilettura del file init.sql), esegui: docker-compose down -v (la flag -v elimina i volumi associati).

## Struttura del Progetto
* /init/init.sql: Script per la creazione automatica delle tabelle e delle viste analitiche.
* app.js: Backend applicativo. Gestisce le chiamate all'API NASA, le operazioni CRUD sui profili e l'interrogazione del database.
* /public/index.html: Interfaccia utente interattiva.
* docker-compose.yml e Dockerfile: File per l'orchestrazione, configurati con Volumi persistenti per non perdere i dati al riavvio.

## Feature Implementate
* Integrazione API: Connessione all'API NASA NeoWs.
* Persistenza Relazionale: Dati salvati in PostgreSQL per garantire l'integrità referenziale.
* Query Analitica e Filtri: Utilizzo di JOIN SQL per estrarre le velocità di passaggio e funzionalità di filtraggio dei dati per periodo temporale.