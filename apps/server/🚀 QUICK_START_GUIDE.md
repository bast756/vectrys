# 🚀 VECTRYS LINGUA - QUICK START GUIDE

**Version:** 3.0.0
**Date:** 2026-02-06
**Status:** ✅ Production Ready

---

## 📋 PRÉ-REQUIS

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** ≥ 14.0 (local ou cloud)
- **Git** (optionnel)

---

## ⚡ INSTALLATION RAPIDE (5 minutes)

### 1️⃣ Installation des dépendances

```bash
cd /Users/caerou/Desktop/VECTRYS_SAUVEGARDE_COMPLETE/00_REPLIT_READY/BACKEND

npm install
```

**Résultat attendu :**
```
added 487 packages in 45s
```

---

### 2️⃣ Configuration de la base de données

#### A. Créer le fichier `.env`

```bash
cp .env.example .env
```

#### B. Éditer `.env` avec vos paramètres

```env
# Database PostgreSQL
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/vectrys_lingua"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT (optionnel pour l'instant)
JWT_SECRET=your-super-secret-key-change-this

# LLM APIs (optionnel pour l'instant)
ANTHROPIC_API_KEY=sk-ant-your-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

**💡 Astuce :** Si vous utilisez PostgreSQL local :
```bash
# Créer la database
psql -U postgres
CREATE DATABASE vectrys_lingua;
\q
```

---

### 3️⃣ Générer Prisma Client

```bash
npm run prisma:generate
```

**Résultat attendu :**
```
✔ Generated Prisma Client (5.9.1)
```

---

### 4️⃣ Créer les tables de la base de données

```bash
npm run prisma:push
```

**Résultat attendu :**
```
🚀 Your database is now in sync with your Prisma schema. Done in 2.34s

✔ Generated Prisma Client
```

---

### 5️⃣ Peupler la base avec les données de test

```bash
npm run prisma:seed
```

**Résultat attendu :**
```
🌱 Starting database seed...

📦 Seeding companies...
✅ 3 companies created

👥 Seeding housekeepers...
✅ 10 housekeepers created

📈 Seeding language progress...
✅ Language progress created for 10 housekeepers

❓ Seeding language quiz questions...
✅ 100 language questions created

🧹 Seeding cleaning quiz questions...
✅ 50 cleaning questions created

🛍️ Seeding marketplace items...
✅ 100 marketplace items created

✅ Database seeding completed successfully!
```

---

### 6️⃣ Démarrer le serveur

```bash
npm run dev
```

**Résultat attendu :**
```
🚀 VECTRYS Backend Server Started
=====================================
Environment: development
Port: 3000
Health: http://localhost:3000/health
API: http://localhost:3000/api/llm
=====================================
```

---

## ✅ VÉRIFICATION

### Test 1 : Health Check

```bash
curl http://localhost:3000/health
```

**Résultat attendu :**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T...",
  "environment": "development",
  "version": "2.0.0",
  "services": {
    "fate": "operational",
    "emotional": "operational",
    "soncas": "operational",
    "chat": "operational",
    "housekeeping": "operational",
    "language_quiz": "operational",
    "cleaning_quiz": "operational",
    "marketplace": "operational",
    "xp_system": "operational",
    "badge_system": "operational"
  },
  "platform": "Vectrys Lingua - Complete AAA Learning Platform"
}
```

---

### Test 2 : Liste des endpoints

```bash
curl http://localhost:3000/
```

**Résultat attendu :**
```json
{
  "message": "VECTRYS Backend API - Complete Platform",
  "version": "2.0.0",
  "endpoints": {
    "health": "/health",
    "llm": "/api/llm/*",
    "housekeeping": "/api/housekeeping/*",
    "language_quiz": "/api/quiz/language/*",
    "cleaning_quiz": "/api/quiz/cleaning/*",
    "marketplace": "/api/marketplace/*"
  },
  "total_routes": 26,
  "features": [...]
}
```

---

### Test 3 : Récupérer les housekeepers

```bash
curl http://localhost:3000/api/housekeeping/company/company_001
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "company": {...},
    "housekeepers": [
      {
        "id": "hk_001",
        "first_name": "Maria",
        "last_name": "Silva",
        ...
      }
    ],
    "total": 3
  }
}
```

---

### Test 4 : Script de test complet

```bash
./test-routes.sh
```

Cela va tester les **26 routes** avec des exemples de requêtes.

---

## 📊 DONNÉES DE TEST DISPONIBLES

### Companies (3)
- `company_001` - CleanPro Paris
- `company_002` - Hôtellerie Services Lyon
- `company_003` - Vectrys Conciergerie

### Housekeepers (10)
- `hk_001` - Maria Silva (pt → fr, A2.1, 2500 XP)
- `hk_002` - Ahmed Benali (ar → fr, A1.2, 1200 XP)
- `hk_003` - Elena Popescu (ro → fr, B1.1, 4800 XP)
- `hk_004` - Carmen Rodriguez (es → fr, B2.1, 8500 XP)
- `hk_005` - Olga Ivanova (ru → fr, A2.2, 2800 XP)
- `hk_006` - Ana Santos (pt → fr, B1.2, 5500 XP)
- `hk_007` - Fatima El Amrani (ar → fr, C1, 15000 XP)
- `hk_008` - Magdalena Kowalski (pl → fr, A1.1, 500 XP)
- `hk_009` - Li Wei (zh → fr, A2.1, 2200 XP)
- `hk_010` - Sofia Martinez (es → fr, B2.2, 9200 XP)

