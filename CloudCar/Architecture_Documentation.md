# CloudCar WebShop - Architektur Dokumentation

## Architecture Component Descriptions

### ACD1: WebShop Service (Frontend & Backend)
Das WebShop Service stellt die Haupt-Webanwendung des CloudCar Merchandise Shops dar und fungiert als zentraler Einstiegspunkt für alle Benutzerinteraktionen. Die Komponente implementiert sowohl die Benutzeroberfläche als auch die Backend-Logik für (1) die Produktdarstellung mit erweiterten Medienfunktionen, (2) die Warenkorb-Funktionalität mit Session-Management, (3) die Suchfunktionalität mit Echtzeit-Filterung, sowie (4) die Währungsumrechnung mit externen APIs. Das Service nutzt Server-Side Rendering mit EJS-Templates und ist einem Unpredictable Workload ausgesetzt, da es als primärer Endpunkt für alle Benutzeranfragen dient.

**Technische Spezifikationen:**
- Node.js Express Framework
- EJS Template Engine für Server-Side Rendering
- Express-Session für Session Management
- MySQL2 mit Connection Pooling
- Port: 8080 (konfigurierbar via APP_PORT)

**Öffentliche APIs:**
- `GET /` - Startseite mit Produktliste
- `GET /cart` - Warenkorb-Anzeige
- `POST /cart/add` - Produkt zum Warenkorb hinzufügen
- `POST /cart/remove` - Produkt aus Warenkorb entfernen
- `POST /cart/update` - Produktmenge im Warenkorb ändern
- `GET /api/exchange-rates` - Währungswechselkurse abrufen
- `POST /api/cache/clear-videos` - Video-Cache leeren (Proxy zum Cache Service)

### ACD2: Shopping Cache Service
Das Shopping Cache Service fungiert als dedizierter Mikroservice für die Verwaltung aller Cache-Operationen im System. Es orchestriert (1) die Video-URL-Auflösung und -Caching für Produktmedia, (2) die Warenkorb-Persistierung über Redis, (3) die Produktlisten-Caching zur Performance-Optimierung, sowie (4) die MinIO-Integration für Mediendateien. Der Service implementiert intelligente Caching-Strategien mit unterschiedlichen TTL-Werten je nach Datentyp und reduziert die Latenz für wiederkehrende Anfragen erheblich.

**Technische Spezifikationen:**
- Node.js Express Framework mit CORS-Unterstützung
- Redis Client für Caching-Operationen
- MinIO Client für Object Storage Integration
- Port: 3001 (konfigurierbar via CACHE_PORT)

**Öffentliche APIs:**
- `GET /api/video/:productId` - Video-URL für spezifisches Produkt
- `POST /api/videos/batch` - Batch-Abruf von Video-URLs
- `POST /api/cache/products` - Produktliste cachen
- `GET /api/cache/products` - Gecachte Produktliste abrufen
- `POST /api/cache/clear-videos` - Video-Cache leeren
- `POST /api/cart/add` - Produkt zum Warenkorb hinzufügen
- `GET /api/cart/:sessionId` - Warenkorb für Session abrufen
- `POST /api/cart/remove` - Produkt aus Warenkorb entfernen
- `POST /api/cart/update` - Warenkorb-Produktmenge aktualisieren
- `GET /health` - Health Check Endpoint

### ACD3: MySQL Database Service
Das MySQL Database Service verwaltet alle persistenten Produktdaten des WebShops in einer relationalen Datenbankstruktur. Es implementiert (1) die Produktkatalog-Verwaltung mit mehrsprachiger Unterstützung, (2) die Kategorisierung von Produkten, (3) die Medien-URL-Verwaltung für Bilder und Videos, sowie (4) die Preisverwaltung mit Dezimalgenauigkeit. Die Datenbank unterstützt UTF-8 Zeichenkodierung für internationale Produktnamen und -beschreibungen.

