#!/bin/bash
# ============================================
# VECTRYS — Génération certificats SSL Let's Encrypt
# À exécuter APRÈS que les DNS pointent vers le VPS
# ============================================

set -e

# Ton email pour Let's Encrypt
EMAIL="${1:-admin@vectrys.fr}"
DOMAINS=("app.vectrys.fr" "api.vectrys.fr" "n8n.vectrys.fr")

echo "🔒 VECTRYS — Génération des certificats SSL"
echo "   Email: $EMAIL"
echo ""

# Vérifier que les DNS pointent correctement
echo "🔍 Vérification DNS..."
for domain in "${DOMAINS[@]}"; do
    ip=$(dig +short "$domain" 2>/dev/null || echo "")
    if [ -z "$ip" ]; then
        echo "❌ $domain ne résout vers aucune IP !"
        echo "   → Configure le DNS A record avant de continuer"
        exit 1
    fi
    echo "   ✅ $domain → $ip"
done
echo ""

# Arrêter Nginx s'il tourne (pour le mode standalone)
docker stop vectrys-nginx 2>/dev/null || true

# Générer les certificats en mode standalone
for domain in "${DOMAINS[@]}"; do
    echo "📜 Certificat pour $domain..."
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domain "$domain" \
        --non-interactive \
        --force-renewal
    echo "   ✅ $domain certificat généré"
done

# Copier les certificats dans le volume Docker
echo ""
echo "📋 Copie vers les volumes Docker..."
# Les certificats sont déjà dans /etc/letsencrypt qui sera monté en volume

# Redémarrer Nginx
docker start vectrys-nginx 2>/dev/null || echo "ℹ️  Nginx pas encore démarré — lance docker compose up"

# Configurer le renouvellement automatique
echo ""
echo "🔄 Configuration du renouvellement automatique..."
(crontab -l 2>/dev/null; echo "0 4 * * 1 certbot renew --quiet --pre-hook 'docker stop vectrys-nginx' --post-hook 'docker start vectrys-nginx' >> /var/log/certbot-renew.log 2>&1") | sort -u | crontab -

echo ""
echo "============================================"
echo "🎉 Certificats SSL générés !"
echo "============================================"
echo ""
for domain in "${DOMAINS[@]}"; do
    echo "  🔒 https://$domain"
done
echo ""
echo "  Renouvellement auto : chaque lundi 4h du matin"
echo ""
