#!/bin/bash
# ============================================
# VECTRYS — Script de déploiement rapide
# Exécuter depuis le VPS en tant que deploy user
# ============================================

set -e

DEPLOY_PATH="/opt/vectrys"

echo "🚀 VECTRYS — Déploiement rapide"
echo ""

cd $DEPLOY_PATH

# Vérifier que les fichiers essentiels sont présents
for file in docker-compose.yml .env backend/Dockerfile nginx/nginx.conf; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant : $file"
        exit 1
    fi
done

echo "✅ Tous les fichiers présents"

# Pull les images de base
echo "📦 Pull des images Docker..."
docker compose pull postgres redis n8n nginx certbot

# Build le backend
echo "🔨 Build du backend..."
docker compose build backend

# Démarrer les services
echo "🚀 Démarrage des services..."
docker compose up -d

# Attendre que tout démarre
echo "⏳ Attente du démarrage (30s)..."
sleep 30

# Vérifier les health checks
echo ""
echo "🏥 Vérification des services..."

services=("vectrys-postgres" "vectrys-redis" "vectrys-backend" "vectrys-n8n" "vectrys-nginx")
all_ok=true

for service in "${services[@]}"; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no-healthcheck")
    running=$(docker inspect --format='{{.State.Running}}' "$service" 2>/dev/null || echo "false")

    if [ "$running" = "true" ]; then
        if [ "$status" = "healthy" ] || [ "$status" = "no-healthcheck" ]; then
            echo "  ✅ $service — running ($status)"
        else
            echo "  ⚠️  $service — running ($status)"
        fi
    else
        echo "  ❌ $service — NOT RUNNING"
        all_ok=false
    fi
done

echo ""

if $all_ok; then
    echo "============================================"
    echo "🎉 VECTRYS déployé avec succès !"
    echo "============================================"
    echo ""
    echo "  🌐 Frontend : https://app.vectrys.fr"
    echo "  🔌 API      : https://api.vectrys.fr/health"
    echo "  🤖 n8n      : https://n8n.vectrys.fr"
    echo ""
    docker compose ps
else
    echo "❌ Certains services ne fonctionnent pas"
    echo "Logs :"
    docker compose logs --tail=20
fi
