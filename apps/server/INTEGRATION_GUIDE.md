# 🚀 Integration Guide - Universal Quiz System

Guide complet pour intégrer le système de quiz universel dans le backend existant.

---

## ✅ Étape 1: Intégrer les Routes

### Modifier `server.js` ou `app.js`

Ajouter l'import et le middleware pour les routes Universal Quiz:

```javascript
// Dans /BACKEND/server.js ou app.js

const express = require('express');
const app = express();

// ... autres imports ...

// Import Universal Quiz routes
const universalQuizRoutes = require('./routes/quiz.universal.routes');

// ... autres middlewares (cors, bodyParser, etc.) ...

// Mount Universal Quiz routes
app.use('/api/quiz/universal', universalQuizRoutes);

// ... autres routes existantes ...
// app.use('/api/quiz/language', languageQuizRoutes);
// app.use('/api/quiz/cleaning', cleaningQuizRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Universal Quiz API available at http://localhost:${PORT}/api/quiz/universal`);
});
```

---

## ✅ Étape 2: Migrer la Base de Données

### 1. Copier le Schema Extended

```bash
cd BACKEND

# Copier le schema extended dans schema.prisma principal
cat prisma/schema-extended-quiz.prisma >> prisma/schema.prisma
```

### 2. Créer la Migration

```bash
npx prisma migrate dev --name add_universal_quiz_system
```

**Output attendu:**
```
Applying migration `20260206_add_universal_quiz_system`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260206_add_universal_quiz_system/
    └─ migration.sql

✔ Generated Prisma Client
```

### 3. Vérifier les Tables

```bash
npx prisma studio
```

Ouvrir http://localhost:5555 et vérifier:
- `UniversalQuizQuestion` existe
- `UniversalQuizResponse` existe

---

## ✅ Étape 3: Seed Initial Data

### Exécuter le Seed

```bash
node prisma/seeds/universal-quiz-250.seed.js
```

**Vérification:**
```bash
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM UniversalQuizQuestion;"
```

Devrait retourner: `251`

---

## ✅ Étape 4: Tester les Endpoints

### Test 1: Health Check (Types disponibles)

```bash
curl http://localhost:3000/api/quiz/universal/types
```

**Attendu:**
```json
{
  "success": true,
  "question_types": [
    { "type": "AUDIO_TO_IMAGE", "count": 40 },
    { "type": "TEXT_TO_IMAGE", "count": 40 },
    ...
  ]
}
```

### Test 2: Get Random Question

```bash
curl "http://localhost:3000/api/quiz/universal/random?housekeeper_id=h1&category=bedroom&count=1"
```

### Test 3: Start Session

```bash
curl -X POST http://localhost:3000/api/quiz/universal/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "housekeeper_id": "h1",
    "question_count": 5,
    "category": "bedroom"
  }'
```

### Test 4: Submit Response

```bash
curl -X POST http://localhost:3000/api/quiz/universal/respond \
  -H "Content-Type: application/json" \
  -d '{
    "housekeeper_id": "h1",
    "question_id": "QUESTION_ID_FROM_ABOVE",
    "user_answer": { "id": "A" },
    "session_id": "SESSION_ID_FROM_ABOVE",
    "time_taken_seconds": 10
  }'
```

### Test 5: Get User Stats

```bash
curl http://localhost:3000/api/quiz/universal/stats/h1
```

---

## ✅ Étape 5: Frontend Integration

### 1. Créer API Client Helper

```javascript
// /FRONTEND/src/api/universalQuiz.js

import apiClient from './client';

export const universalQuizApi = {
  // Session
  startSession: async (config) =>
    apiClient.post('/quiz/universal/session/start', config),

  getSession: async (sessionId) =>
    apiClient.get(`/quiz/universal/session/${sessionId}`),

  // Questions
  getQuestion: async (questionId) =>
    apiClient.get(`/quiz/universal/question/${questionId}`),

  getRandomQuestion: async (params) =>
    apiClient.get('/quiz/universal/random', { params }),

  // Responses
  submitResponse: async (data) =>
    apiClient.post('/quiz/universal/respond', data),

  // Stats
  getUserStats: async (housekeeperId) =>
    apiClient.get(`/quiz/universal/stats/${housekeeperId}`),

  // Admin
  getTypes: async () =>
    apiClient.get('/quiz/universal/types')
};
```

### 2. Utiliser dans un Composant

```jsx
// /FRONTEND/src/pages/UniversalQuizPage.jsx

