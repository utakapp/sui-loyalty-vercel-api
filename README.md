# Sui Loyalty Vercel API

Serverless API für Sui Course Loyalty Program - ermöglicht WordPress die Kommunikation mit der Sui Blockchain ohne lokale Sui CLI Installation.

## Features

- ✅ **Badge-Erstellung** auf Sui Blockchain
- ✅ **Progress-Updates** für Badges
- ✅ **Serverless** - läuft auf Vercel Edge Functions
- ✅ **Sui TypeScript SDK** - keine CLI Installation nötig
- ✅ **Sichere Authentifizierung** via API Key
- ✅ **WordPress Integration** - einfache REST API Calls

## API Endpoints

### 1. Test Connection

**GET** `/api/test`

Testet die Verbindung zur Sui Blockchain.

**Headers:**
```
X-API-Key: your_secret_key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "network": "testnet",
    "address": "0x...",
    "balance": "10.5 SUI",
    "packageId": "0x...",
    "adminCapId": "0x...",
    "timestamp": "2024-01-12T10:00:00.000Z"
  }
}
```

### 2. Create Badge

**POST** `/api/create-badge`

Erstellt ein neues Badge auf der Blockchain.

**Headers:**
```
Content-Type: application/json
X-API-Key: your_secret_key
```

**Body:**
```json
{
  "studentName": "Max Mustermann",
  "courseId": "RUST101",
  "studentAddress": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "badgeId": "0xabc123...",
    "digest": "0xdef456...",
    "studentName": "Max Mustermann",
    "courseId": "RUST101",
    "studentAddress": "0x1234..."
  }
}
```

### 3. Update Progress

**POST** `/api/update-progress`

Aktualisiert den Progress eines Badges.

**Headers:**
```
Content-Type: application/json
X-API-Key: your_secret_key
```

**Body:**
```json
{
  "badgeId": "0xabc123...",
  "progress": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "badgeId": "0xabc123...",
    "progress": 75,
    "digest": "0xdef456..."
  }
}
```

## Setup & Deployment

### Voraussetzungen

