/**
 * @file dashboard.js
 * @description Motore frontend (Single Page Application) del progetto NASA Asteroids Dashboard.
 * Gestisce interamente le interazioni dell'utente (DOM manipulation) e comunica in modo 
 * asincrono (Fetch API) con i micro-servizi esposti dal backend Node.js (/api/asteroidi, /api/profili).
 * Si occupa inoltre di orchestrare la renderizzazione e le animazioni del grafico tramite Chart.js.
 * Le operazioni avvengono senza ricaricare la pagina web, garantendo un'esperienza utente fluida.
 */

let myChart;
let currentPageChart = 1; // Variabile globale per la paginazione
const MIN_PROFILO_ID = 1;
const MAX_PROFILO_ID = 4;
const MAX_LUNGHEZZA_NOTA = 500;
const MAX_LUNGHEZZA_NOME = 50;

/**
 * Verifica che l'ID del profilo sia un numero valido e rientri nel range consentito.
 * @param {string|number} id - L'ID del profilo da controllare
 * @returns {boolean} True se valido, False altrimenti
 */
function isProfileIdValid(id) {
    const parsedId = parseInt(id, 10);
    return !isNaN(parsedId) && parsedId >= MIN_PROFILO_ID && parsedId <= MAX_PROFILO_ID;
}

/**
 * Gestisce la navigazione tra le pagine del grafico (avanti e indietro).
 *
 * @param {number} direction - Direzione della paginazione (+1 per avanti, -1 per indietro).
 */
function changeChartPage(direction) {
    // Accettiamo solo i numeri +1 o -1
    if (direction !== 1 && direction !== -1) {
        console.warn("Tentativo di navigazione non valido. Valore consentito: 1 o -1.");
        return; 
    }

    const newPage = currentPageChart + direction;
    if (newPage < 1) return; // Blocca se cerca di andare prima della pagina 1
    
    // Passiamo la nuova pagina alla funzione di caricamento
    loadChart(newPage); 
}

/**
 * Recupera i dati storici degli asteroidi dal backend e aggiorna il grafico a barre.
 * Include la validazione delle date selezionate dall'utente e gestisce le animazioni di Chart.js.
 *
 * @param {number} [requestedPage=1] - Il numero della pagina dei risultati da caricare.
 */
