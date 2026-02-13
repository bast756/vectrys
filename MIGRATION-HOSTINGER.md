# 🚀 VECTRYS — Migration complète vers Hostinger VPS (Paris)

## CONTEXTE
VECTRYS migre de Railway (US-West) + Vercel (US) + n8n Cloud vers un **unique VPS Hostinger KVM 2** à Paris pour :
- Conformité RGPD (données en France)
- Réduction des coûts (~6,59€/mois au lieu de ~$35/mois)
- Meilleure latence pour les utilisateurs européens
- n8n illimité en self-hosted

## ARCHITECTURE CIBLE

```
┌─────────────────────────────────────────────────────┐
│              HOSTINGER VPS KVM 2 (Paris)             │
│              2 vCPU / 8 GB RAM / 100 GB NVMe        │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │              NGINX (reverse proxy)           │    │
│  │  :80/:443 → SSL auto (Certbot)              │    │
│  │                                              │    │
│  │  app.vectrys.fr  → frontend (static)         │    │
│  │  api.vectrys.fr  → backend :3001             │    │
│  │  n8n.vectrys.fr  → n8n :5678                │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────┐    │
│  │ Backend  │ │PostgreSQL│ │ Redis  │ │  n8n │    │
│  │ Node.js  │ │   16     │ │   7    │ │      │    │
│  │ :3001    │ │  :5432   │ │ :6379  │ │:5678 │    │
│  └──────────┘ └──────────┘ └────────┘ └──────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │         Volumes Docker persistants           │    │
│  │  postgres_data / redis_data / n8n_data       │    │
│  │  uploads / backups                           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## PHASE 1 — ACHAT ET CONFIGURATION VPS HOSTINGER (Manuel)

### 1.1 Acheter le VPS
1. Aller sur https://www.hostinger.fr/vps-hosting
2. Choisir **KVM 2** (~6,59€/mois)
   - 2 vCPU, 8 GB RAM, 100 GB NVMe SSD
3. **Datacenter : Paris, France** 🇫🇷
4. OS : **Ubuntu 24.04 LTS**
5. Activer les **sauvegardes automatiques hebdomadaires**
6. Noter l'IP publique et les accès SSH root

### 1.2 Configurer DNS (chez ton registrar de domaine)
Ajouter ces enregistrements DNS pour `vectrys.fr` :

```
Type    Nom              Valeur              TTL
A       app              <IP_VPS>            3600
A       api              <IP_VPS>            3600
A       n8n              <IP_VPS>            3600
```

### 1.3 Première connexion SSH
```bash
ssh root@<IP_VPS>
```

---

## PHASE 2 — SETUP SERVEUR (Claude Code peut exécuter via SSH)

### 2.1 Script d'initialisation serveur
Exécuter `scripts/init-server.sh` sur le VPS :
- Met à jour le système
- Installe Docker + Docker Compose
- Installe Certbot (SSL)
- Crée l'utilisateur `deploy` (non-root)
- Configure le firewall UFW
- Configure la clé SSH pour le déploiement
- Installe fail2ban pour la sécurité

### 2.2 Créer la structure de projet
```bash
/opt/vectrys/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── vectrys.conf
├── backend/
│   └── Dockerfile
├── frontend/
│   └── (build static files)
├── backups/
│   └── backup.sh
└── data/
    ├── postgres/
    ├── redis/
    └── n8n/
```

---

## PHASE 3 — DOCKER COMPOSE PRODUCTION

Voir fichier `docker-compose.yml` fourni.

Services :
1. **postgres** — PostgreSQL 16 Alpine, volume persistant
2. **redis** — Redis 7 Alpine, volume persistant
3. **backend** — Node.js app (build depuis le repo GitHub)
4. **n8n** — n8n self-hosted, volume persistant
5. **nginx** — Reverse proxy + SSL + fichiers statiques frontend
6. **certbot** — Renouvellement SSL automatique

---

## PHASE 4 — CI/CD AVEC GITHUB ACTIONS

Voir fichier `.github/workflows/deploy.yml` fourni.

Workflow :
1. Push sur `principal` déclenche le pipeline
2. Build du frontend (npm run build)
3. Build du backend (Docker image)
4. SSH vers le VPS
5. Pull les changements
6. `docker compose up -d --build`
7. Health check

---

## PHASE 5 — MIGRATION DES DONNÉES

### 5.1 Exporter la base PostgreSQL depuis Railway
```bash
# Sur Railway (via CLI ou pg_dump distant)
pg_dump -h <RAILWAY_POSTGRES_HOST> -U <USER> -d railway -F c -f vectrys_backup.dump
```

### 5.2 Importer sur le nouveau PostgreSQL
```bash
# Copier le dump sur le VPS
scp vectrys_backup.dump deploy@<IP_VPS>:/opt/vectrys/backups/

