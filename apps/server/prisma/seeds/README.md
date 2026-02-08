# 🌱 Universal Quiz Seeds - Guide d'Utilisation

## 📦 Fichiers de Seed

### `universal-quiz-250.seed.js` - Recommandé ⭐
**251 questions complètes** couvrant tous les niveaux CECRL (A1.0 → B2.1)

**Distribution:**
- 26 ALPHABET (A-Z)
- 40 AUDIO_TO_IMAGE (vocabulaire audio-visuel)
- 40 TEXT_TO_IMAGE (lecture + images)
- 30 IMAGE_TO_TEXT (reconnaissance vocabulaire)
- 20 AUDIO_TO_TEXT (dictée progressive)
- 20 GENDER_SELECTION (masculin/féminin)
- 25 CONJUGATION (présent, passé, futur)
- 15 MATCHING (association mots-images)
- 15 COLOR_DESCRIPTION (couleurs + descriptions)
- 20 FILL_BLANK (complétion de phrases)

**Répartition par niveau:**
- A1.0 (Analphabètes): ~50 questions (alphabet + audio-image)
- A1.1-A1.2 (Débutants): ~70 questions (lecture basique)
- A2.1-A2.2 (Élémentaire): ~80 questions (grammaire + écriture)
- B1.1-B1.2 (Intermédiaire): ~40 questions (conjugaison avancée)
- B2.1 (Avancé): ~11 questions (communication professionnelle)

## 🚀 Installation

### Prérequis

1. **Migrer la base de données**:
```bash
cd BACKEND
npx prisma migrate dev --name add_universal_quiz_system
```

2. **Vérifier que le modèle existe**:
```bash
npx prisma generate
```

### Exécuter le Seed

```bash
# Depuis /BACKEND
node prisma/seeds/universal-quiz-250.seed.js
```

**Output attendu:**
```
🌱 Starting ULTRA Universal Quiz Seed (250 questions)...

📊 Total questions to seed: 251

📈 Breakdown:
   🔤 ALPHABET: 26
   🎧 AUDIO_TO_IMAGE: 40
   📖 TEXT_TO_IMAGE: 40
   🖼️  IMAGE_TO_TEXT: 30
   ✍️  AUDIO_TO_TEXT: 20
   ⚧️  GENDER_SELECTION: 20
   📝 CONJUGATION: 25
   🔗 MATCHING: 15
   🎨 COLOR_DESCRIPTION: 15
   📄 FILL_BLANK: 20

✅ 251/251 (100%)

🎉 Seed completed!
✅ Success: 251
❌ Errors: 0

🎓 Répartition par niveau:
   A1.0: 50 questions
   A1.1: 35 questions
   A1.2: 35 questions
   A2.1: 45 questions
   A2.2: 35 questions
   B1.1: 25 questions
   B1.2: 20 questions
   B2.1: 6 questions
```

## 📊 Vérification Post-Seed

### 1. Vérifier dans Prisma Studio

```bash
npx prisma studio
```

Ouvrir `http://localhost:5555` et vérifier:
- Table `UniversalQuizQuestion` contient 251 lignes
- Différents `question_type` présents
- Niveaux CECRL variés (A1.0 → B2.1)

### 2. Vérifier via SQL

```bash
npx prisma db execute --stdin <<< "
SELECT
  question_type,
  difficulty_level,
  COUNT(*) as count
FROM UniversalQuizQuestion
GROUP BY question_type, difficulty_level
ORDER BY difficulty_level, question_type;
"
```

### 3. Test API Query

```javascript
// Dans Node REPL ou script test
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Get all alphabet questions
  const alphabetQs = await prisma.universalQuizQuestion.findMany({
    where: { question_type: 'ALPHABET' }
  });
  console.log(`Alphabet questions: ${alphabetQs.length}`); // Should be 26

  // Get A1.0 questions
  const beginnerQs = await prisma.universalQuizQuestion.findMany({
    where: { difficulty_level: 'A1.0' }
  });
  console.log(`A1.0 questions: ${beginnerQs.length}`); // Should be ~50

  // Get cleaning category
  const cleaningQs = await prisma.universalQuizQuestion.findMany({
    where: { category: 'cleaning' }
  });
  console.log(`Cleaning questions: ${cleaningQs.length}`);
}

test();
```

## 📁 Structure des Questions

### Exemples JSON par Type

#### ALPHABET
```json
{
  "question_type": "ALPHABET",
  "difficulty_level": "A1.0",
  "question_audio_url": "/audio/alphabet/a.mp3",
  "options": {
    "type": "alphabet_choice",
    "sound": "A",
    "options": [
      { "id": "A", "letter": "A" },
      { "id": "B", "letter": "B" },
      { "id": "C", "letter": "C" },
      { "id": "D", "letter": "D" }
    ]
  },
  "correct_answer": { "id": "A" }
}
```

#### AUDIO_TO_IMAGE
```json
{
  "question_type": "AUDIO_TO_IMAGE",
  "question_audio_url": "/audio/vocabulary/balai.mp3",
  "options": {
    "type": "image_choice",
    "options": [
      { "id": "A", "image": "/images/cleaning/broom.jpg", "alt": "Balai" },
      { "id": "B", "image": "/images/cleaning/mop.jpg", "alt": "Serpillière" }
    ]
  },
  "correct_answer": { "id": "A" }
}
```

#### AUDIO_TO_TEXT (Dictée)
```json
{
  "question_type": "AUDIO_TO_TEXT",
  "question_audio_url": "/audio/dictation/1_je_nettoie.mp3",
  "options": {
    "type": "free_text",
    "expected_answer": "Je nettoie la chambre",
    "accepted_answers": ["je nettoie la chambre", "Je nettoie la chambre."],
    "fuzzy_match": true,
    "min_similarity": 0.8
  },
  "correct_answer": { "text": "Je nettoie la chambre" }
}
```

