#!/bin/bash

##############################################################################
# VECTRYS LINGUA - System Check Script
# Vérifie que tous les prérequis sont installés
##############################################################################

echo "🔍 Vérification du système..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ALL_OK=true

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Installé ($NODE_VERSION)"
else
    echo -e "${RED}✗${NC} Non installé"
    echo -e "${YELLOW}Installation requise:${NC} brew install node@18"
    ALL_OK=false
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} Installé ($NPM_VERSION)"
else
    echo -e "${RED}✗${NC} Non installé"
    echo -e "${YELLOW}Installé avec Node.js${NC}"
    ALL_OK=false
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Installé ($PSQL_VERSION)"
else
    echo -e "${RED}✗${NC} Non installé"
    echo -e "${YELLOW}Installation:${NC} brew install postgresql@14"
    echo -e "${YELLOW}Ou télécharger:${NC} https://postgresapp.com/"
    ALL_OK=false
fi

# Check if PostgreSQL is running
echo -n "Checking PostgreSQL service... "
if pg_isready &> /dev/null; then
    echo -e "${GREEN}✓${NC} En cours d'exécution"
else
    echo -e "${YELLOW}⚠${NC} Non démarré"
    echo -e "${YELLOW}Démarrer:${NC} brew services start postgresql@14"
    ALL_OK=false
fi

# Check if database exists
echo -n "Checking database 'vectrys_lingua'... "
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw vectrys_lingua; then
    echo -e "${GREEN}✓${NC} Existe"
else
    echo -e "${YELLOW}⚠${NC} N'existe pas"
    echo -e "${YELLOW}Créer:${NC} createdb vectrys_lingua"
    ALL_OK=false
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Existe"
    
    # Check DATABASE_URL
    if grep -q "DATABASE_URL" .env; then
        echo -e "  ${GREEN}✓${NC} DATABASE_URL configuré"
    else
        echo -e "  ${RED}✗${NC} DATABASE_URL manquant"
        ALL_OK=false
    fi
else
    echo -e "${RED}✗${NC} Absent"
    echo -e "${YELLOW}Créer depuis:${NC} cp .env.example .env"
    ALL_OK=false
fi

# Check node_modules
echo -n "Checking node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installé"
else
    echo -e "${YELLOW}⚠${NC} Pas installé"
    echo -e "${YELLOW}Installer:${NC} npm install"
    ALL_OK=false
fi

# Check Prisma Client
echo -n "Checking Prisma Client... "
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓${NC} Généré"
else
    echo -e "${YELLOW}⚠${NC} Pas généré"
    echo -e "${YELLOW}Générer:${NC} npm run prisma:generate"
    ALL_OK=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ Système prêt !${NC} Vous pouvez démarrer le serveur."
    echo ""
    echo "Commandes à exécuter:"
    echo -e "  ${BLUE}npm run prisma:push${NC}   # Créer les tables"
    echo -e "  ${BLUE}npm run prisma:seed${NC}   # Peupler la DB"
    echo -e "  ${BLUE}npm run dev${NC}            # Démarrer le serveur"
else
    echo -e "${YELLOW}⚠ Configuration incomplète${NC}"
    echo ""
    echo "Suivez les instructions ci-dessus pour installer les éléments manquants."
    echo ""
    echo -e "Guide complet: ${BLUE}../🚀_INSTALLATION_GUIDE.md${NC}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