- Node.js 18+ installiert
- Vercel Account ([vercel.com](https://vercel.com))
- GitHub Account
- Sui Wallet mit Private Key
- Deployed Smart Contract (Package ID & AdminCap ID)

### Schritt 1: Private Key exportieren

```bash
# Zeige deine Sui Adressen
sui keytool list

# Exportiere Private Key im Base64 Format
sui keytool export --key-identity <YOUR_ADDRESS>

# Kopiere den Base64 String (beginnt meist mit "A...")
```

**Wichtig:** Der exportierte String ist der Base64-encoded Private Key!

### Schritt 2: GitHub Repository erstellen

```bash
# In diesem Verzeichnis (vercel-api/)
git init
git add .
git commit -m "Initial commit: Sui Loyalty Vercel API"

# Erstelle Repository auf GitHub
# Dann:
git remote add origin https://github.com/YOUR_USERNAME/sui-loyalty-vercel-api.git
git branch -M main
git push -u origin main
```

### Schritt 3: Vercel Projekt erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke **"Add New Project"**
3. Importiere dein GitHub Repository
4. Wähle **"Next.js"** als Framework (oder "Other")
5. Root Directory: `./` (wenn vercel-api/ das Hauptverzeichnis ist)

### Schritt 4: Environment Variables konfigurieren

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Wert | Beispiel |
|----------|------|----------|
| `SUI_NETWORK` | `testnet` oder `mainnet` | `testnet` |
| `SUI_PRIVATE_KEY` | Dein Base64 Private Key | `AHpq3vR...` |
| `PACKAGE_ID` | Package ID vom Deployment | `0xabc123...` |
| `ADMIN_CAP_ID` | AdminCap Object ID | `0xdef456...` |
| `API_SECRET_KEY` | Zufälliger Secret Key | `your_random_secret_123` |

**API_SECRET_KEY generieren:**
```bash
# macOS/Linux
openssl rand -base64 32

# Oder online: https://www.random.org/strings/
```

### Schritt 5: Deploy

```bash
# Automatisches Deployment via GitHub Push
git push

# Oder manuell via Vercel CLI
npm install -g vercel
vercel --prod
```

### Schritt 6: API URL notieren

Nach dem Deployment erhältst du eine URL:
```
https://sui-loyalty-vercel-api.vercel.app
```

Teste die API:
```bash
curl -H "X-API-Key: your_secret_key" \
  https://sui-loyalty-vercel-api.vercel.app/api/test
```

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
# Fülle die Werte aus

# Development Server starten
npm run dev

# Test
curl -H "X-API-Key: your_secret_key" \
  http://localhost:3000/api/test
```

## WordPress Integration

Siehe: `../wordpress-plugin/includes/vercel-api-integration.php`

### Quick Setup

1. Gehe zu **WordPress Admin → Course Loyalty → Einstellungen**
2. Wähle **"API Mode: Vercel"**
3. Füge ein:
   - **Vercel API URL:** `https://your-project.vercel.app`
   - **API Secret Key:** (derselbe wie in Vercel)
4. Klicke **"Test Connection"**
5. Aktiviere **"Auto-Processing"**

Fertig! WordPress nutzt jetzt deine Vercel API.

## Sicherheit

### Best Practices

1. **Niemals Private Key in Git committen**
   - Verwende Environment Variables
   - `.env` ist in `.gitignore`

2. **API Key rotieren**
   - Ändere `API_SECRET_KEY` regelmäßig
   - Update in Vercel + WordPress

3. **Rate Limiting**
   - Vercel hat automatisches Rate Limiting
   - Für Custom Limits: Vercel Pro Plan

4. **CORS konfigurieren**
   - Beschränke auf deine WordPress Domain
   - Edit `lib/auth.ts` → `getCorsHeaders()`

### Empfohlene Einstellungen

```typescript
// lib/auth.ts
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    'https://your-wordpress-site.com',
    'https://www.your-wordpress-site.com'
  ];

  const corsOrigin = allowedOrigins.includes(origin || '')
    ? origin
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    // ...
  };
}
```

## Monitoring & Logs

### Vercel Dashboard

1. Gehe zu Project → Logs
2. Sieh Echtzeit-Logs aller API Calls
3. Filtern nach Errors

### Custom Logging

Die API loggt automatisch:
- Alle Badge-Erstellungen
- Progress-Updates
- Fehler mit Stack Traces

```typescript
// In jedem Endpoint
console.log('Creating badge for', studentName);
console.error('Error:', error);
```

## Kosten

**Vercel Free Tier:**
- 100 GB Bandwidth
- 100,000 Function Invocations
- Ausreichend für kleine bis mittlere Websites

**Vercel Pro ($20/Monat):**
- 1 TB Bandwidth
- 1,000,000 Function Invocations
- Custom Domains
- Prioritärer Support

**Sui Testnet:** Kostenlos (nur für Testing)
**Sui Mainnet:** ~0.001-0.01 SUI pro Transaction (~$0.001-0.01 USD)

## Troubleshooting

### Error: "SUI_PRIVATE_KEY is required"

**Problem:** Environment Variable nicht gesetzt
**Lösung:**
1. Vercel Dashboard → Settings → Environment Variables
2. Füge `SUI_PRIVATE_KEY` hinzu
3. Redeploy: Settings → Deployments → ... → Redeploy

### Error: "Insufficient gas"

**Problem:** Wallet hat nicht genug SUI
**Lösung:**
```bash
# Testnet Faucet
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{"FixedAmountRequest": {"recipient": "YOUR_ADDRESS"}}'

# Oder Discord Faucet: discord.gg/sui
```

### Error: "Invalid Sui address"

**Problem:** Adresse hat falsches Format
**Lösung:** Sui Adressen müssen:
- Mit `0x` beginnen
- 64 Hex-Zeichen lang sein (+ 0x = 66 total)
- Beispiel: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Error: "Module not found: @mysten/sui.js"

**Problem:** Dependencies nicht installiert
**Lösung:**
```bash
npm install
```

### Error: 401 Unauthorized

**Problem:** API Key falsch oder fehlt
**Lösung:**
1. Prüfe Header: `X-API-Key` oder `Authorization: Bearer YOUR_KEY`
2. Vergleiche mit Vercel Environment Variable

## Weitere Entwicklung

### Neue Endpoints hinzufügen

1. Erstelle neue Datei: `api/my-endpoint.ts`
2. Template:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSuiClientFromEnv } from '../lib/sui-client';
import { verifyAuth, getCorsHeaders } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }

  // Auth
  if (!verifyAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Your logic
  const suiClient = createSuiClientFromEnv();
  // ...

  return res.status(200).json({ success: true, data: {} });
}
```

### TypeScript Compilation

```bash
npm run build

# Output in dist/
```

## Support

**Dokumentation:**
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel API Routes](https://vercel.com/docs/functions/serverless-functions)

**Issues:** GitHub Issues auf diesem Repository

## License

MIT

# Vercel API is ready for deployment
Mo 12 Jan 2026 14:38:56 CAT