async function loadChart(requestedPage = 1) {
    // Assicuriamoci che requestedPage sia un numero intero valido e >= 1
    const parsedPage = parseInt(requestedPage, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
        console.error("Pagina richiesta non valida. Deve essere un numero maggiore di zero.");
        return; // Blocchiamo l'esecuzione prima di fare la fetch
    }
    // Leggiamo i valori scelti dall'utente
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Controllo validità date
    if (startDate || endDate) {
        if (!startDate || !endDate) {
            alert("Devi inserire sia la data di inizio che quella di fine.");
            return; // Blocca la fetch
        }
        
        // Controllo Regex
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            alert("Le date devono rispettare il formato corretto.");
            return;
        }

        
        // Controllo Esistenza e conversione in Oggetto Date
        const startObj = new Date(startDate);
        const endObj = new Date(endDate);
        if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
            alert("Una delle date inserite non esiste sul calendario.");
            return;
        }

        // Controllo Anno (1800 - 2500)
        const startYear = startObj.getFullYear();
        const endYear = endObj.getFullYear();
        if (startYear < 1800 || startYear > 2500 || endYear < 1800 || endYear > 2500) {
            alert("Le date devono essere comprese tra l'anno 1800 e 2500.");
            return;
        }

        // Controllo Logico
        if (startDate > endDate) {
            alert("La data di inizio non può essere successiva alla data di fine.");
            return;
        }
    }
    
    // Costruiamo l'URL dinamicamente se le date sono state inserite
    let url = `/api/asteroidi/stats?page=${parsedPage}`;
    if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        // Chiamata all'API
        const response = await fetch(url);

        // Controllo status HTTP
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);

        const data = await response.json();

        // Se non ci sono dati (es. database appena creato), non proviamo a disegnare
        if (!data || data.length === 0) {
            if (requestedPage > 1) {
                alert("Non ci sono più dati da mostrare.");
            } else {
                if (myChart) {
                    myChart.data.datasets[0].data = [];
                    myChart.data.labels = [];
                    myChart.update('none');
                }
                alert("Nessun dato presente nel database per il filtro selezionato.");
            }
            return;
        }

        // Se abbiamo i dati, aggiorniamo l'indicatore della pagina corrente
        currentPageChart = requestedPage;
        const pageIndicator = document.getElementById('chartPageIndicator');
        if (pageIndicator) pageIndicator.innerText = `Pagina ${currentPageChart}`;

        const labels = data.map(item => `${item.nome} (${item.data_passaggio.split('T')[0]})`);
        const values = data.map(item => item.velocita_km_h);

        const ctx = document.getElementById('myChart').getContext('2d');
        // Pulizia della memoria
        //if (myChart) { myChart.destroy(); }

        // Svuotiamo il contenitore
        //const chartBox = document.querySelector('.chart-container');
        // Ricreiamo un canvas
        //chartBox.innerHTML = '<canvas id="myChart"></canvas>';
        
        if(myChart){
            // Diciamo al grafico che tutti i valori sono 0 e aggiorniamo senza animazione ('none')
            myChart.data.datasets[0].data = values.map(() => 0);
            myChart.data.labels = labels;
            myChart.update('none'); 

            // Subito dopo, gli diamo i valori veri e facciamo partire l'animazione
            myChart.data.datasets[0].data = values;
            // Aggiorniamo l'evento onClick per il pre-fill dell'ID
            myChart.options.onClick = (event, activeElements) => {
                if (activeElements.length > 0) {
                    const dataIndex = activeElements[0].index;
                    const asteroideId = data[dataIndex].id_nasa; 
                    if(asteroideId) prefillNote(asteroideId);
                }
            };
            myChart.update();
        } else {
            // Se è il primissimo caricamento della pagina
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Velocità (km/h)',
                        data: values,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: { 
                    maintainAspectRatio: false,
                    // Aggiungiamo il controllo manuale dell'animazione
                    animation: {
                        duration: 5000, // Durata in millisecondi (5 secondi)
                        easing: 'easeOutQuart', // Effetto fluido che rallenta alla fine
                        delay: 300
                    },
                    scales: { 
                        y: { beginAtZero: true } 
                    },
                    onClick: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            const dataIndex = activeElements[0].index;
                            const asteroideId = data[dataIndex].id_nasa; 
                            if(asteroideId) prefillNote(asteroideId);
                        }
                    } 
                }
            });
        }
        
        
    } catch (error) {
        console.error("Errore nel caricamento del grafico:", error);
    }
}

/**
 * Avvia la sincronizzazione asincrona dei dati dall'API pubblica della NASA al database locale.
 * Al termine aggiorna automaticamente tutta la dashboard.
 */
async function syncNasaData() {
    try {
        alert("Sincronizzazione avviata! Potrebbe volerci qualche secondo...");
        const response = await fetch('/api/system/fetch-data');
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        const text = await response.text();
        alert(text); 
        // Dopo il sync, aggiorniamo tutta la dashboard
        currentPageChart = 1;
        loadChart(1); 
        loadRischio();
        // Svuota le liste precedenti
        document.getElementById('recommended-years-list').innerHTML = '';
        document.getElementById('list-Earth').innerHTML = '';
        document.getElementById('list-Mars').innerHTML = '';
        document.getElementById('list-Juptr').innerHTML = '';
    } catch (error) {
        console.error("Errore durante la sincronizzazione:", error);
        alert("Si è verificato un errore durante la sincronizzazione.");
    }
}

/**
 * Richiede al server gli avvistamenti per un determinato anno (e opzionalmente mese) 
 * e li smista visivamente nelle rispettive colonne planetarie.
 */