**Technische Spezifikationen:**
- MySQL 8.0 mit UTF8MB4 Charset
- Connection Pooling (max. 10 Verbindungen)
- Automatische Datenbankinitialisierung via Docker Volume
- Port: 3306 (konfigurierbar via MYSQL_PORT)

**Datenbankschema:**
```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    category VARCHAR(50) DEFAULT 'Automotive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ACD4: Redis Cache Service
Das Redis Cache Service fungiert als hochperformanter In-Memory-Datastore für alle temporären Daten des Systems. Es implementiert (1) die Session-basierte Warenkorb-Persistierung, (2) die Video-URL-Caching mit konfigurierbaren TTL-Werten, (3) die Produktlisten-Caching für Performance-Optimierung, sowie (4) die JSON-Mapping-Caching für Video-Metadaten. Der Service ermöglicht horizontale Skalierung durch die Externalisierung des Session-States.

**Technische Spezifikationen:**
- Redis 7.x mit Standard-Konfiguration
- Key-Value Storage mit Hash-Datenstrukturen
- TTL-basierte Datenveraltung
- Port: 6379 (konfigurierbar via REDIS_PORT)

**Cache-Strategien:**
- Video URLs: 6 Stunden TTL (21600 Sekunden)
- Produktlisten: 10 Minuten TTL (600 Sekunden)
- Video-Mappings: 10 Minuten TTL (600 Sekunden)
- Warenkorb: Session-basiert (ohne TTL)

### ACD5: MinIO Object Storage Service
Das MinIO Object Storage Service verwaltet alle Mediendateien des WebShops in einer S3-kompatiblen Object Storage-Umgebung. Es implementiert (1) die Verwaltung von Produktbildern im 'images' Bucket, (2) die Verwaltung von Produktvideos im 'videos' Bucket, (3) die öffentliche HTTP-basierte Bereitstellung von Mediendateien, sowie (4) die Batch-Upload-Funktionalität für initiale Mediendaten. Der Service unterstützt Content-Type-Detection und Cache-Control-Headers für optimale Browser-Caching.

**Technische Spezifikationen:**
- MinIO Server mit S3-kompatiblem API
- Öffentlicher Lesezugriff auf Buckets
- Automatische MIME-Type-Erkennung
- Console Port: 9001, API Port: 9000

**Bucket-Struktur:**
- `images/` - Produktbilder mit 7-Tage Cache-Control
- `videos/` - Video-Metadaten und -Dateien mit 1-Tag Cache-Control

### ACD6: Monitoring & Administration Services
Die Monitoring-Komponenten umfassen (1) phpMyAdmin für die Datenbank-Administration, (2) Redis Insight für die Cache-Überwachung, sowie (3) MinIO Console für die Object Storage-Verwaltung. Diese Services bieten webbasierte Interfaces für die Systemadministration und ermöglichen die Überwachung der Systemleistung in Echtzeit.

## Architecture Decision Records

### ADR1: Microservice-Architektur für CloudCar WebShop
Das CloudCar WebShop System wurde gemäß des Microservice-Architekturstils entworfen, da es verschiedene fachliche Domänen (Produktkatalog, Caching, Medien-Management) abdeckt, die eine klare Modularisierung ermöglichen. Die entstehenden Module weisen eine starke interne funktionale Kohäsion auf und sind lose gekoppelt durch HTTP-APIs. Da es sich um ein verteiltes Web-System mit unterschiedlichen Skalierungsanforderungen handelt, bietet sich der Microservice-Architekturstil an.

**Vorteile:**
- Unabhängige Skalierung einzelner Services
- Technologie-Diversität möglich
- Isolierte Fehlerbehandlung
- Parallele Entwicklung möglich

**Nachteile:**
- Erhöhte Netzwerk-Latenz
- Komplexeres Deployment
- Distributed System Challenges

### ADR2: Server-Side Rendering mit EJS Templates
Das WebShop Service implementiert ausschließlich Server-Side Rendering mit EJS Templates, da der Shop primär statische Produktinformationen darstellt und keine komplexe Client-Side Interaktivität erfordert. Dies ermöglicht bessere SEO-Optimierung, reduzierte Time-to-First-Contentful-Paint und vereinfachte Caching-Strategien. Client-Side Rendering kann zukünftig für spezifische interaktive Komponenten in Erwägung gezogen werden.

### ADR3: Dedizierter Cache Service für Performance-Optimierung
Ein separater Shopping Cache Service wurde eingeführt, um die Performance-kritischen Caching-Operationen zu zentralisieren und zu optimieren. Dies ermöglicht (1) die Entkopplung der Cache-Logik vom Haupt-WebShop Service, (2) die Implementierung spezialisierter Caching-Algorithmen, (3) die unabhängige Skalierung der Cache-Schicht, sowie (4) die Wiederverwendbarkeit der Cache-Funktionalität für zukünftige Services.

### ADR4: Redis für Session-Management und Caching
Redis wurde als primärer Cache-Store gewählt aufgrund seiner hohen Performance für Read/Write-Operationen, seiner nativen Unterstützung für Hash-Datenstrukturen (optimal für Warenkorb-Management), sowie seiner bewährten Stabilität in Production-Umgebungen. Die TTL-Funktionalität ermöglicht automatisches Cache-Expiring ohne manuelle Cleanup-Prozesse.

### ADR5: MinIO für Object Storage Integration
MinIO wurde als Object Storage-Lösung gewählt, da es eine S3-kompatible API bietet, was zukünftige Cloud-Migration vereinfacht. Die Unterstützung für öffentliche Buckets ermöglicht direkten HTTP-Zugriff auf Mediendateien ohne Proxy-Overhead. Die Container-basierte Deployment-Strategie integriert sich nahtlos in die Docker-Compose-Umgebung.

### ADR6: MySQL für Produktdaten-Persistierung
Eine relationale MySQL-Datenbank wurde für die Produktdaten gewählt, da die Produktinformationen eine klare, strukturierte Datenstruktur aufweisen und komplexe Abfragen (Suche, Filterung, Sortierung) erfordern. Die ACID-Eigenschaften gewährleisten Datenkonsistenz, und die UTF8MB4-Unterstützung ermöglicht internationale Produktbeschreibungen.

### ADR7: API-First Design mit HTTP/JSON
Alle Inter-Service-Kommunikation erfolgt über HTTP/JSON-APIs, um eine lose Kopplung und Technologie-Agnostizität zu gewährleisten. Dies ermöglicht (1) die unabhängige Entwicklung und Deployment der Services, (2) die einfache Integration von Third-Party-Services, (3) die Testbarkeit einzelner Services, sowie (4) die potenzielle Verwendung verschiedener Programmiersprachen für verschiedene Services.

### ADR8: Currency Exchange API Integration
Die Integration einer externen Currency Exchange API (exchangerate-api.com) wurde implementiert, um Echtzeit-Währungsumrechnung zu ermöglichen. Dies verbessert die Benutzerfreundlichkeit für internationale Kunden und eliminiert die Notwendigkeit der manuellen Wechselkurs-Pflege.

### ADR5: Elastic Horizontal Scaling und Load Balancer im Business Logic Tier
Da die beiden Komponenten "WebShop Service" und "Shopping Cache Service" einem Unpredictable Workload ausgesetzt sind, müssen diese elastisch horizontal skaliert werden. Die elastische horizontale Skalierung wird durch AWS Elastic Beanstalk als Managed Hosting Service in Form von PaaS automatisiert ausgeführt. Dies ermöglicht (1) die automatische Anpassung der Instanzanzahl basierend auf Metriken, (2) die Lastverteilung über mehrere Instanzen, (3) die Ausfallsicherheit durch redundante Instanzen, sowie (4) die Kostenoptimierung durch bedarfsgerechte Ressourcennutzung.

**Skalierungsvorteile:**
- Automatische Reaktion auf Lastspitzen (z.B. während Verkaufsaktionen)
- Hohe Verfügbarkeit durch Multi-AZ-Deployment
- Kosteneffizienz durch Scale-Down bei geringer Last
- Keine manuelle Infrastruktur-Verwaltung erforderlich

## Deployment Decision Records

### DDR1: Docker Compose für lokale Entwicklung
Das gesamte System wird über Docker Compose orchestriert, um eine konsistente Entwicklungsumgebung zu gewährleisten. Dies ermöglicht (1) die automatische Service-Discovery zwischen Containern, (2) die vereinfachte Dependency-Management, (3) die isolierte Entwicklungsumgebung, sowie (4) die einfache Reproduzierbarkeit auf verschiedenen Entwicklungsmaschinen.

### DDR2: Container-basierte Service-Isolierung
Jeder Microservice wird in einem separaten Docker-Container deployed, um (1) die Ressourcen-Isolierung zu gewährleisten, (2) die unabhängige Skalierung zu ermöglichen, (3) die Deployment-Flexibilität zu erhöhen, sowie (4) die Sicherheit durch Container-Boundaries zu verbessern.

### DDR3: Web Shop Backend auf AWS Elastic Beanstalk
Gemäß ADR5 müssen die beiden Komponenten "WebShop Service" und "Shopping Cache Service" elastisch durch einen PaaS horizontal skaliert werden. Daher werden die beiden Komponenten auf AWS Elastic Beanstalk deployed, da es sich dabei um einen Full-Managed Hosting Service auf der Ebene PaaS handelt, der automatisierte elastische Skalierung ermöglicht. AWS Elastic Beanstalk übernimmt (1) die automatische Skalierung basierend auf CPU/Memory-Metriken, (2) das Load Balancing zwischen Service-Instanzen, (3) das Health Monitoring und Auto-Recovery, sowie (4) die automatische Kapazitätsplanung bei Unpredictable Workloads.

**Technische Implementierung:**
- WebShop Service: Node.js Platform auf AWS Elastic Beanstalk
- Shopping Cache Service: Node.js Platform auf AWS Elastic Beanstalk  
- Auto Scaling: Min 2, Max 10 Instanzen pro Service
- Load Balancer: Application Load Balancer (ALB) mit Health Checks
- Deployment: Rolling Deployment mit Zero-Downtime

**Skalierungsmetriken:**
- CPU-Auslastung: Skalierung bei >70% für 5 Minuten
- Memory-Auslastung: Skalierung bei >80% für 3 Minuten
- Request-Latenz: Skalierung bei >500ms Average für 2 Minuten

### DDR4: Environment-basierte Konfiguration
Alle Services nutzen .env-Dateien für die Konfiguration, um (1) die Trennung von Code und Konfiguration zu gewährleisten, (2) die umgebungsspezifische Konfiguration zu ermöglichen, (3) die Sicherheit durch Externalisierung von Credentials zu erhöhen, sowie (4) die Deployment-Flexibilität zu verbessern.

### DDR4: AWS RDS und ElastiCache für Datenbank-Services
Die Datenbank-Services (MySQL und Redis) werden als AWS Managed Services deployed, um (1) die automatische Skalierung und Hochverfügbarkeit zu gewährleisten, (2) die Backup- und Recovery-Strategien zu automatisieren, (3) die Sicherheit durch AWS-Security-Features zu erhöhen, sowie (4) die Betriebskosten durch Managed Services zu reduzieren.

**AWS RDS für MySQL:**
- Multi-AZ-Deployment für Hochverfügbarkeit
- Automatische Backups mit Point-in-Time-Recovery
- Read Replicas für Lastverteilung
- Verschlüsselung at Rest und in Transit

**AWS ElastiCache für Redis:**
- Cluster-Mode für horizontale Skalierung
- Automatische Failover-Funktionalität
- In-Memory-Caching für optimale Performance
- VPC-Integration für Netzwerk-Isolation

### DDR5: Network Segmentation mit AWS VPC
Alle Services werden in einer AWS VPC mit separaten Subnetzen deployed, um (1) die Netzwerk-Isolation zwischen Services zu gewährleisten, (2) die Sicherheit durch Security Groups zu erhöhen, (3) die Kontrolle über Network-Policies zu ermöglichen, sowie (4) die sichere Kommunikation zwischen Services zu gewährleisten.

**VPC-Architektur:**
- Public Subnets: Load Balancer und NAT Gateways
- Private Subnets: Application Services (WebShop, Cache)
- Database Subnets: RDS und ElastiCache (isolated)
- Security Groups: Service-spezifische Firewall-Regeln

### DDR6: AWS S3 für Object Storage
Das MinIO Object Storage wird in der Production-Umgebung durch AWS S3 ersetzt, um (1) die unbegrenzte Skalierbarkeit für Mediendateien zu gewährleisten, (2) die Ausfallsicherheit durch Multi-AZ-Replikation zu erhöhen, (3) die Integration mit AWS CloudFront für globale Content Delivery zu ermöglichen, sowie (4) die Kostenoptimierung durch verschiedene Storage Classes zu nutzen.

**S3-Konfiguration:**
- Bucket Policy: Öffentlicher Lesezugriff für Produktbilder
- CloudFront Distribution: CDN für globale Verfügbarkeit
- S3 Lifecycle Policies: Automatische Archivierung alter Medien
- Cross-Region Replication: Disaster Recovery

### DDR7: AWS Systems Manager für Konfigurationsmanagement
Alle sensiblen Konfigurationsdaten werden über AWS Systems Manager Parameter Store verwaltet, um (1) die Sicherheit durch Verschlüsselung zu erhöhen, (2) die zentrale Konfigurationsverwaltung zu ermöglichen, (3) die Audit-Fähigkeit zu verbessern, sowie (4) die automatische Rotation von Secrets zu ermöglichen.

**Parameter Store Integration:**
- Database Credentials: Verschlüsselte Parameter
- API Keys: Sichere String-Parameter
- Service Endpoints: Standard-Parameter
- Automatic Rotation: Lambda-basierte Secret-Rotation

## API Documentation

### WebShop Service APIs

#### Produktanzeige APIs
**GET /**
- **Zweck**: Laden der Hauptseite mit Produktliste
- **Response**: HTML-Seite mit Produktgrid
- **Caching**: Nutzt Cache Service für Produktliste (10 Min TTL)
- **Seiteneffekte**: Lädt Video-URLs für Produkte, aktualisiert Produktcache

#### Warenkorb APIs
**POST /cart/add**
- **Zweck**: Produkt zum Warenkorb hinzufügen
- **Request Body**: `{ "productId": number }`
- **Response**: `{ "message": string, "productName": string, "productId": number, "totalCartQuantity": number, "itemsCount": number }`
- **Beispiel**:
```json
{
  "productId": 1
}
```

**GET /cart**
- **Zweck**: Warenkorb-Übersicht anzeigen
- **Response**: HTML-Seite mit Warenkorb-Inhalten
- **Datenabruf**: Kombiniert Cache Service (Mengen) mit Datenbank (Produktdetails)

**POST /cart/remove**
- **Zweck**: Produkt vollständig aus Warenkorb entfernen
- **Request Body**: `{ "productId": number }`
- **Response**: `{ "message": string, "totalQuantity": number, "totalAmount": string, "removedProductId": number, "itemsCount": number }`

**POST /cart/update**
- **Zweck**: Produktmenge im Warenkorb ändern
- **Request Body**: `{ "productId": number, "action": "increase" | "decrease" }`
- **Response**: `{ "productId": number, "updatedQuantity": number, "newSubtotal": string, "totalQuantity": number, "totalAmount": string, "itemsCount": number }`

#### Utility APIs
**GET /api/exchange-rates**
- **Zweck**: Aktuelle Währungswechselkurse abrufen
- **Response**: `{ "base": "EUR", "rates": { "USD": number, "GBP": number, "CHF": number, "JPY": number, "CAD": number }, "lastUpdate": string }`
- **Beispiel**:
```json
{
  "base": "EUR",
  "rates": {
    "EUR": 1.0000,
    "USD": 1.0924,
    "GBP": 0.8359,
    "CHF": 0.9742,
    "JPY": 164.59,
    "CAD": 1.4817
  },
  "lastUpdate": "2024-01-15"
}
```

### Shopping Cache Service APIs

#### Video Management APIs
**GET /api/video/:productId**
- **Zweck**: Video-URL für spezifisches Produkt abrufen
- **Parameter**: `productId` (number)
- **Response**: `{ "productId": string, "videoUrl": string|null, "cached": boolean, "source": "cache"|"minio"|"not_found" }`
- **Caching**: 6 Stunden TTL für positive Ergebnisse, 30 Minuten für negative
- **Beispiel**:
```json
{
  "productId": "1",
  "videoUrl": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0",
  "cached": true,
  "source": "cache"
}
```

**POST /api/videos/batch**
- **Zweck**: Batch-Abruf von Video-URLs für mehrere Produkte
- **Request Body**: `{ "productIds": number[] }`
- **Response**: `{ "videos": { [productId: string]: string|null } }`
- **Beispiel**:
```json
{
  "productIds": [1, 2, 3]
}
```

#### Cache Management APIs
**POST /api/cache/products**
- **Zweck**: Produktliste im Cache speichern
- **Request Body**: `{ "products": Product[] }`
- **Response**: `{ "success": boolean, "message": string, "ttl": number }`
- **TTL**: 10 Minuten (600 Sekunden)

**GET /api/cache/products**
- **Zweck**: Gecachte Produktliste abrufen
- **Response**: `{ "products": Product[]|null, "cached": boolean, "source": "cache"|"not_cached" }`

**POST /api/cache/clear-videos**
- **Zweck**: Video-Cache leeren (spezifisch oder komplett)
- **Request Body**: `{ "productId"?: number }`
- **Response**: `{ "success": boolean, "message": string }`

#### Cart Management APIs
**POST /api/cart/add**
- **Zweck**: Produkt zum Warenkorb hinzufügen
- **Request Body**: `{ "productId": number, "sessionId": string }`
- **Response**: `{ "success": boolean, "productId": number, "totalCartQuantity": number, "itemsCount": number }`

**GET /api/cart/:sessionId**
- **Zweck**: Warenkorb-Inhalte für Session abrufen
- **Parameter**: `sessionId` (string)
- **Response**: `{ "items": CartItem[], "totalQuantity": number, "itemsCount": number }`
- **CartItem**: `{ "productId": number, "quantity": number }`

**POST /api/cart/remove**
- **Zweck**: Produkt aus Warenkorb entfernen
- **Request Body**: `{ "productId": number, "sessionId": string }`
- **Response**: `{ "success": boolean, "removedProductId": number, "totalQuantity": number, "itemsCount": number }`

**POST /api/cart/update**
- **Zweck**: Produktmenge im Warenkorb aktualisieren
- **Request Body**: `{ "productId": number, "action": "increase"|"decrease", "sessionId": string }`
- **Response**: `{ "success": boolean, "productId": number, "updatedQuantity": number, "totalQuantity": number, "itemsCount": number }`

#### Health Check API
**GET /health**
- **Zweck**: Service-Gesundheit prüfen
- **Response**: `{ "status": "healthy"|"unhealthy", "services": { "redis": string, "minio": string } }`

## Frontend Components

### Produktgrid-Komponente
- **Zweck**: Responsive Darstellung der Produktliste
- **Views**: Grid-View (Standard), List-View (Kompakt)
- **Features**: Lazy Loading, Infinite Scroll, Responsive Design
- **Interaktionen**: Hover-Effekte, Smooth Transitions

### Such- und Filterkomponente
- **Zweck**: Echtzeit-Produktsuche und -filterung
- **Features**: Textsuche, Kategorie-Filter, Preisbereich-Filter
- **Implementierung**: Client-Side JavaScript mit Debouncing

### Warenkorb-Komponente
- **Zweck**: Warenkorb-Management und -anzeige
- **Features**: Mengenänderung, Produktentfernung, Gesamtsumme
- **AJAX-Integration**: Ohne Seitenneuladen

### Währungsumrechner-Komponente
- **Zweck**: Echtzeit-Währungsumrechnung
- **Unterstützte Währungen**: EUR, USD, GBP, CHF, JPY, CAD
- **Update-Frequenz**: Bei Seitenaufruf

## Datenmodelle

### Product Model
```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  video_url: string;
  category: string;
  created_at: Date;
  youtube_url?: string; // Runtime-generiert
}
```

### Cart Model
```typescript
interface CartItem {
  productId: number;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  totalQuantity: number;
  itemsCount: number;
}
```

### Video Model
```typescript
interface VideoResponse {
  productId: string;
  videoUrl: string | null;
  cached: boolean;
  source: 'cache' | 'minio' | 'not_found';
}
```

## Verwendungsbeispiele

### Warenkorb-Management
```javascript
// Produkt hinzufügen
fetch('/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 1 })
})
.then(response => response.json())
.then(data => {
  console.log('Produkt hinzugefügt:', data.productName);
  updateCartBadge(data.totalCartQuantity);
});

