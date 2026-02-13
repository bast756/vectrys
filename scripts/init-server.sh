#!/bin/bash
# ============================================
# VECTRYS — Script d'initialisation VPS Hostinger
# À exécuter en root sur un Ubuntu 24.04 LTS frais
# ============================================

set -e

echo "🚀 VECTRYS — Initialisation du serveur..."

# ============================================
# 1. MISE À JOUR SYSTÈME
# ============================================
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y
apt install -y curl wget git unzip htop nano ufw fail2ban \
    ca-certificates gnupg lsb-release software-properties-common

# ============================================
# 2. INSTALLATION DOCKER
# ============================================
echo "🐳 Installation de Docker..."

# Supprimer d'anciennes versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Ajouter le repo Docker officiel
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Vérifier
docker --version
docker compose version

echo "✅ Docker installé"

# ============================================
# 3. CRÉER L'UTILISATEUR DEPLOY
# ============================================
echo "👤 Création de l'utilisateur deploy..."

if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "Deploy User" deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy

    # Permettre sudo sans mot de passe pour deploy (optionnel, retirer en prod durcie)
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

    # Copier les clés SSH de root vers deploy
    mkdir -p /home/deploy/.ssh
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true

    echo "✅ Utilisateur deploy créé"
else
    echo "ℹ️  Utilisateur deploy existe déjà"
fi

# ============================================
# 4. CONFIGURER LE FIREWALL (UFW)
# ============================================
echo "🔥 Configuration du firewall UFW..."

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp comment 'SSH'

# HTTP / HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Activer
ufw --force enable

echo "✅ Firewall configuré (SSH + HTTP + HTTPS)"

# ============================================
# 5. CONFIGURER FAIL2BAN
# ============================================
echo "🛡️ Configuration de fail2ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo "✅ fail2ban configuré"

# ============================================
# 6. CONFIGURER LES PARAMÈTRES SYSTÈME
# ============================================
echo "⚙️ Optimisation système..."

# Timezone
timedatectl set-timezone Europe/Paris

# Swap (2GB — utile pour les builds Docker)
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap 2GB créé"
fi

# Limites système pour Docker/Node
cat >> /etc/sysctl.conf << 'EOF'
# VECTRYS optimizations
vm.swappiness=10
vm.overcommit_memory=1
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
fs.file-max=65535
EOF
sysctl -p

echo "✅ Système optimisé"

# ============================================
# 7. CRÉER LA STRUCTURE DU PROJET
# ============================================
echo "📁 Création de la structure du projet..."

mkdir -p /opt/vectrys/{backend,frontend/dist,nginx/conf.d,scripts,backups,data/{postgres,redis,n8n}}
chown -R deploy:deploy /opt/vectrys

echo "✅ Structure créée dans /opt/vectrys"

# ============================================
# 8. INSTALLER CERTBOT
# ============================================
echo "🔒 Installation de Certbot..."

apt install -y certbot
# Note : les certificats seront générés via Docker/Certbot
# mais on garde aussi certbot en standalone pour le setup initial

echo "✅ Certbot installé"

# ============================================
# 9. CONFIGURER LOGROTATE POUR DOCKER
# ============================================
echo "📋 Configuration logrotate Docker..."

cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

systemctl restart docker

echo "✅ Logrotate Docker configuré"

# ============================================
# 10. SCRIPT DE BACKUP AUTOMATIQUE
# ============================================
echo "💾 Configuration des sauvegardes..."

cat > /opt/vectrys/scripts/backup.sh << 'BACKUP_EOF'
#!/bin/bash
# VECTRYS — Backup automatique quotidien
set -e

BACKUP_DIR="/opt/vectrys/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "🔄 Backup VECTRYS — $DATE"

# Backup PostgreSQL
docker exec vectrys-postgres pg_dump -U vectrys -d vectrys -F c \
    -f /tmp/vectrys_${DATE}.dump 2>/dev/null

docker cp vectrys-postgres:/tmp/vectrys_${DATE}.dump \
    ${BACKUP_DIR}/db_${DATE}.dump

docker exec vectrys-postgres rm /tmp/vectrys_${DATE}.dump

# Backup n8n data
docker cp vectrys-n8n:/home/node/.n8n/database.sqlite \
    ${BACKUP_DIR}/n8n_${DATE}.sqlite 2>/dev/null || echo "⚠️ n8n backup skipped"

# Compression
cd ${BACKUP_DIR}
tar -czf vectrys_backup_${DATE}.tar.gz \
    db_${DATE}.dump \
    n8n_${DATE}.sqlite 2>/dev/null || true

# Nettoyage fichiers temporaires
rm -f db_${DATE}.dump n8n_${DATE}.sqlite 2>/dev/null || true

# Rotation — supprimer les backups > 7 jours
find ${BACKUP_DIR} -name "vectrys_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Backup terminé : vectrys_backup_${DATE}.tar.gz"
ls -lh ${BACKUP_DIR}/vectrys_backup_${DATE}.tar.gz
BACKUP_EOF

chmod +x /opt/vectrys/scripts/backup.sh

# Cron backup quotidien à 3h du matin
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/vectrys/scripts/backup.sh >> /var/log/vectrys-backup.log 2>&1") | crontab -

echo "✅ Backup automatique configuré (3h du matin)"

# ============================================
# RÉSUMÉ
# ============================================
echo ""
echo "============================================"
echo "🎉 VECTRYS — Serveur prêt !"
echo "============================================"
echo ""
echo "  🐳 Docker    : $(docker --version | cut -d' ' -f3)"
echo "  🔧 Compose   : $(docker compose version --short)"
echo "  🕐 Timezone  : $(timedatectl show -p Timezone --value)"
echo "  🔥 Firewall  : Actif (SSH + HTTP + HTTPS)"
echo "  🛡️  fail2ban  : Actif"
echo "  💾 Swap      : 2 GB"
echo "  📁 Projet    : /opt/vectrys"
echo "  👤 User      : deploy"
echo ""
echo "  Prochaine étape :"
echo "  1. Copier les fichiers Docker Compose dans /opt/vectrys/"
echo "  2. Configurer le .env"
echo "  3. Générer les certificats SSL"
echo "  4. docker compose up -d"
echo ""