### Questions
- **100+ questions de langue** (A1.1 → C2)
- **50+ questions de nettoyage** (3★ → Luxe)

### Items Marketplace
- **100+ items** (avatars, accessoires, tenues, fonds, emotes)
- Raretés : common, rare, epic, legendary, mythic

---

## 🛠️ COMMANDES UTILES

### Développement
```bash
npm run dev              # Démarrer avec nodemon (auto-reload)
npm start                # Démarrer en production
```

### Prisma
```bash
npm run prisma:studio    # Interface graphique DB (http://localhost:5555)
npm run prisma:generate  # Régénérer le client Prisma
npm run prisma:push      # Pousser le schéma vers la DB
npm run prisma:migrate   # Créer une migration
npm run prisma:seed      # Re-seeder la DB
```

### Tests
```bash
npm test                 # Run tests Jest
./test-routes.sh         # Tester toutes les routes
```

---

## 🔧 DÉPANNAGE

### Erreur : "Can't reach database server"

**Solution :**
```bash
# Vérifier que PostgreSQL est démarré
pg_isready

# Ou démarrer PostgreSQL
# macOS avec Homebrew:
brew services start postgresql

# Linux:
sudo service postgresql start
```

---

### Erreur : "Environment variable not found: DATABASE_URL"

**Solution :**
```bash
# Vérifier que .env existe
ls -la .env

# Si non, créer depuis .env.example
cp .env.example .env

# Éditer .env avec vos paramètres
nano .env
```

---

### Erreur : "Cannot find module '@prisma/client'"

**Solution :**
```bash
npm run prisma:generate
```

---

### Port 3000 déjà utilisé

**Solution :**
```bash
# Changer le port dans .env
PORT=3001

# Ou tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📡 ENDPOINTS DISPONIBLES

### Housekeeping (6 routes)
- `POST   /api/housekeeping/register` - Inscrire une femme de ménage
- `GET    /api/housekeeping/:id` - Récupérer le profil
- `PUT    /api/housekeeping/:id` - Mettre à jour le profil
- `GET    /api/housekeeping/:id/progress` - Progression détaillée
- `POST   /api/housekeeping/:id/avatar` - Personnaliser l'avatar
- `GET    /api/housekeeping/company/:companyId` - Liste par société

### Language Quiz (6 routes)
- `GET    /api/quiz/language/questions` - Récupérer des questions
- `GET    /api/quiz/language/question/:id` - Question unique
- `POST   /api/quiz/language/respond` - Soumettre une réponse
- `GET    /api/quiz/language/session/:id` - Stats de session
- `POST   /api/quiz/language/session/start` - Démarrer une session
- `GET    /api/quiz/language/stats/:userId` - Stats utilisateur

### Cleaning Quiz (6 routes)
- `GET    /api/quiz/cleaning/questions` - Questions nettoyage
- `GET    /api/quiz/cleaning/question/:id` - Question unique
- `POST   /api/quiz/cleaning/respond` - Soumettre réponse
- `GET    /api/quiz/cleaning/certification` - Questions certification
- `POST   /api/quiz/cleaning/validate-cert` - Valider certification
- `GET    /api/quiz/cleaning/stats/:userId` - Stats utilisateur

### Marketplace (8 routes)
- `GET    /api/marketplace/items` - Catalogue d'items
- `GET    /api/marketplace/item/:id` - Détail d'un item
- `POST   /api/marketplace/purchase` - Acheter un item
- `GET    /api/marketplace/my-inventory` - Mon inventaire
- `POST   /api/marketplace/trade/create` - Créer une offre de trade
- `PUT    /api/marketplace/trade/:id/accept` - Accepter un trade
- `PUT    /api/marketplace/trade/:id/reject` - Refuser un trade
- `GET    /api/marketplace/trades/:userId` - Historique des trades

---

## 🎯 PROCHAINES ÉTAPES

### Option 1 : Explorer l'API
```bash
# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Naviguer vers http://localhost:5555
```

### Option 2 : Tester avec Postman/Insomnia
Importer la collection de tests depuis `test-routes.sh`

### Option 3 : Créer le Frontend
Passer à l'intégration React avec :
- Components pour quiz
- Avatar 3D avec Three.js
- Sage AI Professor
- Système de badges et XP

---

## 💡 ASTUCES

### Réinitialiser complètement la DB
```bash
npm run prisma:push --force-reset
npm run prisma:seed
```

### Voir les logs en temps réel
```bash
npm run dev | grep -E "POST|GET|PUT|DELETE"
```

### Tester une route spécifique
```bash
curl -X POST http://localhost:3000/api/housekeeping/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "company_001",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "native_language": "en",
    "target_language": "fr"
  }' | jq '.'
```

---

## 📚 DOCUMENTATION COMPLÈTE

- **Backend Integration:** `✅ BACKEND_INTEGRATION_COMPLETE.md`
- **Database Schema:** `prisma/schema.prisma`
- **XP System:** `services/xp.service.js`
- **Badge System:** `services/badge.service.js`
- **Routes Documentation:** Voir chaque fichier dans `routes/`

---

## 🆘 SUPPORT

Si vous rencontrez des problèmes :

1. Vérifier les logs du serveur
2. Consulter `✅ BACKEND_INTEGRATION_COMPLETE.md`
3. Tester avec `./test-routes.sh`
4. Vérifier la connexion DB avec Prisma Studio

---

**🎉 Vous êtes prêt ! Le backend Vectrys Lingua est opérationnel !**

*Mission : Donner la liberté d'apprendre à des milliers de personnes* 🦅
