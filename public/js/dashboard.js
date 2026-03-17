let myChart;

async function loadChart() {
    // Leggiamo i valori scelti dall'utente
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Controllo validità date
    if (startDate && endDate && startDate > endDate) {
        alert("La data di inizio non può essere successiva alla data di fine.");
        return;
    }
    
    // Costruiamo l'URL dinamicamente se le date sono state inserite
    let url = '/api/asteroidi/stats';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        // Chiamata all'API
        const response = await fetch(url);

        // Controllo status HTTP
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);

        const data = await response.json();

        // Se non ci sono dati (es. database appena creato), non proviamo a disegnare
        if (!data || data.length === 0) {
            console.log("Nessun dato presente nel database.");
            return;
        }

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
            myChart.update('none'); 

            // Subito dopo, gli diamo i valori veri e facciamo partire l'animazione
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = values;
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
                    } 
                }
            });
        }
        
        
    } catch (error) {
        console.error("Errore nel caricamento del grafico:", error);
    }
}

async function syncNasaData() {
    try {
        alert("Sincronizzazione avviata! Potrebbe volerci qualche secondo...");
        const response = await fetch('/api/system/fetch-data');
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        const text = await response.text();
        alert(text); 
        // Dopo il sync, aggiorniamo tutta la dashboard
        loadChart(); 
        loadRischio();
        // Svuota le liste precedenti
        document.getElementById('recommended-months-list').innerHTML = '';
        document.getElementById('list-Earth').innerHTML = '';
        document.getElementById('list-Mars').innerHTML = '';
        document.getElementById('list-Juptr').innerHTML = '';
    } catch (error) {
        console.error("Errore durante la sincronizzazione:", error);
        alert("Si è verificato un errore durante la sincronizzazione.");
    }
}

async function loadSpatialMap() {
    const mese = document.getElementById('mapMonth').value;
    const anno = document.getElementById('mapYear').value;

    if(!mese || !anno) {
        alert("Inserisci un mese e un anno validi per la mappa.");
        return;
    }

    const numMese = parseInt(mese, 10);
    const numAnno = parseInt(anno, 10);

    // Controllo validità numerica Mese e Anno
    if (isNaN(numMese) || numMese < 1 || numMese > 12 || isNaN(numAnno) || numAnno < 1900 || numAnno > 2100) {
        alert("Inserisci un mese (1-12) e un anno validi (es. 2024).");
        return;
    }

    try {
        const response = await fetch(`/api/asteroidi/mappa?mese=${mese}&anno=${anno}`);
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        const data = await response.json();

        // Svuota le liste precedenti
        document.getElementById('list-Earth').innerHTML = '';
        document.getElementById('list-Mars').innerHTML = '';
        document.getElementById('list-Juptr').innerHTML = '';

        // Popola i pianeti
        data.forEach(ast => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${ast.nome}</strong><br>Dist: ${ast.distanza_miss_km.toFixed(2)} km`;
            
            // Smista negli elenchi giusti a seconda dell'orbita
            if(ast.orbita_corpo === 'Earth') document.getElementById('list-Earth').appendChild(li);
            if(ast.orbita_corpo === 'Mars') document.getElementById('list-Mars').appendChild(li);
            if(ast.orbita_corpo === 'Juptr') document.getElementById('list-Juptr').appendChild(li);
        });

    } catch (error) {
        console.error("Errore nel caricamento mappa:", error);
    }
}

// Questa funzione gestisce solo gli asteroidi pericolosi (caricamento automatico)
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
            listRischio.innerHTML += `<li><strong>${item.nome}</strong> - Avvistato ${item.numero_avvistamenti_totali} volte</li>`;
        });
    } catch (error) {
        console.error("Errore insight rischio:", error);
    }
}

// Questa funzione scatta SOLO quando l'utente clicca "Mostra" (caricamento opzionale)
async function loadMesi() {
    const limiteInput = document.getElementById('limitMesi').value;
    const listMesi = document.getElementById('recommended-months-list');
    
    const limiteParsed = parseInt(limiteInput, 10);

    // Se il campo NON è vuoto, verifichiamo che sia un numero valido, >= 1 e <= 50
    if (limiteInput !== "" && (isNaN(limiteParsed) || limiteParsed < 1 || limiteParsed > 50)) {
        alert("Inserisci un numero compreso tra 1 e 50, oppure lascia vuoto per il default.");
        return;
    }

    try {
        // Mostra un feedback visivo durante il caricamento
        listMesi.innerHTML = '<em>Caricamento...</em>';

        // Costruiamo l'URL dinamicamente: 
        // Se il campo è vuoto, chiamiamo l'API base (e il backend userà il 5 di default)
        // Se c'è un numero, lo passiamo come query parameter
        let url = '/api/asteroidi/mesi-consigliati';
        if (limiteInput !== "") {
            url += `?limite=${limiteInput}`;
        }

        const resMesi = await fetch(url);
        if (!resMesi.ok) throw new Error(`Errore Server: ${resMesi.status}`);
        const datiMesi = await resMesi.json();
        
        listMesi.innerHTML = ''; // Svuota la lista per inserire i nuovi risultati

        if (datiMesi.length === 0) {
            listMesi.innerHTML = '<li>Nessun dato storico disponibile.</li>';
            return;
        }

        datiMesi.forEach(item => {
            listMesi.innerHTML += `<li>Mese: ${item.mese_passaggio} / Anno: ${item.anno_passaggio} - <strong>${item.totale_asteroidi} asteroidi</strong></li>`;
        });
    } catch (error) {
        console.error("Errore insight mesi:", error);
        listMesi.innerHTML = '<li style="color: red;">Errore nel caricamento.</li>';
    }
}

function changeProfile() {
    loadNotes(); // Quando l'utente cambia nel menu a tendina, carica le sue note
}

async function loadNotes() {
    const profileId = document.getElementById('profileSelector').value;
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
                <div class="note-item">
                    <strong>Asteroide ID: ${nota.asteroide_id}</strong>
                    <p>${nota.nota_personale}</p>
                    <span class="btn-delete-note" onclick="deleteNote('${nota.asteroide_id}')">Elimina</span>
                </div>
            `;
        });
    } catch (error) {
        console.error("Errore caricamento note:", error);
        notesContainer.innerHTML = '<p style="color:red;">Errore nel caricamento delle note.</p>';
    }
}