// Menge aktualisieren
fetch('/cart/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 1, action: 'increase' })
})
.then(response => response.json())
.then(data => {
  updateProductQuantity(data.productId, data.updatedQuantity);
  updateCartTotal(data.totalAmount);
});
```

### Video-Integration
```javascript
// Video-URL abrufen
fetch('/api/video/1')
.then(response => response.json())
.then(data => {
  if (data.videoUrl) {
    embedVideo(data.videoUrl, document.querySelector(`#video-${data.productId}`));
  }
});
```

### Währungsumrechnung
```javascript
// Wechselkurse abrufen
fetch('/api/exchange-rates')
.then(response => response.json())
.then(data => {
  updateCurrencyRates(data.rates);
  convertPrices(data.rates);
});
```

## Konfiguration

### Lokale Entwicklung (Docker Compose)
```bash
# Database Configuration
DB_HOST=webshop-mysqldb
DB_USER=webshop_user
DB_PASSWORD=webshop_password
DB_NAME=webshop

# Service Ports
APP_PORT=8080
CACHE_PORT=3001
MYSQL_PORT=3306
REDIS_PORT=6379

# Cache Service Configuration
CACHE_SERVICE_URL=http://shopping-cache-service:3001
REDIS_HOST=redis

# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

### AWS Production Environment
```bash
# AWS RDS Configuration
DB_HOST={{resolve:ssm:/cloudcar/prod/db/host}}
DB_USER={{resolve:ssm:/cloudcar/prod/db/user}}
DB_PASSWORD={{resolve:ssm-secure:/cloudcar/prod/db/password}}
DB_NAME=webshop

# Service Ports (Elastic Beanstalk)
APP_PORT=8080
CACHE_PORT=3001

# AWS ElastiCache Configuration
REDIS_HOST={{resolve:ssm:/cloudcar/prod/redis/host}}
REDIS_PORT=6379

# Cache Service Configuration (Internal ALB)
CACHE_SERVICE_URL=http://cache-service-internal-alb.us-east-1.elb.amazonaws.com

# AWS S3 Configuration
S3_BUCKET_NAME=cloudcar-media-prod
S3_REGION=us-east-1
CLOUDFRONT_DOMAIN=d123456789abcdef.cloudfront.net

# AWS Systems Manager Integration
AWS_REGION=us-east-1
PARAMETER_STORE_PREFIX=/cloudcar/prod/
```

