# VECTRYS — SMS + Framework FATE

> Intégration Twilio SMS avec profilage comportemental FATE (Family / Adventure / Traveler / Escape)

**Version** : 2.0.0
**Date** : 2026-02-06

---

## Table des matières

1. [Installation](#1-installation)
2. [Configuration](#2-configuration)
3. [Framework FATE](#3-framework-fate)
4. [API Endpoints](#4-api-endpoints)
5. [Templates FATE](#5-templates-fate)
6. [Exemples d'utilisation](#6-exemples-dutilisation)
7. [Monitoring & Alertes](#7-monitoring--alertes)
8. [Tests](#8-tests)
9. [Sécurité](#9-sécurité)
10. [Cas d'usage métier](#10-cas-dusage-métier)
11. [Règles de contenu](#11-règles-de-contenu)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Installation

```bash
# Dépendances (déjà incluses dans package.json)
npm install twilio node-cron

# Variables d'environnement
cp .env.example .env
# Remplir les valeurs TWILIO_* et SMS_*

# Migration Prisma (ajoute FATE_Profile + champs SmsLog)
npx prisma db push
npx prisma generate

# Démarrer le serveur
npm run dev
```

### Vérification rapide

```bash
curl http://localhost:3000/health | jq '.services.sms_fate'
# → "operational"
```

---

## 2. Configuration

### Variables d'environnement (.env)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | SID du compte Twilio (commence par AC) | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Token d'authentification Twilio | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Numéro expéditeur au format E.164 | `+33xxxxxxxxx` |
| `SMS_DAILY_LIMIT` | Limite quotidienne d'envoi | `500` |
| `SMS_MONTHLY_BUDGET` | Budget mensuel (nombre de SMS) | `500` |
| `FATE_MIN_CONFIDENCE` | Seuil de confiance FATE (0-1) | `0.6` |
| `NODE_ENV` | Environnement (`development` / `production`) | `production` |

### Architecture des fichiers

```
apps/server/
├── config/
│   ├── twilio.config.js        # Client Twilio singleton
│   └── sms-templates.js        # 8 templates × 5 variantes FATE
├── controllers/
│   └── sms.controller.js       # 12 handlers HTTP
├── middleware/
│   ├── twilio-webhook.middleware.js  # Validation signature Twilio
│   └── sms-budget.middleware.js      # Contrôle budget 500 SMS/mois
├── routes/
│   └── sms.routes.js           # 12 routes API v2
├── services/
│   ├── sms.service.js          # Service SMS principal (14 méthodes)
│   ├── fate-profile.service.js # Moteur de détection FATE
│   └── alert.service.js        # Monitoring + alertes CRON
├── tests/
│   ├── sms.service.test.js     # 10 suites de tests
│   └── fate-profile.test.js    # 8 suites de tests
├── test-sms.js                 # Script de test manuel
└── jest.config.js              # Configuration Jest ESM
```

---

## 3. Framework FATE

Le framework FATE catégorise automatiquement les voyageurs en 4 profils comportementaux + 1 fallback :

| Profil | Code | Description | Indicateurs clés |
|--------|------|-------------|------------------|
| **Family** | `F` | Famille avec enfants | `hasChildren`, 3+ voyageurs, vacances scolaires, maison |
| **Adventure** | `A` | Aventuriers / longs séjours | Séjour >= 7 jours, période vacances, pas d'enfants |
| **Traveler** | `T` | Voyageur pro / solo | 1 voyageur, séjour court (1-3 jours), studio/apartment |
| **Escape** | `E` | Escapade romantique / détente | 2 voyageurs, séjour court, sans enfants |
| **Standard** | `default` | Profil non détecté | Confiance < 0.3 ou données insuffisantes |

### Algorithme de scoring

```
Score F : hasChildren (+0.5), vacances + 3 guests (+0.3), maison (+0.2), longue durée (+0.1)
Score A : longue durée + vacances (+0.4), vacances seules (+0.2), 3+ guests (+0.1)
Score T : solo + court séjour (+0.4), studio (+0.3), hors vacances (+0.2)
Score E : duo + court séjour (+0.45), hors vacances (+0.15), duo seul (+0.2)
```

Le profil avec le score le plus élevé est sélectionné. Si le score max < 0.3, le profil `default` est retourné.

### Enrichissement par messages

Les messages du voyageur peuvent affiner le profil (+0.15 par mot-clé détecté) :

- **Family** : enfant, bébé, famille, lit parapluie, chaise haute, poussette...
- **Adventure** : randonnée, activités, excursion, aventure, sport, kayak...
- **Traveler** : WiFi, bureau, parking, transport, business, travail...
- **Escape** : romantique, anniversaire, couple, spa, dîner, bougie...

---

## 4. API Endpoints

Base URL : `/api/v2/sms`

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/otp` | Générer et envoyer un code OTP |
| `POST` | `/webhooks/twilio` | Webhook de statut Twilio |

### Routes authentifiées

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/status/:sid` | Vérifier le statut d'un SMS |
| `GET` | `/history` | Historique des SMS envoyés |
| `GET` | `/stats` | Statistiques globales |
| `GET` | `/stats/fate` | Statistiques FATE (distribution des profils) |
| `GET` | `/dashboard` | Dashboard complet (stats + FATE + templates) |

### Routes admin

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/send` | Envoyer un SMS simple |
| `POST` | `/template` | Envoyer un SMS template |
| `POST` | `/fate` | Envoyer un SMS FATE (détection auto) |
| `POST` | `/bulk` | Envoi groupé de SMS |
| `POST` | `/bulk/fate` | Envoi groupé FATE |

---

## 5. Templates FATE

8 templates disponibles, chacun avec 5 variantes (F, A, T, E, default) :

| Template | Description | Variantes FATE |
|----------|-------------|----------------|
| `welcome` | Message de bienvenue | Oui (5 versions) |
| `accessCode` | Code d'accès au logement | Oui (5 versions) |
| `checkoutReminder` | Rappel de départ | Oui (5 versions) |
| `reviewRequest` | Demande d'avis | Oui (5 versions) |
| `paymentConfirmed` | Confirmation de paiement | Oui (5 versions) |
| `ownerBookingAlert` | Alerte propriétaire | Oui (5 versions) |
| `otp` | Code de vérification | Non (identique pour tous) |
| `urgent` | Message urgent | Non (identique pour tous) |

### Paramètres des templates

| Template | Paramètres requis |
|----------|-------------------|
| `welcome` | `guestName`, `propertyName` |
| `accessCode` | `guestName`, `propertyName`, `accessCode`, `checkInTime` |
| `checkoutReminder` | `guestName`, `checkOutTime` |
| `otp` | `code`, `expirationMinutes` |
| `urgent` | `message` |
| `paymentConfirmed` | `guestName`, `amount`, `propertyName` |
| `reviewRequest` | `guestName`, `propertyName`, `reviewLink` |
| `ownerBookingAlert` | `ownerName`, `guestName`, `propertyName`, `checkIn`, `checkOut` |

---

## 6. Exemples d'utilisation

### SMS simple

```bash
curl -X POST http://localhost:3000/api/v2/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "destinataire": "+33612345678",
    "message": "Bienvenue chez Vectrys !"
  }'
```

### SMS FATE (détection automatique)

```bash
curl -X POST http://localhost:3000/api/v2/sms/fate \
  -H "Content-Type: application/json" \
  -d '{
    "destinataire": "+33612345678",
    "templateName": "welcome",
    "templateParams": {
      "guestName": "Marie",
      "propertyName": "Le Petit Nid"
    },
    "bookingData": {
      "nbGuests": 4,
      "duration": 7,
      "hasChildren": true,
      "propertyType": "house",
      "period": "2026-07-15"
    }
  }'
```

Réponse :
```json
{
  "succes": true,
  "messageSid": "SM...",
  "fateProfile": {
    "detected": "F",
    "used": "F",
    "confidence": 0.8,
    "label": "Family",
    "reasons": ["hasChildren", "schoolHoliday_3guests"]
  }
}
```

### OTP

```bash
curl -X POST http://localhost:3000/api/v2/sms/otp \
  -H "Content-Type: application/json" \
  -d '{
    "destinataire": "+33612345678",
    "expirationMinutes": 10
  }'
```

### Envoi groupé FATE

```bash
curl -X POST http://localhost:3000/api/v2/sms/bulk/fate \
  -H "Content-Type: application/json" \
  -d '{
    "envois": [
      {
        "destinataire": "+33612345678",
        "templateName": "welcome",
        "templateParams": { "guestName": "Marie", "propertyName": "Le Nid" },
        "bookingData": { "nbGuests": 4, "hasChildren": true, "duration": 7 }
      },
      {
        "destinataire": "+33698765432",
        "templateName": "welcome",
        "templateParams": { "guestName": "Jean", "propertyName": "Le Studio" },
        "bookingData": { "nbGuests": 1, "duration": 2, "propertyType": "studio" }
      }
    ]
  }'
```

### Dashboard

```bash
curl http://localhost:3000/api/v2/sms/dashboard
```

---

## 7. Monitoring & Alertes

### CRON automatique

Un job CRON s'exécute **toutes les heures** et vérifie :

| Check | Seuil d'alerte | Description |
|-------|----------------|-------------|
| Taux d'échec SMS | > 5% sur 24h | Alerte si trop de SMS en erreur |
| Budget mensuel | 80% / 90% / 100% | Alertes progressives à chaque palier |
| Distribution FATE | > 60% un profil, > 30% default | Détecte un biais dans le profilage |

### Endpoint de stats

```bash
# Stats globales (période : day, week, month)
curl "http://localhost:3000/api/v2/sms/stats?periode=month"

# Stats FATE
curl "http://localhost:3000/api/v2/sms/stats/fate"
```

---

## 8. Tests

### Tests unitaires (Jest)

```bash
# Lancer tous les tests
NODE_OPTIONS='--experimental-vm-modules' npx jest

# Tests SMS uniquement
NODE_OPTIONS='--experimental-vm-modules' npx jest tests/sms.service.test.js

# Tests FATE uniquement
NODE_OPTIONS='--experimental-vm-modules' npx jest tests/fate-profile.test.js

# Avec couverture
NODE_OPTIONS='--experimental-vm-modules' npx jest --coverage
```

**Couverture minimale requise** : 70% lignes, 70% fonctions, 60% branches

### Test manuel

```bash
node test-sms.js
```

9 tests couvrant : détection FATE (F, T, E), enrichissement messages, templates, vacances scolaires, envoi réel SMS, envoi FATE SMS, alertes monitoring.

---

## 9. Sécurité

### Validation des webhooks Twilio

En production, chaque webhook entrant est validé via `twilio.validateRequest()` pour vérifier la signature X-Twilio-Signature. Désactivé en mode développement.

### Rate limiting

- **10 SMS/minute** par numéro de téléphone
- **500 SMS/mois** budget global (configurable via `SMS_MONTHLY_BUDGET`)
- Réponse HTTP 429 si le budget est dépassé

### Validation des entrées

- Numéros de téléphone validés au format E.164
- Templates avec paramètres vérifiés avant envoi
- Protection contre l'injection dans les messages

### Données sensibles

- Les tokens Twilio ne sont jamais exposés dans les réponses API
- Les SID de messages sont les seuls identifiants retournés
- Les logs en base ne stockent pas le contenu complet en clair

---

## 10. Cas d'usage métier

### Parcours voyageur type

```
1. Réservation confirmée → SMS "paymentConfirmed" (profil FATE détecté)
2. J-1 avant arrivée     → SMS "welcome" (variante FATE)
3. Jour d'arrivée        → SMS "accessCode" (variante FATE)
4. Jour de départ        → SMS "checkoutReminder" (variante FATE)
5. J+1 après départ      → SMS "reviewRequest" (variante FATE)
```

### Parcours propriétaire

```
1. Nouvelle réservation → SMS "ownerBookingAlert" (variante FATE du voyageur)
```

### Authentification

```
1. Connexion / inscription → SMS "otp" (identique pour tous les profils)
```

---

## 11. Règles de contenu

Les templates SMS respectent les règles suivantes :

- **Aucune référence** à l'alcool, drogues ou substances illicites
- **Ton professionnel** et chaleureux adapté au profil FATE
- **Longueur** optimisée pour 1 segment SMS (160 caractères max si possible)
- **Personnalisation** via `{guestName}`, `{propertyName}`, etc.
- **OTP et urgent** : messages identiques pour tous les profils (sécurité)

---

## 12. Troubleshooting

### Le serveur ne démarre pas

```bash
# Vérifier que les variables Twilio sont définies
echo $TWILIO_ACCOUNT_SID  # Doit commencer par "AC"
echo $TWILIO_PHONE_NUMBER  # Doit commencer par "+"

# Vérifier la base de données
npx prisma db push
```

### Erreur "Authentication Error - invalid username"

- Vérifier que `TWILIO_ACCOUNT_SID` commence par `AC`
- Vérifier que `TWILIO_AUTH_TOKEN` est correct (pas le token de test)
- S'assurer qu'il n'y a pas de caractères invisibles dans le `.env`

### SMS non reçus

```bash
# Vérifier le statut du SMS
curl "http://localhost:3000/api/v2/sms/status/SM_XXXXXX"

# Vérifier le budget restant
curl "http://localhost:3000/api/v2/sms/stats?periode=month"
```

### Tests qui échouent

```bash
# S'assurer d'utiliser le flag ESM
NODE_OPTIONS='--experimental-vm-modules' npx jest

# Vérifier les mocks Prisma
npx prisma generate
```

### Webhook Twilio en local

```bash
# Installer ngrok
npm install -g ngrok

# Exposer le port local
ngrok http 3000

# Configurer l'URL webhook dans Twilio Console :
# https://xxxx.ngrok.io/api/v2/sms/webhooks/twilio
```

---

**VECTRYS** — Plateforme de gestion locative avec intelligence comportementale FATE