async function loadSpatialMap() {
    const mese = document.getElementById('mapMonth').value;
    const anno = document.getElementById('mapYear').value;

    if(!anno) {
        alert("Inserisci un anno valido per generare la mappa.");
        return;
    }

    const numAnno = parseInt(anno, 10);

    // Controllo validità numerica anno
    if (isNaN(numAnno) || numAnno < 1800 || numAnno > 2500) {
        alert("Inserisci un anno valido (es. 2024).");
        return;
    }
    let url = `/api/asteroidi/mappa?anno=${anno}`;
    
    if (mese) {
        const numMese = parseInt(mese, 10);
         // Controllo validità numerica mese
        if (isNaN(numMese) || numMese < 1 || numMese > 12) {
            alert("Inserisci un mese (1-12) valido.");
            return;
        }
        url += `&mese=${mese}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        const data = await response.json();

        // Svuota le liste precedenti
        document.getElementById('list-Earth').innerHTML = '';
        document.getElementById('list-Mars').innerHTML = '';
        document.getElementById('list-Juptr').innerHTML = '';

        // Popola i pianeti
        data.forEach(ast => {
            const li = document.createElement('li');
            li.style.cursor = "pointer"; // Indica che è cliccabile
            li.onclick = () => prefillNote(ast.id_nasa); // Invia l'ID al form
            if (ast.is_pericoloso) {
                li.classList.add('asteroid-hazardous');
            }
            li.innerHTML = `<strong>${ast.nome}</strong><br>Dist: ${ast.distanza_miss_km.toFixed(2)} km`;
            
            // Smista negli elenchi giusti a seconda dell'orbita
            if(ast.orbita_corpo === 'Earth') document.getElementById('list-Earth').appendChild(li);
            if(ast.orbita_corpo === 'Juptr') document.getElementById('list-Juptr').appendChild(li);
            if(ast.orbita_corpo === 'Mars') document.getElementById('list-Mars').appendChild(li);
        });

    } catch (error) {
        console.error("Errore nel caricamento mappa:", error);
    }
}

/**
 * Interroga la vista analitica del database per recuperare gli asteroidi più pericolosi.
 * Popola l'elenco nel relativo insight box (caricamento automatico).
 */
async function loadRischio() {
    try {
        const resRischio = await fetch('/api/asteroidi/rischio');
        if (!resRischio.ok) throw new Error(`Errore Server: ${resRischio.status}`);
        const datiRischio = await resRischio.json();
        const listRischio = document.getElementById('top-risk-list');
        
        listRischio.innerHTML = ''; // Svuota prima di ricaricare (utile per il sync)
        
        if (datiRischio.length === 0) {
            listRischio.innerHTML = '<li>Nessun asteroide pericoloso.</li>';
            return;
        }

        datiRischio.forEach(item => {
            const tooltipText = `Vel. Max: ${item.velocita_max_raggiunta.toLocaleString()} km/h | Dist. Min: ${item.distanza_piu_vicina_km.toLocaleString()} km.`;
            listRischio.innerHTML += `<li style="cursor: pointer;" onclick="prefillNote('${item.id_nasa}')" title="${tooltipText}">
                                        <strong>${item.nome}</strong> - Avvistato ${item.numero_avvistamenti_totali} volte</li>`;
        });
    } catch (error) {
        console.error("Errore insight rischio:", error);
    }
}

/**
 * Richiede l'insight statistico sugli anni con il maggior numero di avvistamenti.
 * Invia al server il limite scelto dall'utente per la paginazione personalizzata.
 */
async function loadAnni() {
    const limiteInput = document.getElementById('limitAnni').value;
    const listAnni = document.getElementById('recommended-years-list');
    
    const limiteParsed = parseInt(limiteInput, 10);

    // Se il campo NON è vuoto, verifichiamo che sia un numero valido, >= 1 e <= 50
    if (limiteInput !== "" && (isNaN(limiteParsed) || limiteParsed < 1 || limiteParsed > 50)) {
        alert("Inserisci un numero compreso tra 1 e 50, oppure lascia vuoto per il default.");
        return;
    }

    try {
        // Mostra un feedback visivo durante il caricamento
        listAnni.innerHTML = '<em>Caricamento...</em>';

        // Costruiamo l'URL dinamicamente: 
        // Se il campo è vuoto, chiamiamo l'API base (e il backend userà il 5 di default)
        // Se c'è un numero, lo passiamo come query parameter
        let url = '/api/asteroidi/anni-consigliati';
        if (limiteInput !== "") {
            url += `?limite=${limiteInput}`;
        }

        const resAnni = await fetch(url);
        if (!resAnni.ok) throw new Error(`Errore Server: ${resAnni.status}`);
        const datiAnni = await resAnni.json();
        
        listAnni.innerHTML = ''; // Svuota la lista per inserire i nuovi risultati

        if (datiAnni.length === 0) {
            listAnni.innerHTML = '<li>Nessun dato storico disponibile.</li>';
            return;
        }

        datiAnni.forEach(item => {
            listAnni.innerHTML += `<li>Anno: ${item.anno_passaggio} - <strong>${item.totale_asteroidi} asteroidi</strong></li>`;
        });
    } catch (error) {
        console.error("Errore insight anni:", error);
        listAnni.innerHTML = '<li style="color: red;">Errore nel caricamento.</li>';
    }
}

/**
 * Intercetta il cambio di selezione nel menu a tendina dei profili
 * e innesca il ricaricamento asincrono delle note associate.
 */
function changeProfile() {
    loadNotes(); 
}

/**
 * Recupera dal database le note scritte dal profilo correntemente selezionato
 * e le inietta nel DOM della sidebar.
 */
async function loadNotes() {
    const profileId = document.getElementById('profileSelector').value;
    // Controllo validità ID profilo
    if (!isProfileIdValid(profileId)) {
        console.error("ID Profilo non valido.");
        return;
    }
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = '<em>Caricamento note...</em>';

    try {
        const response = await fetch(`/api/profili/${profileId}/note`);
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        const notes = await response.json();
        
        notesContainer.innerHTML = '';
        if(notes.length === 0) {
            notesContainer.innerHTML = '<p>Nessuna nota presente.</p>';
            return;
        }

        notes.forEach(nota => {
            notesContainer.innerHTML += `
                <div class="note-item"style="cursor: pointer;" 
                onclick="prefillNote('${nota.asteroide_id}', '${nota.nota_personale.replace(/'/g, "\\'")}')" 
                title="Clicca per modificare">
                    <strong>Asteroide ID: ${nota.asteroide_id}</strong>
                    <p>${nota.nota_personale}</p>
                    <span class="btn-delete-note" onclick="event.stopPropagation(); deleteNote('${nota.asteroide_id}')">Elimina</span>
                </div>
            `;
        });
    } catch (error) {
        console.error("Errore caricamento note:", error);
        notesContainer.innerHTML = '<p style="color:red;">Errore nel caricamento delle note.</p>';
    }
}

/**
 * Invia al server una nuova nota o l'aggiornamento di una esistente.
 * Effettua validazione client-side su ID profilo, ID asteroide e lunghezza testo.
 */
async function saveNote() {
    const profileId = document.getElementById('profileSelector').value;
    const asteroideId = document.getElementById('noteAsteroidId').value;
    const testoNota = document.getElementById('noteText').value;

    // Controllo validità ID profilo
    if (!isProfileIdValid(profileId)) {
        alert("Profilo non valido.");
        return;
    }

    const asteroideParsed = parseInt(asteroideId, 10);

    // Controllo di validità su ID asteroide e testo nota
    if(isNaN(asteroideParsed) || asteroideParsed < 1 || !testoNota || testoNota.trim() === "") {
        alert("Inserisci un ID asteroide valido (maggiore di zero) e il testo della nota.");
        return;
    }
    if (testoNota.trim().length > MAX_LUNGHEZZA_NOTA) {
        alert(`La nota è troppo lunga. Massimo consentito: ${MAX_LUNGHEZZA_NOTA} caratteri.`);
        return;
    }

    try {
        const response = await fetch(`/api/profili/${profileId}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asteroideId: asteroideId, testoNota: testoNota.trim() })
        });
        
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        document.getElementById('noteAsteroidId').value = '';
        document.getElementById('noteText').value = '';
        loadNotes();
    } catch (error) {
        console.error("Errore salvataggio nota:", error);
        alert("Errore durante il salvataggio della nota.");
    }
}

