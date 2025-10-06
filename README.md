# Wellness Website

Eine moderne Wellness-Website mit HTML, CSS, JavaScript und Node.js Backend.

## Features

- **Moderne UI/UX**: Responsive Design mit ansprechenden Animationen
- **Service-Katalog**: Übersichtliche Darstellung aller Wellness-Dienstleistungen
- **Detailseiten**: Spezifische Seiten für jeden Service mit ausführlichen Informationen
- **Datenbank-Integration**: SQLite Datenbank für dynamische Inhalte
- **Mobile-First**: Optimiert für alle Geräte
- **SEO-optimiert**: Suchmaschinenfreundliche URLs und Meta-Tags

## Services

### Massagen
- Japanische Lifting-Gesichtsmassage (€85, 60 Min)
- Maderothoerapie (€95, 75 Min)
- Kerzenmassage (€70, 60 Min)
- Aromamassage (€75, 60 Min)
- Sportmassage (€80, 60 Min)

### Fußpflege
- Nagelpilzbehandlung (€45, 45 Min)

### Maniküre
- Klassische Maniküre (€35, 45 Min)

## Installation & Start

### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm

### Installation
```bash
# Dependencies installieren
cd backend
npm install

# Server starten
npm start
```

### Entwicklung
```bash
# Server mit Auto-Reload starten
npm run dev
```

## Projektstruktur

```
wellness-website/
├── backend/
│   ├── server.js          # Express Server
│   ├── package.json       # Backend Dependencies
├── frontend/
│   ├── index.html         # Hauptseite
│   ├── service.html       # Service-Detail Seite
│   ├── styles.css         # CSS Styles
│   ├── script.js          # JavaScript für Hauptseite
│   └── service-detail.js  # JavaScript für Service-Details
├── database/
│   ├── init.sql          # Datenbank Schema & Daten
│   └── wellness.db       # SQLite Datenbank (wird automatisch erstellt)
└── README.md
```

## API Endpoints

- `GET /api/services` - Alle Services
- `GET /api/services/:id` - Service nach ID
- `GET /api/services/url/:seoUrl` - Service nach SEO-URL
- `GET /api/categories` - Alle Kategorien
- `GET /api/categories/:id` - Kategorie nach ID

## Kontakt

**Telefon**: +49 123 456 789  
**Öffnungszeiten**: Mo-Fr: 9:00-18:00, Sa: 9:00-16:00  
**Adresse**: Wellness Straße 123, 12345 Entspannung

## Technologie-Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Datenbank**: SQLite3
- **Styling**: Custom CSS mit Flexbox/Grid
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Playfair Display, Inter)

## Browser-Unterstützung

- Chrome (neueste Version)
- Firefox (neueste Version)
- Safari (neueste Version)
- Edge (neueste Version)
- Mobile Browser (iOS Safari, Chrome Mobile)

## Lizenz

MIT License