### AWS Services Architecture
```yaml
# Elastic Beanstalk Applications
webshop-service:
  Platform: Node.js 18
  Environment: Production
  Instances: 2-10 (Auto Scaling)
  Load Balancer: Application Load Balancer

shopping-cache-service:
  Platform: Node.js 18
  Environment: Production
  Instances: 2-6 (Auto Scaling)
  Load Balancer: Internal Application Load Balancer

# AWS Managed Services
RDS:
  Engine: MySQL 8.0
  Instance: db.t3.medium (Multi-AZ)
  Storage: 100GB GP2 (Auto Scaling)

ElastiCache:
  Engine: Redis 6.2
  Node Type: cache.t3.micro
  Cluster Mode: Enabled (3 Shards)

S3:
  Bucket: cloudcar-media-prod
  Storage Class: Standard
  CDN: CloudFront Distribution

VPC:
  CIDR: 10.0.0.0/16
  Subnets: 6 (2 Public, 2 Private, 2 Database)
  Availability Zones: 2
```

## Performance-Optimierungen

### Caching-Strategien
1. **Redis-basiertes Caching**: 
   - Video-URLs: 6h TTL
   - Produktlisten: 10min TTL
   - Warenkorb: Session-basiert

2. **Browser-Caching**:
   - Statische Assets: 7 Tage
   - API-Responses: Conditional Requests