/**
 * Richiede al server l'eliminazione di una specifica nota dell'utente.
 * @param {string|number} asteroideId - L'ID dell'asteroide associato alla nota
 */
async function deleteNote(asteroideId) {
    const profileId = document.getElementById('profileSelector').value;
    // Controllo validità ID profilo
    if (!isProfileIdValid(profileId)) {
        alert("Profilo non valido per l'eliminazione.");
        return;
    }
    try {
        const response = await fetch(`/api/profili/${profileId}/note/${asteroideId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        loadNotes();
    } catch (error) {
        console.error("Errore cancellazione nota:", error);
        alert("Impossibile eliminare la nota.");
    }
}

/**
 * Popola il menu a tendina con i profili salvati nel database.
 *
 * @param {number|string} [profileId=1] - L'ID del profilo da mantenere o impostare come selezionato.
 */
async function loadProfiles(profileId = 1) {
    try {
        const response = await fetch('/api/profili');
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        const profili = await response.json(); 

        const selector = document.getElementById('profileSelector');
        
        if (!selector.options || selector.options.length === 0) {
        // Riempiamo la tendina con i dati del database
            profili.forEach(profilo => {
                const option = document.createElement('option');
                option.value = profilo.id;
                option.textContent = profilo.nome_profilo;
                selector.appendChild(option);
            });
        } else {
            // Se le option esistono, aggiorniamo solo il testo in modo "silenzioso"
            profili.forEach((profilo, index) => {
                if(selector.options[index]) {
                    selector.options[index].textContent = profilo.nome_profilo;
                }
            });
        }

         selector.value = profileId;

        // Dopo aver caricato i profili, carichiamo le note del primo profilo selezionato
        loadNotes();

    } catch (error) {
        console.error("Errore nel caricamento dei profili:", error);
    }
}

/**
 * Permette all'utente di rinominare il profilo correntemente selezionato.
 */
async function renameProfile() {
    const selector = document.getElementById('profileSelector');
    const profileId = selector.value;
    const currentName = selector.options[selector.selectedIndex].text;
    // Controllo validità ID profilo
    if (!isProfileIdValid(profileId)) {
        alert("Profilo non valido per la rinomina.");
        return;
    }

    // Chiediamo all'utente il nuovo nome tramite un semplice popup
    const nuovoNome = prompt("Inserisci il nuovo nome per questo profilo:", currentName);

    // Se l'utente ha scritto qualcosa ed è diverso da prima...
    if (nuovoNome && nuovoNome.trim() !== "" && nuovoNome !== currentName) {
        if (nuovoNome.trim().length > MAX_LUNGHEZZA_NOME) {
            alert(`Il nome è troppo lungo. Massimo consentito: ${MAX_LUNGHEZZA_NOME} caratteri.`);
            return;
        }
        try {
            // Chiamiamo la tua rotta PUT /api/profili/:id
            const response = await fetch(`/api/profili/${profileId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuovoNome: nuovoNome.trim() })
            });
            if (!response.ok) throw new Error(`Errore Server: ${response.status}`);

            // Se va a buon fine aggiorno il nome del profilo selezionato
            selector.options[selector.selectedIndex].text = nuovoNome.trim();
            alert("Nome aggiornato con successo!");
             
            
        } catch (error) {
            console.error("Errore durante la rinomina del profilo:", error);
            alert("Errore durante il salvataggio del nome.");
        }
    }
}

