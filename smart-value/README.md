# Instant Home Quotes - Tracking & Traffic Routing Backend

Dedicated Node.js backend for parameter validation, anti-bot/macro rule targeting, dynamic traffic routing, and serving the `/info/home/` landing page with dynamic Routeclk click links.

---

## 🎯 Features

- **Landing Page Route (`GET /info/home/`)**:
  - **Missing / Empty / Macro Parameters** $\rightarrow$ Automatically 302 redirects to Valuerise.
  - **Valid Parameters** $\rightarrow$ Stays on the landing page, rendering the age buttons (`18-24`, `25-34`, `35-44`, etc.) wired directly with the Routeclk tracking link.
- **Advanced Targeting Rules**:
  - `p2 - targeting`: DENY if `p2` is empty.
  - `p2 - targeting-for-braces`: DENY if `p2` starts with `{` (unresolved macro).
  - `p2 - targeting- match camp id`: DENY if `p2` matches unreplaced macros (`%7B%7Bcampaign.id%7D%7D`, `{campaign.id}`, `{{campaing.id}}`, etc.).
- **Direct 302 Redirect Support** (`GET /click` or `GET /r`).
- **REST API Support** (`GET /api/v1/tracking/resolve`).
- **Environment Configurable**: All base URLs, fallback links, campaign IDs, and pub IDs are configurable via `.env`.

---

## 📁 Repository Structure

```
instanthomequotes-backend/
├── src/
│   ├── config/
│   │   └── config.js              # Environment configuration
│   ├── controllers/
│   │   └── trackingController.js  # Handles landing page, redirects, and API
│   ├── rules/
│   │   └── ruleEngine.js          # Advanced targeting rules
│   ├── routes/
│   │   └── trackingRoutes.js      # Express route definitions
│   ├── services/
│   │   └── trackingService.js     # URL builder & destination resolver
│   ├── views/
│   │   └── landingPage.js         # Landing page HTML renderer
│   └── app.js                     # Express application setup
├── tests/
│   ├── ruleEngine.test.js         # Unit tests
│   └── e2e.test.js                # End-to-End integration tests
├── .env.example                   # Environment configuration template
├── .env                           # Local environment configuration
├── .gitignore
├── package.json
├── README.md
└── server.js                      # Application entry point
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode**:
  ```bash
  npm run dev
  ```

### 3. Run Automated Tests
```bash
npm test
```

---

## 📡 Routes Reference

### 1. Landing Page (`GET /info/home/` or `GET /info/home`)
- **When `p2` is empty or template macro**:
  ```bash
  curl -i "http://localhost:3000/info/home/?fbclid=test_fb&p2="
  ```
  $\rightarrow$ Redirects (302) to `https://valuerise.live/index/?ccd=test_fb&vclk=34&fct=test_fb`
- **When `p2` is valid**:
  ```bash
  curl -i "http://localhost:3000/info/home/?fbclid=test_fb&p2=valid_id&p3=sub3"
  ```
  $\rightarrow$ Returns HTML page (200 OK) with age buttons wired to:
  `https://decode.routeclk.co/click?campaign_id=3647&pub_id=4905&fbclid=test_fb&p2=valid_id&p3=sub3...`

### 2. Direct Redirect (`GET /click` or `GET /r`)
- **Valid P2**: Redirects to Routeclk
- **Invalid P2**: Redirects to Valuerise

### 3. JSON API (`GET /api/v1/tracking/resolve`)
Returns `{ status, destinationUrl, isFallback, targetPlatform }`.

### 4. Health Check (`GET /health`)
Returns `{ status: "ok", uptime, timestamp }`.
