const express = require('express');
// Importo le mie rotte (il centralino)
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = 3000;

// Middleware per il parsing del JSON (ci servirà per le operazioni CRUD dei profili)
// Intercetta le richieste in ingresso e ne trasforma il corpo da testo grezzo a oggetto JavaScript.
app.use(express.json());

app.listen(port, () => {
  console.log(`App di Chiara in ascolto su http://localhost:${port}`);
});

// Serve i file statici (HTML, CSS, JS) dalla cartella 'public'
app.use(express.static('public'));

// Tutte le chiamate che iniziano con '/' o '/api' verranno gestite dal nostro centralino apiRoutes
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Aggiunto per far funzionare /fetch-data direttamente come prima