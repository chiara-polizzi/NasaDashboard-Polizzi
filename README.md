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

3. Apri la Dashboard:
   Apri il browser e vai su http://localhost:3000. Al primissimo avvio l'interfaccia si caricherà correttamente, ma il grafico risulterà vuoto. Questo è il comportamento atteso, poiché la struttura delle tabelle è stata creata ma non è ancora presente alcuno storico dati al loro interno.
   Agli avvii successivi la dashboard caricherà e renderizzerà immediatamente il grafico attingendo alla base dati locale perchè grazie alla configurazione dei Volumi Docker, i dati scaricati nelle sessioni precedenti permangono in memoria.

4. Scarica i dati dalla NASA:
   Dalla pagina web, clicca sul pulsante verde "Sincronizza Dati NASA". Attendi qualche secondo per il download e, una volta comparso l'avviso di conferma, il grafico si popolerà automaticamente con i dati aggiornati.
   
5. Gestione dei Dati e Reset:
    I dati (profili utente, note e dati NASA) sono salvati in un Volume Docker permanente. Se spegni il progetto con docker-compose down, i dati non andranno persi. Se desideri resettare completamente il database e ricominciare da zero (forzando la rilettura del file init.sql), esegui: docker-compose down -v (la flag -v elimina i volumi associati).

## Struttura del Progetto
* /init/init.sql: Script per la creazione automatica delle tabelle e delle viste analitiche.
* /models: Livello DAO (Data Access Object) per l'interazione sicura con PostgreSQL, incapsulando la logica SQL.
* /controllers: Logica di business dell'applicazione, gestisce le richieste client e coordina i modelli.
* /routes: Il "centralino" dell'applicazione. È diviso in più file separati per smistare le richieste web in modo ordinato e facile da leggere.
* /services: Moduli dedicati alle chiamate esterne (es. API NASA) e alla pulizia/snellimento dei payload JSON.
* app.js: Entry-point del backend, snellito per gestire unicamente l'avvio del server Express e l'iniezione dei middleware.
* /public: Contiene tutti gli file statici per il frontend:
  * /public/index.html: Struttura della dashboard utente.
  * /public/css/style.css: Fogli di stile separati per l'interfaccia grafica.
  * /public/js/dashboard.js: Logica asincrona di frontend e renderizzazione del grafico tramite Chart.js.
* docker-compose.yml e Dockerfile: File per l'orchestrazione, configurati con Volumi persistenti per non perdere i dati al riavvio.

## Feature Implementate
* Architettura MVC Modulare: Backend Node.js refattorizzato seguendo il pattern Model-View-Controller per garantire scalabilità e pulizia del codice.
* Sicurezza Database: Prevenzione attiva delle SQL Injection tramite l'utilizzo sistematico di Prepared Statements.
* Integrazione API: Connessione all'API NASA NeoWs con logica di caching locale.
* Persistenza Relazionale: Dati salvati in PostgreSQL per garantire l'integrità referenziale.
* Query Analitica e Filtri: Utilizzo di JOIN SQL per estrarre le velocità di passaggio e funzionalità di filtraggio dei dati per periodo temporale.