# Restaurer
docker exec -i vectrys-postgres pg_restore -U vectrys -d vectrys < /opt/vectrys/backups/vectrys_backup.dump
```

### 5.3 Exporter le workflow n8n
1. Dans n8n Cloud → ton workflow "VECTRYS Night Builder v3 SIMPLE"
2. Clic droit → Export → JSON
3. Importer dans le nouveau n8n à `n8n.vectrys.fr`

---

## PHASE 6 — VÉRIFICATION ET CUTOVER

### 6.1 Checklist de vérification
- [ ] `https://api.vectrys.fr/health` retourne 200
- [ ] `https://app.vectrys.fr` charge le frontend
- [ ] `https://n8n.vectrys.fr` affiche l'interface n8n
- [ ] SSL valide sur les 3 domaines (certificats Let's Encrypt)
- [ ] Base de données accessible et tables présentes
- [ ] Redis opérationnel
- [ ] 20 services backend démarrent sans erreur
- [ ] Night Builder workflow fonctionne
- [ ] Sauvegardes automatiques configurées

### 6.2 Cutover
1. Vérifier que tout fonctionne sur le nouveau VPS
2. Mettre à jour les variables DNS (TTL court d'abord)
3. Désactiver Railway
4. Résilier n8n Cloud
5. Monitorer 48h

---

## PHASE 7 — MAINTENANCE QUOTIDIENNE

### Sauvegardes automatiques
- Script `scripts/backup.sh` en cron quotidien (2h du matin)
- Backup PostgreSQL + volumes Docker
- Rotation : garder 7 jours de backups

### Monitoring
- Health check endpoint toutes les 5 min
- Docker health checks sur chaque conteneur
- Alertes par email/Telegram si un service tombe

### Mises à jour
```bash
# Mensuel
sudo apt update && sudo apt upgrade -y
docker compose pull
docker compose up -d
```

---

## VARIABLES D'ENVIRONNEMENT (.env)

```env
# === GÉNÉRAL ===
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.vectrys.fr
API_URL=https://api.vectrys.fr

# === BASE DE DONNÉES ===
DATABASE_URL=postgresql://vectrys:${POSTGRES_PASSWORD}@postgres:5432/vectrys
POSTGRES_USER=vectrys
POSTGRES_PASSWORD=<GÉNÉRER_MOT_DE_PASSE_FORT>
POSTGRES_DB=vectrys

# === REDIS ===
REDIS_URL=redis://redis:6379

# === JWT ===
JWT_SECRET=<GÉNÉRER_SECRET_256_BITS>
JWT_REFRESH_SECRET=<GÉNÉRER_SECRET_256_BITS>

# === APIS EXTERNES (reprendre de Railway) ===
GOOGLE_MAPS_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENWEATHER_API_KEY=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
FIREBASE_SERVICE_ACCOUNT=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# === N8N ===
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<MOT_DE_PASSE_FORT>
N8N_HOST=n8n.vectrys.fr
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.vectrys.fr/
```

---

## COÛTS FINAUX

| Service | Avant | Après |
|---------|-------|-------|
| Backend + DB | Railway ~$10/mois | Inclus VPS |
| Frontend | Vercel $0 | Inclus VPS |
| n8n | n8n Cloud ~$20/mois | Inclus VPS |
| VPS Hostinger | — | ~6,59€/mois |
| Domaine | existant | existant |
| SSL | auto | auto (Certbot) |
| **TOTAL** | **~$30-35/mois** | **~6,59€/mois** |

Économie annuelle : **~300€** 🎉