3. **Database Connection Pooling**:
   - Max. 10 gleichzeitige Verbindungen
   - Automatische Reconnection

### Lazy Loading
- Produktbilder: Intersection Observer API
- Video-Embedding: On-Demand Loading
- Infinite Scroll: Pagination mit 12 Produkten/Seite

## AWS Deployment-Prozess

### Elastic Beanstalk Deployment
```bash
# Vorbereitung der Deployment-Pakete
npm run build
zip -r webshop-service.zip . -x "node_modules/*" "*.git*"

# Deployment über AWS CLI
aws elasticbeanstalk create-application-version \
  --application-name cloudcar-webshop \
  --version-label v1.0.0 \
  --source-bundle S3Bucket=cloudcar-deployments,S3Key=webshop-service.zip

aws elasticbeanstalk update-environment \
  --environment-name cloudcar-webshop-prod \
  --version-label v1.0.0
```

### Infrastructure as Code (CloudFormation)
```yaml
# cloudformation/elasticbeanstalk.yml
Resources:
  WebShopApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: cloudcar-webshop
      Description: CloudCar WebShop Application
      
  WebShopEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref WebShopApplication
      EnvironmentName: cloudcar-webshop-prod
      SolutionStackName: "64bit Amazon Linux 2 v5.6.0 running Node.js 18"
      OptionSettings:
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: 2
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: 10
        - Namespace: aws:autoscaling:trigger
          OptionName: MeasureName
          Value: CPUUtilization
        - Namespace: aws:autoscaling:trigger
          OptionName: UpperThreshold
          Value: 70
```

