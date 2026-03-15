const express = require('express');

// Importo i tre router specializzati
const asteroideRoutes = require('./routes/asteroideRoutes');
const profiloRoutes = require('./routes/profiloRoutes');
const syncRoutes = require('./routes/syncRoutes');

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

// Dico ad Express quale "prefisso" usare per ogni gruppo di rotte
app.use('/api/asteroidi', asteroideRoutes);
app.use('/api/profili', profiloRoutes);
app.use('/api/system', syncRoutes); 