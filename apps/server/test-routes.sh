#!/bin/bash

##############################################################################
# VECTRYS LINGUA - Routes Testing Script
# Tests all 26 backend routes with sample requests
#
# Usage: ./test-routes.sh
# Requirements: curl, jq (optional, for pretty JSON output)
##############################################################################

# Configuration
API_BASE="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

# Function to print test result
print_result() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if server is running
print_header "0. HEALTH CHECK"
echo "Testing: GET /health"
curl -s "$API_BASE/../health" | jq '.' || echo "Server not running or jq not installed"
echo ""

##############################################################################
# 1. HOUSEKEEPING ROUTES (6 routes)
##############################################################################

print_header "1. HOUSEKEEPING ROUTES (6 routes)"

# 1.1 Register Housekeeper
echo "1.1 POST /api/housekeeping/register"
curl -s -X POST "$API_BASE/housekeeping/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "company_id": "company_001",
    "first_name": "Maria",
    "last_name": "Silva",
    "email": "maria.silva@test.com",
    "phone": "+33612345678",
    "native_language": "pt",
    "target_language": "fr"
  }' | jq '.' 2>/dev/null || echo "❌ Failed"
echo ""

# 1.2 Get Housekeeper by ID
echo "1.2 GET /api/housekeeping/:id"
curl -s "$API_BASE/housekeeping/housekeeper_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 1.3 Update Housekeeper
echo "1.3 PUT /api/housekeeping/:id"
curl -s -X PUT "$API_BASE/housekeeping/housekeeper_001" \
  -H "$CONTENT_TYPE" \
  -d '{
    "phone": "+33698765432",
    "bio": "Experienced housekeeper with 5 years"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 1.4 Get Progress
echo "1.4 GET /api/housekeeping/:id/progress"
curl -s "$API_BASE/housekeeping/housekeeper_001/progress" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 1.5 Customize Avatar
echo "1.5 POST /api/housekeeping/:id/avatar"
curl -s -X POST "$API_BASE/housekeeping/housekeeper_001/avatar" \
  -H "$CONTENT_TYPE" \
  -d '{
    "base_avatar": "avatar_female_02",
    "skin_tone": "#8d5524",
    "hair_style": "long_wavy",
    "hair_color": "#2c1b18",
    "outfit": "vectrys_uniform_blue",
    "mood": "motivated"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 1.6 Get Housekeepers by Company
echo "1.6 GET /api/housekeeping/company/:companyId"
curl -s "$API_BASE/housekeeping/company/company_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

##############################################################################
# 2. LANGUAGE QUIZ ROUTES (6 routes)
##############################################################################

print_header "2. LANGUAGE QUIZ ROUTES (6 routes)"

# 2.1 Get Questions
echo "2.1 GET /api/quiz/language/questions"
curl -s "$API_BASE/quiz/language/questions?level=A1.1&category=vocabulary&limit=5" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 2.2 Get Single Question
echo "2.2 GET /api/quiz/language/question/:id"
curl -s "$API_BASE/quiz/language/question/question_lang_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 2.3 Submit Answer
echo "2.3 POST /api/quiz/language/respond"
curl -s -X POST "$API_BASE/quiz/language/respond" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_001",
    "question_id": "question_lang_001",
    "selected_option": "A",
    "time_spent": 8,
    "session_id": "session_001"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 2.4 Get Session Stats
echo "2.4 GET /api/quiz/language/session/:id"
curl -s "$API_BASE/quiz/language/session/session_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 2.5 Start New Session
echo "2.5 POST /api/quiz/language/session/start"
curl -s -X POST "$API_BASE/quiz/language/session/start" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_001",
    "level": "A1.1",
    "category": "vocabulary",
    "question_count": 10
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 2.6 Get User Stats
echo "2.6 GET /api/quiz/language/stats/:userId"
curl -s "$API_BASE/quiz/language/stats/housekeeper_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

##############################################################################
# 3. CLEANING QUIZ ROUTES (6 routes)
##############################################################################

print_header "3. CLEANING QUIZ ROUTES (6 routes)"