### CI/CD Pipeline (AWS CodePipeline)
```yaml
# buildspec.yml für AWS CodeBuild
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - npm install
  pre_build:
    commands:
      - npm run lint
      - npm run test
  build:
    commands:
      - npm run build
  post_build:
    commands:
      - echo "Build completed successfully"
artifacts:
  files:
    - '**/*'
  exclude-paths:
    - node_modules/**/*
    - .git/**/*
```

## Sicherheitsaspekte

### Authentication & Authorization
- Session-basierte Authentifizierung mit secure Cookies
- CSRF-Schutz durch Express-Session
- AWS IAM Roles für Service-zu-Service-Authentifizierung
- AWS Systems Manager für Credential Management

### Input Validation
- Parameter-Validierung für alle APIs
- SQL-Injection-Schutz durch Prepared Statements
- XSS-Schutz durch EJS-Escaping
- Request Rate Limiting über AWS WAF

### Network Security
- AWS VPC mit Security Groups
- Private Subnets für Application Services
- Network ACLs für zusätzliche Sicherheit
- AWS CloudFront für DDoS-Schutz
- SSL/TLS-Terminierung am Load Balancer

### AWS-spezifische Sicherheitsmaßnahmen
- AWS CloudTrail für Audit-Logging
- AWS GuardDuty für Threat Detection
- AWS Config für Compliance-Monitoring
- AWS Secrets Manager für automatische Secret-Rotation
- AWS WAF für Web Application Firewall

---

*Dokumentation erstellt für CloudCar WebShop System v1.0*
*Stand: Januar 2024*