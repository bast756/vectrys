#!/bin/bash

echo "🧪 Test de l'API Vectrys Lingua"
echo "======================================="
echo ""

# Test 1: Health Check
echo "1️⃣ Test Health Check..."
echo "GET http://localhost:3000/health"
echo ""
curl -s http://localhost:3000/health 2>/dev/null || echo "⚠️ Serveur non démarré. Lancez: npm run dev"
echo ""
echo ""

# Test 2: Root Endpoint
echo "2️⃣ Test Root Endpoint..."
echo "GET http://localhost:3000/"
echo ""
curl -s http://localhost:3000/ 2>/dev/null || echo "⚠️ Serveur non démarré"
echo ""
echo ""

# Test 3: List Companies
echo "3️⃣ Test Liste des Companies..."
echo "GET http://localhost:3000/api/housekeeping/company/company_001"
echo ""
curl -s http://localhost:3000/api/housekeeping/company/company_001 2>/dev/null || echo "⚠️ Serveur non démarré"
echo ""
echo ""

echo "======================================="
echo "✅ Tests terminés !"
echo ""
echo "Pour démarrer le serveur:"
echo "  cd /Users/caerou/Desktop/VECTRYS_SAUVEGARDE_COMPLETE/00_REPLIT_READY/BACKEND"
echo "  npm run dev"
