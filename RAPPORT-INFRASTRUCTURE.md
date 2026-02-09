# RAPPORT D'INFRASTRUCTURE — VECTRYS PLATFORM

**Date :** 9 Fevrier 2026
**Version :** 2.0.0
**Statut :** En cours de deploiement
**Confidentialite :** PRIVE — Usage interne VECTRYS uniquement

---

## 1. VUE D'ENSEMBLE DU PROJET

| Metrique | Valeur |
|----------|--------|
| Lignes de code | 18 707 |
| Fichiers source | 55 (.js/.jsx/.ts/.tsx) |
| Modeles Prisma | 48 tables |
| Routes API | 113 endpoints |
| Dependencies prod | 24 packages |
| Dependencies dev | 7 packages |
| Commits | 5 |
| Branche | main |

---

## 2. ARCHITECTURE TECHNIQUE

### Stack

| Couche | Technologie | Version |
|--------|------------|---------|
| **Frontend** | React + TypeScript + Vite | React 18 |
| **Backend** | Express.js (ESM) | 4.18.2 |
| **Base de donnees** | PostgreSQL + Prisma ORM | Prisma 5.9 |
| **IA / LLM** | Anthropic Claude (Opus 4.6) | SDK 0.74 |
| **Paiements** | Stripe | 20.3.1 |
| **SMS** | Twilio | 5.12.1 |
| **WebSocket** | Socket.IO | 4.8.3 |
| **Cache** | Redis (optionnel) | 4.6.12 |

### Monorepo

```
vectrys-repo/
  apps/
    client/     → Frontend React (Vercel)
    server/     → Backend Express (Railway)
  integration-kit/
```

---

## 3. DEPLOIEMENT & HEBERGEMENT

### 3.1 Backend — Railway

| Parametre | Valeur | Statut |
|-----------|--------|--------|
| Plateforme | Railway | Deploye |
| Region | **eu-west (Paris)** | Configure |
| Root Directory | apps/server | A verifier dans dashboard |
| Build | npm install + prisma generate | Configure |
| Start | node server/index.js | Configure |
| Health check | /health (timeout 30s) | Configure |
| Restart policy | ON_FAILURE (max 5) | Configure |
| Timezone | Europe/Paris | Configure |

**Fichier de config :** `apps/server/railway.json`

### 3.2 Frontend — Vercel

