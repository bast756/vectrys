# 🏨 VECTRYS - Hospitality Platform Monorepo

## 📁 Structure du Projet

```
vectrys-repo/
├── apps/
│   ├── client/          # Frontend React + Vite
│   └── server/          # Backend Express + Prisma
├── .env.example         # Variables d'environnement template
├── package.json         # Configuration monorepo (workspaces)
└── README.md
```

## 🚀 Quick Start

### 1. Configuration Initiale

```bash
# Installer les dépendances (root + tous les workspaces)
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos vraies valeurs
# IMPORTANT: Remplir DATABASE_URL, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY
```

### 2. Configuration Base de Données

```bash
# Créer la base de données PostgreSQL
createdb vectrys_lingua

# Générer le client Prisma
cd apps/server
npx prisma generate

# Créer les tables (push schema)
npx prisma db push

# (Optionnel) Seed données de test
npm run prisma:seed

# (Optionnel) Ouvrir Prisma Studio
npm run prisma:studio
```

### 3. Démarrage en Développement

#### Option 1: Lancer tout en parallèle (recommandé)
```bash
# Depuis la racine du projet
npm run dev
```

#### Option 2: Lancer séparément
```bash
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 - Backend
npm run dev:server
```

Le frontend sera accessible sur **http://localhost:5173**
Le backend sera accessible sur **http://localhost:3000**

## 📦 Workspaces

### Frontend (`apps/client`)

**Stack:**
- React 18.3.1
- Vite 5.4.2
- TypeScript
- Zustand (state management)
- Axios (HTTP client)
- Socket.io-client (WebSocket)
- Tailwind CSS

**Scripts:**
```bash
npm run dev:client    # Démarrer dev server
npm run build         # Build production
npm run preview       # Preview build
```

### Backend (`apps/server`)

**Stack:**
- Express.js 4.18
- Prisma ORM 5.9
- PostgreSQL
- Socket.io (WebSocket)
- JWT Authentication
- Anthropic Claude API
- ElevenLabs API

**Features:**
- ✅ Housekeeper Management (6 routes)
- ✅ Language Quiz A1.1-C2 (6 routes)
- ✅ Cleaning Certification (6 routes)
- ✅ Universal Quiz System (10 routes)
- ✅ Marketplace & P2P Trading (8 routes)
- ✅ Hero Quest Journey (20 routes)
- ✅ Agent de Terrain Module (19 routes)
- ✅ XP & Badge System
- ✅ Avatar 3D Customization
- ✅ Sage AI Professor
- ✅ 5 Narrative Worlds
- ✅ Adaptive Learning Algorithm

**Scripts:**
```bash
npm run dev:server       # Démarrer avec nodemon
npm run start            # Production start
npm run prisma:generate  # Générer client Prisma
npm run prisma:push      # Push schema to DB
npm run prisma:studio    # Ouvrir Prisma Studio
```

## 🔧 Configuration

### Variables d'Environnement Requises

**Frontend:**
- `VITE_API_URL` - URL de l'API backend
- `VITE_WS_URL` - URL WebSocket

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Clé API Claude
- `ELEVENLABS_API_KEY` - Clé API text-to-speech
- `JWT_SECRET` - Secret pour JWT tokens

Voir [.env.example](./.env.example) pour la liste complète.

## 📚 Documentation

- **Backend API**: Voir [apps/server/README_BACKEND.md](apps/server/README_BACKEND.md)
- **Integration Guide**: Voir [apps/server/INTEGRATION_GUIDE.md](apps/server/INTEGRATION_GUIDE.md)
- **Security**: Voir [apps/server/SECURITY.md](apps/server/SECURITY.md)

## 🧪 Tests

```bash
# Frontend tests
npm run test --workspace=apps/client

# Backend tests
npm run test --workspace=apps/server
```

## 🏗️ Build Production

```bash
# Build both apps
npm run build

# Frontend dist -> apps/client/dist/
# Backend compiled -> apps/server/dist/ (if applicable)
```

## 🐳 Docker (À venir)

```bash
docker-compose up
```

## 📄 Licence

MIT License - VECTRYS Team

## 🤝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

---

**Version:** 2.0.0
**Last Updated:** February 2026