import { useState, useEffect } from 'react';
import { universalQuizApi } from '../api/universalQuiz';
import { UniversalQuestionRenderer } from '../components/questions';

export default function UniversalQuizPage() {
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Start session on mount
  useEffect(() => {
    startQuiz();
  }, []);

  const startQuiz = async () => {
    try {
      const response = await universalQuizApi.startSession({
        housekeeper_id: 'h1', // Get from auth context
        question_count: 10,
        category: 'bedroom'
      });

      setSession(response.data.session);
      await loadQuestion(response.data.session.questions[0].id);
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const loadQuestion = async (questionId) => {
    try {
      const response = await universalQuizApi.getQuestion(questionId);
      setCurrentQuestion(response.data.question);
      setShowFeedback(false);
    } catch (error) {
      console.error('Failed to load question:', error);
    }
  };

  const handleAnswer = async ({ questionId, answer, type }) => {
    try {
      const response = await universalQuizApi.submitResponse({
        housekeeper_id: 'h1',
        question_id: questionId,
        user_answer: answer,
        session_id: session.session_id,
        time_taken_seconds: 15
      });

      setLastResult(response.data.result);
      setShowFeedback(true);

      // Auto advance after 3s
      setTimeout(() => {
        if (currentQuestionIndex < session.questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          loadQuestion(session.questions[nextIndex].id);
        } else {
          // Quiz finished
          showResults();
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const showResults = async () => {
    const stats = await universalQuizApi.getSession(session.session_id);
    console.log('Final stats:', stats.data.stats);
    // Navigate to results page or show modal
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-4">
        Question {currentQuestionIndex + 1} / {session.questions.length}
      </div>

      {/* Question Renderer */}
      <UniversalQuestionRenderer
        question={currentQuestion}
        onAnswer={handleAnswer}
        showFeedback={showFeedback}
        isCorrect={lastResult?.is_correct}
      />
    </div>
  );
}
```

---

## ✅ Étape 6: Testing

### Créer Tests Automatisés

```javascript
// /BACKEND/tests/universal-quiz.test.js

const request = require('supertest');
const app = require('../server'); // Your Express app

describe('Universal Quiz API', () => {
  let sessionId;
  let questionId;

  test('GET /types - Should return question types', async () => {
    const res = await request(app)
      .get('/api/quiz/universal/types')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.question_types).toBeDefined();
    expect(res.body.question_types.length).toBeGreaterThan(0);
  });

  test('POST /session/start - Should create session', async () => {
    const res = await request(app)
      .post('/api/quiz/universal/session/start')
      .send({
        housekeeper_id: 'h1',
        question_count: 5,
        category: 'bedroom'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.session.session_id).toBeDefined();
    expect(res.body.session.questions.length).toBe(5);

    sessionId = res.body.session.session_id;
    questionId = res.body.session.questions[0].id;
  });

  test('GET /question/:id - Should return question', async () => {
    const res = await request(app)
      .get(`/api/quiz/universal/question/${questionId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.question).toBeDefined();
    expect(res.body.question.correct_answer).toBeUndefined(); // Should not include answer
  });

  test('POST /respond - Should validate answer', async () => {
    const res = await request(app)
      .post('/api/quiz/universal/respond')
      .send({
        housekeeper_id: 'h1',
        question_id: questionId,
        user_answer: { id: 'A' },
        session_id: sessionId,
        time_taken_seconds: 10
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.result.is_correct).toBeDefined();
    expect(res.body.result.xp_earned).toBeGreaterThan(0);
  });

  test('GET /session/:id - Should return session stats', async () => {
    const res = await request(app)
      .get(`/api/quiz/universal/session/${sessionId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.total_questions).toBeGreaterThan(0);
  });

  test('GET /stats/:housekeeperId - Should return user stats', async () => {
    const res = await request(app)
      .get('/api/quiz/universal/stats/h1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.stats.total_questions_answered).toBeGreaterThan(0);
  });
});

// Test Fuzzy Matching
describe('Fuzzy Matching (Dictée)', () => {
  test('Should accept similar text', () => {
    const { checkFuzzyMatch } = require('../services/universal-quiz.service');

    const result = checkFuzzyMatch(
      'je netoie la chambre', // typo
      'je nettoie la chambre',
      0.8
    );

    expect(result.match).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.8);
  });

  test('Should reject very different text', () => {
    const { checkFuzzyMatch } = require('../services/universal-quiz.service');

    const result = checkFuzzyMatch(
      'je mange une pomme',
      'je nettoie la chambre',
      0.8
    );

    expect(result.match).toBe(false);
  });
});
```

### Exécuter les Tests

```bash
npm test
```

---

## ✅ Étape 7: Monitoring & Logs

### Ajouter Logging

```javascript
// Dans universal-quiz.service.js

const logger = require('./logger'); // Votre logger (Winston, etc.)

async function submitResponse(responseData) {
  logger.info('Quiz response submitted', {
    housekeeper_id: responseData.housekeeper_id,
    question_id: responseData.question_id,
    session_id: responseData.session_id
  });

  // ... existing code ...

  logger.info('Quiz response validated', {
    is_correct: validation.isCorrect,
    xp_earned: xpEarned
  });

  return result;
}
```

### Monitoring Metrics

```javascript
// Track metrics avec Prometheus/StatsD

const metrics = {
  questionsServed: 0,
  responsesReceived: 0,
  avgResponseTime: 0,
  accuracyRate: 0
};

// Update dans chaque endpoint
router.post('/respond', async (req, res) => {
  metrics.responsesReceived++;
  // ...
});
```

---

## ✅ Étape 8: Déploiement Production

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/vectrys_db"
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://vectrys-lingua.com
```

### Build & Deploy

```bash
# Build frontend
cd FRONTEND
npm run build

# Start backend
cd BACKEND
npm start
```

### Nginx Configuration (optionnel)

```nginx
server {
  listen 80;
  server_name api.vectrys-lingua.com;

  location /api/quiz/universal {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## ✅ Checklist Finale

### Backend
- [ ] Routes intégrées dans `server.js`
- [ ] Migration Prisma appliquée
- [ ] Seed 251 questions exécuté
- [ ] Tests API passent (200 OK)
- [ ] Logs configurés
- [ ] Environnement variables configurées

### Frontend
- [ ] API client créé (`universalQuiz.js`)
- [ ] Components questions intégrés
- [ ] UniversalQuestionRenderer connecté
- [ ] Flux quiz testé end-to-end
- [ ] Mobile responsive vérifié

### Production
- [ ] Database backups configurés
- [ ] Rate limiting activé
- [ ] CORS configuré correctement
- [ ] SSL/HTTPS activé
- [ ] Monitoring déployé

---

## 🐛 Troubleshooting

### Erreur: "Table does not exist"
**Solution**: Exécuter migration Prisma
```bash
npx prisma migrate dev
```

### Erreur: "No questions available"
**Solution**: Exécuter le seed
```bash
node prisma/seeds/universal-quiz-250.seed.js
```

### Erreur: "Cannot find module"
**Solution**: Installer dépendances
```bash
npm install
```

### Port 3000 déjà utilisé
**Solution**: Changer le port
```bash
PORT=3001 npm start
```

---

## 📚 Resources

- API Documentation: `/BACKEND/routes/API_UNIVERSAL_QUIZ.md`
- Service Logic: `/BACKEND/services/universal-quiz.service.js`
- Frontend Components: `/FRONTEND/src/components/questions/`
- Database Schema: `/BACKEND/prisma/schema-extended-quiz.prisma`

---

**Prêt pour production! 🚀**