/**
 * Pre-compila il form laterale quando l'utente 
 * interagisce con i grafici o le liste cliccabili.
 *
 * @param {string|number} asteroideId - L'ID dell'asteroide da iniettare nel form.
 * @param {string} [testo=''] - Il testo opzionale di una nota già esistente.
 */
function prefillNote(asteroideId, testo = '') {
    document.getElementById('noteAsteroidId').value = asteroideId;
    document.getElementById('noteText').value = testo.replace(/\\'/g, "'");
    
    // Evidenzia visivamente il box per l'utente
    const noteBox = document.querySelector('.add-note-box');
    noteBox.style.border = "2px solid #0056b3";
    setTimeout(() => noteBox.style.border = "none", 1500);
    noteBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Richiede al server il ripristino del profilo selezionato 
 * (cancellazione di tutte le note e reset del nome di default).
 */
async function resetProfile() {
    const selector = document.getElementById('profileSelector');
    const profileId = selector.value;

    if (!isProfileIdValid(profileId)) {
        alert("Profilo non valido per il reset.");
        return;
    }

    const conferma = confirm("Sei sicuro di voler resettare questo profilo? Tutte le tue note verranno eliminate definitivamente.");
    if (!conferma) return;

    try {
        const response = await fetch(`/api/profili/${profileId}`, { method: 'DELETE' });
        
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        alert("Profilo resettato con successo!");
        
        // Ricarichiamo l'elenco dei profili per ripristinare il nome di default nella tendina
        // All'interno verrà chiamata loadNotes() che svuoterà la lista delle note
        await loadProfiles(profileId);

    } catch (error) {
        console.error("Errore durante il reset del profilo:", error);
        alert("Impossibile resettare il profilo.");
    }
}

// Inizializza l'interfaccia al termine del caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();        // 1. Carica i profili dal DB e riempie la tendina
    loadChart(1);          // 2. Carica il grafico
    loadRischio();       // 3. Carica l'insight
    //loadNotes() verrà chiamata alla fine di loadProfiles()
});