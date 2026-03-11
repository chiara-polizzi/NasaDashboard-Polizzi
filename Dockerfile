# Uso un'immagine leggera di Node.js
FROM node:20-slim

# Creo la cartella di lavoro nel container
WORKDIR /usr/src/app

# Copio i file delle dipendenze
COPY package*.json ./

# Installo le librerie
RUN npm install

# Copio il resto del codice
COPY . .

# Espondo la porta 3000
EXPOSE 3000

# Comando per avviare l'app
CMD ["node", "app.js"]