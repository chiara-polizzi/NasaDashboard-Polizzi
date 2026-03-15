let myChart;

async function loadChart() {
    // Leggiamo i valori scelti dall'utente
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Costruiamo l'URL dinamicamente se le date sono state inserite
    let url = '/api/asteroidi/stats';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        // Chiamata all'API
        const response = await fetch(url);
        const data = await response.json();

        // Se non ci sono dati (es. database appena creato), non proviamo a disegnare
        if (!data || data.length === 0) {
            console.log("Nessun dato presente nel database.");
            return;
        }

        const labels = data.map(item => `${item.nome} (${item.data_passaggio.split('T')[0]})`);
        const values = data.map(item => item.velocita_km_h);

        const ctx = document.getElementById('myChart').getContext('2d');
        if (myChart) { myChart.destroy(); }

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
            options: { scales: { y: { beginAtZero: true } } }
        });
    } catch (error) {
        console.error("Errore nel caricamento del grafico:", error);
    }
}

async function syncNasaData() {
    try {
        alert("Sincronizzazione avviata! Potrebbe volerci qualche secondo...");
        const response = await fetch('/api/system/fetch-data');
        const text = await response.text();
        alert(text); 
        loadChart(); 
    } catch (error) {
        console.error("Errore durante la sincronizzazione:", error);
        alert("Si è verificato un errore durante la sincronizzazione.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadChart();
});