# 3.1 Get Cleaning Questions
echo "3.1 GET /api/quiz/cleaning/questions"
curl -s "$API_BASE/quiz/cleaning/questions?category=techniques&hotel_standard=4-star&limit=5" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 3.2 Get Single Question
echo "3.2 GET /api/quiz/cleaning/question/:id"
curl -s "$API_BASE/quiz/cleaning/question/question_clean_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 3.3 Submit Answer
echo "3.3 POST /api/quiz/cleaning/respond"
curl -s -X POST "$API_BASE/quiz/cleaning/respond" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_001",
    "question_id": "question_clean_001",
    "selected_option": "B",
    "time_spent": 12,
    "session_id": "session_clean_001"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 3.4 Get Certification Questions
echo "3.4 GET /api/quiz/cleaning/certification"
curl -s "$API_BASE/quiz/cleaning/certification?hotel_standard=4-star" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 3.5 Validate Certification
echo "3.5 POST /api/quiz/cleaning/validate-cert"
curl -s -X POST "$API_BASE/quiz/cleaning/validate-cert" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_001",
    "hotel_standard": "4-star",
    "session_id": "cert_session_001"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 3.6 Get User Stats
echo "3.6 GET /api/quiz/cleaning/stats/:userId"
curl -s "$API_BASE/quiz/cleaning/stats/housekeeper_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

##############################################################################
# 4. MARKETPLACE ROUTES (8 routes)
##############################################################################

print_header "4. MARKETPLACE ROUTES (8 routes)"

# 4.1 Get Items Catalog
echo "4.1 GET /api/marketplace/items"
curl -s "$API_BASE/marketplace/items?type=avatar&rarity=epic&limit=10" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.2 Get Item Detail
echo "4.2 GET /api/marketplace/item/:id"
curl -s "$API_BASE/marketplace/item/item_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.3 Purchase Item
echo "4.3 POST /api/marketplace/purchase"
curl -s -X POST "$API_BASE/marketplace/purchase" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_001",
    "item_id": "item_001",
    "quantity": 1
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.4 Get My Inventory
echo "4.4 GET /api/marketplace/my-inventory"
curl -s "$API_BASE/marketplace/my-inventory?user_id=housekeeper_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.5 Create Trade Offer
echo "4.5 POST /api/marketplace/trade/create"
curl -s -X POST "$API_BASE/marketplace/trade/create" \
  -H "$CONTENT_TYPE" \
  -d '{
    "from_user_id": "housekeeper_001",
    "to_user_id": "housekeeper_002",
    "offered_items": ["item_001"],
    "offered_xp": 100,
    "requested_items": ["item_002"],
    "requested_xp": 50,
    "message": "Trade my avatar for your outfit?"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.6 Accept Trade
echo "4.6 PUT /api/marketplace/trade/:id/accept"
curl -s -X PUT "$API_BASE/marketplace/trade/trade_001/accept" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_002"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.7 Reject Trade
echo "4.7 PUT /api/marketplace/trade/:id/reject"
curl -s -X PUT "$API_BASE/marketplace/trade/trade_001/reject" \
  -H "$CONTENT_TYPE" \
  -d '{
    "user_id": "housekeeper_002",
    "reason": "Not interested"
  }' | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

# 4.8 Get User Trades
echo "4.8 GET /api/marketplace/trades/:userId"
curl -s "$API_BASE/marketplace/trades/housekeeper_001" | jq '.' 2>/dev/null || echo "⚠️  No data yet"
echo ""

##############################################################################
# SUMMARY
##############################################################################

print_header "TEST SUMMARY"
echo -e "${GREEN}✓${NC} All 26 routes have been tested"
echo ""
echo "Routes tested:"
echo "  - Housekeeping: 6 routes"
echo "  - Language Quiz: 6 routes"
echo "  - Cleaning Quiz: 6 routes"
echo "  - Marketplace: 8 routes"
echo "  ${YELLOW}Total: 26 routes${NC}"
echo ""
echo "Notes:"
echo "  ⚠️  Many routes will show 'No data yet' until database is seeded"
echo "  ❌ Failed routes indicate server issues or missing data"
echo "  ${BLUE}Next steps:${NC}"
echo "    1. Run: npm run prisma:generate"
echo "    2. Run: npm run prisma:push"
echo "    3. Run: npm run prisma:seed (if seed file exists)"
echo "    4. Run: npm run dev"
echo "    5. Run this test script again"
echo ""