| Parametre | Valeur | Statut |
|-----------|--------|--------|
| Plateforme | Vercel | Deploye |
| URL | vectrys-client.vercel.app | Actif |
| Region | **cdg1 (Paris CDG)** | Configure |
| Framework | Vite | Configure |
| Build | npm run build | Configure |
| Output | dist/ | Configure |
| SPA Rewrite | /* → /index.html | Configure |
| Headers securite | X-Frame-Options, CSP, XSS | Configure |

**Fichier de config :** `apps/client/vercel.json`

### 3.3 Base de donnees — PostgreSQL

| Parametre | Valeur |
|-----------|--------|
| Dev local | postgresql://caerou@localhost:5432/vectrys_lingua |
| Production | A configurer sur Railway (PostgreSQL plugin) |
| ORM | Prisma 5.9.1 |
| Tables | 48 modeles |
| Migrations | prisma db push |

### 3.4 Code source — GitHub

| Parametre | Valeur |
|-----------|--------|
| Repository | git@github.com:bast756/vectrys.git |
| Visibilite | PRIVE |
| Branche | main |
| Auth | SSH key |

---

## 4. APIs EXTERNES CONFIGUREES

### 4.1 APIs Actives (cles reelles)

| # | Service | Usage | Statut |
|---|---------|-------|--------|
| 1 | **Anthropic Claude** | Sage AI + Data Engine (classification, insights) | Cle configuree |
| 2 | **Stripe** | Pricing dynamique, abonnements marketplace | Cle test configuree |
| 3 | **Twilio** | SMS FATE (SID + Auth Token + numero US) | Configure |
| 4 | **PostgreSQL** | BDD principale (local + Railway) | Configure |

### 4.2 APIs Non-configurees (a activer si besoin)

| # | Service | Usage | Statut |
|---|---------|-------|--------|
| 5 | ElevenLabs | Text-to-Speech | Placeholder |
| 6 | Google Maps | Geolocalisation agents terrain | Commente |
| 7 | OpenWeatherMap | Meteo missions | Commente |
| 8 | SendGrid | Emails transactionnels | Commente |
| 9 | Redis | Cache (optionnel) | Config locale par defaut |

---

## 5. MODULES FONCTIONNELS (14 services)

| # | Module | Routes | Statut |
|---|--------|--------|--------|
| 1 | LLM Enhanced (FATE/Emotional/SONCAS/Chat) | /api/llm/* | Operationnel |
| 2 | Housekeeping Management | /api/housekeeping/* | Operationnel |
| 3 | Language Quiz (A1.1-C2) | /api/quiz/language/* | Operationnel |
| 4 | Cleaning Certification | /api/quiz/cleaning/* | Operationnel |
| 5 | Universal Quiz System | /api/quiz/universal/* | Operationnel |
| 6 | Marketplace P2P | /api/marketplace/* | Operationnel |
| 7 | Hero Quest Journey | /api/quest/* | Operationnel |
| 8 | Agent de Terrain | /api/agent-terrain/* | Operationnel |
| 9 | SMS v1 | /api/sms/* | Operationnel |
| 10 | SMS FATE v2 | /api/v2/sms/* | Operationnel |
| 11 | Webhooks Twilio | /api/webhooks/* | Operationnel |
| 12 | XP & Badge System | Integre | Operationnel |
| 13 | WebSocket (Socket.IO) | ws://localhost:3000 | Operationnel |
| 14 | **Data Engine v3.0** | /api/v1/internal/data-engine/* | **PROTEGE (RBAC)** |

---

## 6. DATA ENGINE v3.0 — DETAIL

### 6.1 Sous-modules

| Module | Endpoint | Technologie |
|--------|----------|------------|
| Classification IA | POST /classify | Claude Opus 4.6 |
| Recommandations | POST /classify/recommendations | Claude Opus 4.6 |
| Anonymisation | POST /anonymize | HMAC-SHA256 + Laplace noise |
| Pricing dynamique | POST /pricing/calculate | Algorithme multiplicateurs |
| Abonnement | POST /pricing/subscribe | Stripe API |
| Clustering | POST /analytics/clusters | K-Means++ |
| Insights IA | POST /analytics/insights | Claude Opus 4.6 |
| Compliance | GET /compliance | Prisma (a connecter) |
| Audit | GET /audit | Rate limited (5/min) |
| Health (interne) | GET /health | RBAC protected |

### 6.2 Securite Data Engine (12 couches)

| # | Couche | Detail |
|---|--------|--------|
| 1 | IP Whitelist | INTERNAL_ALLOWED_IPS (optionnel) |
| 2 | Authentification JWT | Token requis |
| 3 | Role interne | ADMIN, INTERNAL_DATA, CTO, CEO uniquement |
| 4 | Stealth 404 | Masque l'existence des routes aux non-internes |
| 5 | Permissions granulaires | 14 permissions par sous-module |
| 6 | Rate limiting sensible | 5 req/min sur audit/export |
| 7 | Anti-cache headers | no-store, no-cache, must-revalidate, private |
| 8 | Anti-indexation | X-Robots-Tag: noindex, nofollow |
| 9 | Anti-framing | X-Frame-Options: DENY |
| 10 | Classification header | X-Data-Classification: CONFIDENTIAL |
| 11 | Propriete header | X-Data-Owner: VECTRYS |
| 12 | Masquage erreurs | Messages generiques en production |

---

## 7. SECURITE GENERALE

### 7.1 CORS

```javascript
// Origines autorisees uniquement :
- process.env.FRONTEND_URL (production)
- http://localhost:5173 (dev)
- http://localhost:4173 (preview)
// Tout autre domaine est BLOQUE
```

### 7.2 Headers de securite (Helmet.js)

| Header | Valeur |
|--------|--------|
| Content-Security-Policy | self only |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| X-XSS-Protection | 1; mode=block (Vercel) |
| Referrer-Policy | strict-origin-when-cross-origin (Vercel) |

### 7.3 Rate Limiting

| Scope | Limite |
|-------|--------|
| Global API | 100 req / 15 min par IP |
| Data Engine sensible | 5 req / 1 min par user |

### 7.4 Secrets a changer en production

| Variable | Statut actuel |
|----------|--------------|
| JWT_SECRET | PLACEHOLDER — a remplacer |
| ANONYMIZATION_HMAC_SECRET | PLACEHOLDER — a remplacer |

Commande pour generer un secret securise :
```bash
openssl rand -base64 32
```

---

## 8. CONFORMITE RGPD / EU

### 8.1 Localisation des donnees

| Composant | Region | Conformite |
|-----------|--------|-----------|
| Backend (Railway) | **EU-West (Paris)** | Conforme RGPD |
| Frontend (Vercel) | **CDG1 (Paris CDG)** | Conforme RGPD |
| BDD PostgreSQL | A configurer EU | A verifier |
| Code source (GitHub) | US (Microsoft) | Acceptable (pas de donnees perso) |

### 8.2 Mesures RGPD implementees

| Mesure | Statut |
|--------|--------|
| Anonymisation SHA-256 | Implemente |
| K-anonymat | Implemente (Data Engine) |
| Confidentialite differentielle (Laplace) | Implemente (Data Engine) |
| Pseudonymisation HMAC | Implemente (Data Engine) |
| Detection PII residuelles | Implemente (email, tel, IBAN, NIR) |
| Droit a l'oubli | Documente (API a creer) |
| Consentement opt-in | Documente |
| Retention 90 jours | Configure (DATA_RETENTION_DAYS=90) |
| Scan anti-PII sur exports | Implemente |

### 8.3 Reglementations referencees dans le Data Engine

| Reglement | Pris en compte |
|-----------|---------------|
| RGPD (Reglement General Protection Donnees) | Oui |
| EU Data Act | Oui |
| EU AI Act (IA Act) | Oui |
| DSA (Digital Services Act) | Oui |
| DGA (Data Governance Act) | Oui |
| DORA (EU 2024/1028) | Oui |
| Loi ALUR (immobilier FR) | Oui |
| Loi ELAN (immobilier FR) | Oui |

---

## 9. BASE DE DONNEES — 48 MODELES

### Par domaine

| Domaine | Modeles | Tables |
|---------|---------|--------|
| Core (Org/User/Guest/Booking) | 4 | organization, users, guests, bookings |
| Conversation/Messages | 3 | conversations, messages, conversation_metrics |
| Housekeeping | 3 | housekeeping_companies, hk_progressions, housekeepers |
| Language Quiz | 3 | language_quiz_questions, language_quiz_responses, language_progress |
| Cleaning Quiz | 2 | cleaning_quiz_questions, cleaning_quiz_responses |
| Universal Quiz | 2 | universal_quiz_questions, universal_quiz_responses |
| Marketplace | 3 | items, trades, knowledge_base_entries |
| Hero Quest | 7 | quest_worlds, quests, quest_progress, world_progress, boss_battles, boss_battle_attempts, quest_dialogues |
| Avatar/Cinematic | 2 | hero_avatars, quest_cinematics |
| Agent Terrain | 6 | missions, incidents, sos_events, evacuations, pointages, mission_reports |
| SMS/FATE | 5 | security_alerts, sms_logs, fate_profiles, blocklist_sms, consentement_sms |
| **Data Engine** | **8** | internal_access, data_assets, classification_history, compliance_checks, data_products, partners, api_keys, audit_logs |

---

## 10. ACTIONS REQUISES POUR PRODUCTION

### Priorite HAUTE

| # | Action | Responsable |
|---|--------|------------|
| 1 | Verifier Root Directory = `apps/server` dans Railway dashboard | Admin |
| 2 | Configurer DATABASE_URL production (PostgreSQL EU) dans Railway | Admin |
| 3 | Generer et configurer JWT_SECRET production (64+ chars) | Admin |
| 4 | Generer et configurer ANONYMIZATION_HMAC_SECRET production | Admin |
| 5 | Configurer FRONTEND_URL = URL Vercel reelle dans Railway | Admin |
| 6 | Ajouter TZ=Europe/Paris dans variables Railway | Admin |
| 7 | Redeploy Railway apres configuration | Admin |

### Priorite MOYENNE

| # | Action | Responsable |
|---|--------|------------|
| 8 | Configurer Stripe webhook secret (STRIPE_WEBHOOK_SECRET) | Dev |
| 9 | Passer Stripe en mode live (remplacer rk_test par sk_live) | Admin |
| 10 | Configurer VITE_STRIPE_PUBLIC_KEY avec la vraie cle | Dev |
| 11 | Mettre en place monitoring (Sentry / LogTail) | DevOps |
| 12 | Configurer backup automatique PostgreSQL | DevOps |

### Priorite BASSE

| # | Action | Responsable |
|---|--------|------------|
| 13 | Activer ElevenLabs (Text-to-Speech) si besoin | Dev |
| 14 | Configurer Google Maps pour agents terrain | Dev |
| 15 | Mettre en place SendGrid pour emails | Dev |
| 16 | Ajouter certificat SSL custom si domaine propre | Admin |

---

## 11. CHECKLIST PRE-PRODUCTION

- [ ] Railway : Root Directory = apps/server
- [ ] Railway : Region EU-West verifiee
- [ ] Railway : Toutes les variables d'env configurees
- [ ] Railway : Health check /health repond 200
- [ ] Vercel : Region cdg1 verifiee
- [ ] Vercel : VITE_API_URL pointe vers Railway
- [ ] PostgreSQL : Instance EU configuree
- [ ] JWT_SECRET : Genere avec openssl rand -base64 64
- [ ] ANONYMIZATION_HMAC_SECRET : Genere securise
- [ ] CORS : FRONTEND_URL = URL Vercel production
- [ ] Stripe : Mode test → live avant lancement
- [ ] Twilio : Numero verifie et operationnel
- [ ] HTTPS : Force sur tous les endpoints
- [ ] Monitoring : Logs accessibles
- [ ] Backup : BDD sauvegardee quotidiennement

---

*Rapport genere le 9 Fevrier 2026 — VECTRYS SAS — Document CONFIDENTIEL*