async function saveNote() {
    const profileId = document.getElementById('profileSelector').value;
    const asteroideId = document.getElementById('noteAsteroidId').value;
    const testoNota = document.getElementById('noteText').value;

    const asteroideParsed = parseInt(asteroideId, 10);

    // Controllo di validità su ID asteroide e testo nota
    if(isNaN(asteroideParsed) || asteroideParsed < 1 || !testoNota || testoNota.trim() === "") {
        alert("Inserisci un ID asteroide valido (maggiore di zero) e il testo della nota.");
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

async function deleteNote(asteroideId) {
    const profileId = document.getElementById('profileSelector').value;
    try {
        const response = await fetch(`/api/profili/${profileId}/note/${asteroideId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        loadNotes();
    } catch (error) {
        console.error("Errore cancellazione nota:", error);
        alert("Impossibile eliminare la nota.");
    }
}

// Chiama GET /api/profili e riempie il <select>
async function loadProfiles() {
    try {
        const response = await fetch('/api/profili');
        if (!response.ok) throw new Error(`Errore Server: ${response.status}`);
        
        const profili = await response.json(); 

        const selector = document.getElementById('profileSelector');
        
        // Svuotiamo la tendina attuale
        selector.innerHTML = ''; 

        // Riempiamo la tendina con i dati veri del database
        profili.forEach(profilo => {
            const option = document.createElement('option');
            option.value = profilo.id;
            option.textContent = profilo.nome_profilo;
            selector.appendChild(option);
        });

        // Dopo aver caricato i profili, carichiamo le note del primo profilo selezionato
        loadNotes();

    } catch (error) {
        console.error("Errore nel caricamento dei profili:", error);
    }
}

// Rinomina il profilo attualmente selezionato
async function renameProfile() {
    const selector = document.getElementById('profileSelector');
    const profileId = selector.value;
    const currentName = selector.options[selector.selectedIndex].text;

    // Chiediamo all'utente il nuovo nome tramite un semplice popup
    const nuovoNome = prompt("Inserisci il nuovo nome per questo profilo:", currentName);

    // Se l'utente ha scritto qualcosa ed è diverso da prima...
    if (nuovoNome && nuovoNome.trim() !== "" && nuovoNome !== currentName) {
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

// All'avvio della pagina, carica i dati principali
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();        // 1. Carica i profili dal DB e riempie la tendina
    loadChart();          // 2. Carica il grafico
    loadRischio();       // 3. Carica l'insight
    //loadNotes() verrà chiamata alla fine di loadProfiles()
});