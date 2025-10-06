# Basis-Image
FROM node:18

# Arbeitsverzeichnis im Container
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm install

# Restliche Dateien kopieren
COPY . .

# Port freigeben
EXPOSE 80

# Startbefehl
CMD ["npm", "start"]