## 🎯 Utilisation avec UniversalQuestionRenderer

### Frontend Integration

```jsx
import { UniversalQuestionRenderer } from '@/components/questions';

function QuizSession() {
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    // Fetch question from API
    fetch('/api/quiz/universal/random?level=A1.0&category=bedroom')
      .then(res => res.json())
      .then(data => setCurrentQuestion(data.question));
  }, []);

  const handleAnswer = async ({ questionId, answer, type }) => {
    const response = await fetch('/api/quiz/universal/respond', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        user_answer: answer,
        question_type: type
      })
    });

    const result = await response.json();
    console.log('Correct?', result.is_correct);
  };

  return (
    <UniversalQuestionRenderer
      question={currentQuestion}
      onAnswer={handleAnswer}
      showFeedback={false}
      isCorrect={null}
    />
  );
}
```

## 🔧 Personnalisation des Questions

### Ajouter vos propres questions

```javascript
// Créer un fichier custom-questions.seed.js

const customQuestions = [
  {
    question_type: 'TEXT_TO_IMAGE',
    skill_category: 'READING',
    difficulty_level: 'A1.2',
    category: 'custom_category',
    subcategory: 'my_subcategory',
    question_text: 'Mon mot personnalisé',
    question_audio_url: '/audio/custom/mon_mot.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/custom/image1.jpg', alt: 'Image 1' },
        { id: 'B', image: '/images/custom/image2.jpg', alt: 'Image 2' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Explication personnalisée'
  }
];

// Seed custom questions
async function seedCustom() {
  for (const q of customQuestions) {
    await prisma.universalQuizQuestion.create({ data: q });
  }
}
```

### Filtrer les Questions par Critères

```javascript
// Get questions pour un niveau spécifique
const a1Questions = await prisma.universalQuizQuestion.findMany({
  where: {
    difficulty_level: { startsWith: 'A1' }
  }
});

// Get questions d'un type spécifique pour une catégorie
const bedroomImages = await prisma.universalQuizQuestion.findMany({
  where: {
    question_type: 'TEXT_TO_IMAGE',
    category: 'bedroom'
  }
});

// Get progression pour un user
const userProgress = await prisma.universalQuizResponse.groupBy({
  by: ['question_id'],
  where: { housekeeper_id: 'h1' },
  _count: true,
  _sum: { xp_earned: true }
});
```

## 🐛 Troubleshooting

### Erreur: "Table does not exist"

**Solution**: Migrer la base d'abord
```bash
npx prisma migrate dev
```

### Erreur: "Duplicate key"

**Solution**: Réinitialiser la table
```bash
npx prisma db execute --stdin <<< "TRUNCATE TABLE UniversalQuizQuestion CASCADE;"
node prisma/seeds/universal-quiz-250.seed.js
```

### Images/Audio manquants

**Normal!** Les URLs pointent vers `/public/images/` et `/public/audio/`.

**Options**:
1. Créer les dossiers et ajouter les assets
2. Utiliser des placeholders (placeholder.com)
3. Générer avec AI (Midjourney, DALL-E, ElevenLabs)

## 📚 Ressources

### Générer les Assets

**Images:**
- Placeholder: `https://placeholder.com/400x300?text=Balai`
- Unsplash API: https://unsplash.com/developers
- Pexels API: https://www.pexels.com/api/

**Audio:**
- ElevenLabs: https://elevenlabs.io (TTS haute qualité)
- Google TTS: `https://translate.google.com/translate_tts?tl=fr&q=balai`
- Amazon Polly: https://aws.amazon.com/polly/

### Structure de Dossiers Recommandée

```
/FRONTEND/public/
  /images/
    /bedroom/
      bed.jpg
      pillow.jpg
      sheet.jpg
      ...
    /bathroom/
      towel.jpg
      soap.jpg
      ...
    /cleaning/
      broom.jpg
      vacuum.jpg
      ...
    /kitchen/
      glass.jpg
      plate.jpg
      ...
    /colors/
      white_towel.jpg
      blue_bucket.jpg
      ...
  /audio/
    /alphabet/
      a.mp3
      b.mp3
      ...
    /vocabulary/
      balai.mp3
      lit.mp3
      ...
    /dictation/
      1_je_nettoie.mp3
      2_je_change.mp3
      ...
    /explanations/
      balai.mp3
      lit.mp3
      ...
    /questions/
      what_is_this.mp3
      what_color_towel.mp3
      ...
    /colors/
      blanc.mp3
      bleu.mp3
      ...
    /conjugation/
      1.mp3
      2.mp3
      ...
    /fill_blank/
      1.mp3
      2.mp3
      ...
```

## ✅ Checklist Post-Seed

- [ ] Migration Prisma exécutée
- [ ] Seed exécuté avec succès (251 questions)
- [ ] Prisma Studio confirme 251 lignes
- [ ] Assets images/audio préparés (ou placeholders)
- [ ] API routes créées pour fetch questions
- [ ] UniversalQuestionRenderer testé
- [ ] Tests end-to-end passent

## 🎉 Next Steps

1. **Créer les routes backend API** (`/api/quiz/universal/...`)
2. **Générer/télécharger les assets** (images + audio)
3. **Tester avec UniversalQuestionRenderer**
4. **Intégrer dans HousekeeperPortal**
5. **Déployer en production**

---

**Questions?** Voir `/FRONTEND/EXTENDED_QUIZ_SYSTEM.md` pour documentation complète.
