const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🌱 SEED UNIVERSAL QUIZ QUESTIONS
 *
 * 120+ questions couvrant tous les types et niveaux CECRL
 * Thématique: Vocabulaire hôtelier/nettoyage pour femmes de ménage
 *
 * Structure:
 * - 26 ALPHABET (A-Z)
 * - 20 AUDIO_TO_IMAGE (vocabulaire basique)
 * - 20 TEXT_TO_IMAGE (transition lecture)
 * - 10 IMAGE_TO_TEXT
 * - 8 AUDIO_TO_TEXT (dictée)
 * - 8 GENDER_SELECTION
 * - 8 CONJUGATION
 * - 6 MATCHING
 * - 6 COLOR_DESCRIPTION
 * - 8 FILL_BLANK
 */

// ========================================
// 1. ALPHABET QUESTIONS (26) - A1.0
// ========================================
const alphabetQuestions = [
  // Voyelles
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'vowels',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/a.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'A',
      audio_url: '/audio/alphabet/a.mp3',
      options: [
        { id: 'A', letter: 'A' },
        { id: 'B', letter: 'B' },
        { id: 'C', letter: 'C' },
        { id: 'D', letter: 'D' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'La lettre A se prononce "a"',
    explanation_audio_url: '/audio/alphabet/a_explanation.mp3'
  },
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'vowels',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/e.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'E',
      options: [
        { id: 'E', letter: 'E' },
        { id: 'F', letter: 'F' },
        { id: 'G', letter: 'G' },
        { id: 'H', letter: 'H' }
      ]
    },
    correct_answer: { id: 'E' },
    explanation_text: 'La lettre E se prononce "e"',
    explanation_audio_url: '/audio/alphabet/e_explanation.mp3'
  },
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'vowels',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/i.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'I',
      options: [
        { id: 'I', letter: 'I' },
        { id: 'J', letter: 'J' },
        { id: 'K', letter: 'K' },
        { id: 'L', letter: 'L' }
      ]
    },
    correct_answer: { id: 'I' },
    explanation_text: 'La lettre I se prononce "i"'
  },
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'vowels',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/o.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'O',
      options: [
        { id: 'M', letter: 'M' },
        { id: 'N', letter: 'N' },
        { id: 'O', letter: 'O' },
        { id: 'P', letter: 'P' }
      ]
    },
    correct_answer: { id: 'O' },
    explanation_text: 'La lettre O se prononce "o"'
  },
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'vowels',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/u.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'U',
      options: [
        { id: 'S', letter: 'S' },
        { id: 'T', letter: 'T' },
        { id: 'U', letter: 'U' },
        { id: 'V', letter: 'V' }
      ]
    },
    correct_answer: { id: 'U' },
    explanation_text: 'La lettre U se prononce "u"'
  },

  // Consonnes communes (sample - 21 more needed)
  {
    question_type: 'ALPHABET',
    skill_category: 'ALPHABET',
    difficulty_level: 'A1.0',
    category: 'alphabet',
    subcategory: 'consonants',
    question_text: 'Quelle lettre entendez-vous?',
    question_audio_url: '/audio/alphabet/b.mp3',
    options: {
      type: 'alphabet_choice',
      sound: 'B',
      options: [
        { id: 'A', letter: 'A' },
        { id: 'B', letter: 'B' },
        { id: 'C', letter: 'C' },
        { id: 'D', letter: 'D' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'La lettre B se prononce "bé"'
  }
  // ... (20 more alphabet questions - C through Z)
];

// ========================================
// 2. AUDIO_TO_IMAGE QUESTIONS (20) - A1.0+
// ========================================
const audioToImageQuestions = [
  {
    question_type: 'AUDIO_TO_IMAGE',
    skill_category: 'LISTENING',
    difficulty_level: 'A1.0',
    category: 'bedroom',
    subcategory: 'furniture',
    question_text: null, // Audio only
    question_audio_url: '/audio/vocabulary/bed.mp3',
    question_image_url: null,
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/bedroom/bed.jpg', alt: 'Lit' },
        { id: 'B', image: '/images/bedroom/chair.jpg', alt: 'Chaise' },
        { id: 'C', image: '/images/bedroom/table.jpg', alt: 'Table' },
        { id: 'D', image: '/images/bedroom/closet.jpg', alt: 'Armoire' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Un lit, c\'est où on dort',
    explanation_audio_url: '/audio/explanations/bed.mp3'
  },
  {
    question_type: 'AUDIO_TO_IMAGE',
    skill_category: 'LISTENING',
    difficulty_level: 'A1.0',
    category: 'cleaning',
    subcategory: 'tools',
    question_audio_url: '/audio/vocabulary/broom.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/cleaning/vacuum.jpg', alt: 'Aspirateur' },
        { id: 'B', image: '/images/cleaning/broom.jpg', alt: 'Balai' },
        { id: 'C', image: '/images/cleaning/mop.jpg', alt: 'Serpillière' },
        { id: 'D', image: '/images/cleaning/bucket.jpg', alt: 'Seau' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'Le balai sert à balayer le sol',
    explanation_audio_url: '/audio/explanations/broom.mp3'
  },
  {
    question_type: 'AUDIO_TO_IMAGE',
    skill_category: 'LISTENING',
    difficulty_level: 'A1.0',
    category: 'bathroom',
    subcategory: 'items',
    question_audio_url: '/audio/vocabulary/towel.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/bathroom/towel.jpg', alt: 'Serviette' },
        { id: 'B', image: '/images/bathroom/soap.jpg', alt: 'Savon' },
        { id: 'C', image: '/images/bathroom/shampoo.jpg', alt: 'Shampooing' },
        { id: 'D', image: '/images/bathroom/toilet_paper.jpg', alt: 'Papier toilette' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'La serviette sert à s\'essuyer'
  },
  {
    question_type: 'AUDIO_TO_IMAGE',
    skill_category: 'LISTENING',
    difficulty_level: 'A1.0',
    category: 'kitchen',
    subcategory: 'items',
    question_audio_url: '/audio/vocabulary/glass.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/kitchen/plate.jpg', alt: 'Assiette' },
        { id: 'B', image: '/images/kitchen/glass.jpg', alt: 'Verre' },
        { id: 'C', image: '/images/kitchen/fork.jpg', alt: 'Fourchette' },
        { id: 'D', image: '/images/kitchen/spoon.jpg', alt: 'Cuillère' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'Le verre sert à boire'
  },
  {
    question_type: 'AUDIO_TO_IMAGE',
    skill_category: 'LISTENING',
    difficulty_level: 'A1.1',
    category: 'bedroom',
    subcategory: 'furniture',
    question_audio_url: '/audio/vocabulary/pillow.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/bedroom/pillow.jpg', alt: 'Oreiller' },
        { id: 'B', image: '/images/bedroom/blanket.jpg', alt: 'Couverture' },
        { id: 'C', image: '/images/bedroom/sheet.jpg', alt: 'Drap' },
        { id: 'D', image: '/images/bedroom/mattress.jpg', alt: 'Matelas' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'L\'oreiller se met sous la tête'
  }
  // ... (15 more AUDIO_TO_IMAGE questions)
];

// ========================================
// 3. TEXT_TO_IMAGE QUESTIONS (20) - A1.1-A1.2
// ========================================
const textToImageQuestions = [
  {
    question_type: 'TEXT_TO_IMAGE',
    skill_category: 'READING',
    difficulty_level: 'A1.1',
    category: 'cleaning',
    subcategory: 'tools',
    question_text: 'Balai',
    question_audio_url: '/audio/vocabulary/broom.mp3', // Helper audio
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/cleaning/broom.jpg', alt: 'Balai' },
        { id: 'B', image: '/images/cleaning/mop.jpg', alt: 'Serpillière' },
        { id: 'C', image: '/images/cleaning/vacuum.jpg', alt: 'Aspirateur' },
        { id: 'D', image: '/images/cleaning/duster.jpg', alt: 'Plumeau' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Le balai sert à balayer'
  },
  {
    question_type: 'TEXT_TO_IMAGE',
    skill_category: 'READING',
    difficulty_level: 'A1.1',
    category: 'bedroom',
    subcategory: 'furniture',
    question_text: 'Lit',
    question_audio_url: '/audio/vocabulary/bed.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/bedroom/bed.jpg', alt: 'Lit' },
        { id: 'B', image: '/images/bedroom/sofa.jpg', alt: 'Canapé' },
        { id: 'C', image: '/images/bedroom/desk.jpg', alt: 'Bureau' },
        { id: 'D', image: '/images/bedroom/nightstand.jpg', alt: 'Table de nuit' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Le lit, c\'est pour dormir'
  },
  {
    question_type: 'TEXT_TO_IMAGE',
    skill_category: 'READING',
    difficulty_level: 'A1.1',
    category: 'bathroom',
    subcategory: 'items',
    question_text: 'Savon',
    question_audio_url: '/audio/vocabulary/soap.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/bathroom/soap.jpg', alt: 'Savon' },
        { id: 'B', image: '/images/bathroom/shampoo.jpg', alt: 'Shampooing' },
        { id: 'C', image: '/images/bathroom/toothpaste.jpg', alt: 'Dentifrice' },
        { id: 'D', image: '/images/bathroom/lotion.jpg', alt: 'Lotion' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Le savon sert à se laver les mains'
  },
  {
    question_type: 'TEXT_TO_IMAGE',
    skill_category: 'READING',
    difficulty_level: 'A1.2',
    category: 'cleaning',
    subcategory: 'products',
    question_text: 'Éponge',
    question_audio_url: '/audio/vocabulary/sponge.mp3',
    options: {
      type: 'image_choice',
      options: [
        { id: 'A', image: '/images/cleaning/sponge.jpg', alt: 'Éponge' },
        { id: 'B', image: '/images/cleaning/cloth.jpg', alt: 'Chiffon' },
        { id: 'C', image: '/images/cleaning/gloves.jpg', alt: 'Gants' },
        { id: 'D', image: '/images/cleaning/spray.jpg', alt: 'Spray' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'L\'éponge absorbe l\'eau'
  }
  // ... (16 more TEXT_TO_IMAGE questions)
];

// ========================================
// 4. IMAGE_TO_TEXT QUESTIONS (10) - A1.2-A2
// ========================================
const imageToTextQuestions = [
  {
    question_type: 'IMAGE_TO_TEXT',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A1.2',
    category: 'bedroom',
    subcategory: 'furniture',
    question_text: 'Qu\'est-ce que c\'est?',
    question_image_url: '/images/bedroom/bed.jpg',
    question_audio_url: '/audio/questions/what_is_this.mp3',
    options: {
      type: 'multiple_choice',
      options: [
        { id: 'A', text: 'Chaise' },
        { id: 'B', text: 'Lit' },
        { id: 'C', text: 'Table' },
        { id: 'D', text: 'Armoire' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'C\'est un lit. On dort dans un lit.'
  },
  {
    question_type: 'IMAGE_TO_TEXT',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A1.2',
    category: 'cleaning',
    subcategory: 'tools',
    question_text: 'Comment s\'appelle cet objet?',
    question_image_url: '/images/cleaning/vacuum.jpg',
    options: {
      type: 'multiple_choice',
      options: [
        { id: 'A', text: 'Aspirateur' },
        { id: 'B', text: 'Balai' },
        { id: 'C', text: 'Serpillière' },
        { id: 'D', text: 'Plumeau' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'C\'est un aspirateur. Il aspire la poussière.'
  },
  {
    question_type: 'IMAGE_TO_TEXT',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A2.1',
    category: 'bathroom',
    subcategory: 'items',
    question_text: 'Quel est ce produit?',
    question_image_url: '/images/bathroom/shampoo.jpg',
    options: {
      type: 'multiple_choice',
      options: [
        { id: 'A', text: 'Savon' },
        { id: 'B', text: 'Shampooing' },
        { id: 'C', text: 'Gel douche' },
        { id: 'D', text: 'Après-shampooing' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'C\'est du shampooing pour laver les cheveux.'
  }
  // ... (7 more IMAGE_TO_TEXT questions)
];

// ========================================
// 5. AUDIO_TO_TEXT QUESTIONS (8) - A2-B1 (Dictée)
// ========================================
const audioToTextQuestions = [
  {
    question_type: 'AUDIO_TO_TEXT',
    skill_category: 'WRITING',
    difficulty_level: 'A2.1',
    category: 'work',
    subcategory: 'tasks',
    question_text: 'Écoutez et écrivez la phrase',
    question_audio_url: '/audio/dictation/clean_room.mp3',
    options: {
      type: 'free_text',
      expected_answer: 'Je nettoie la chambre',
      accepted_answers: ['je nettoie la chambre', 'Je nettoie la chambre.'],
      fuzzy_match: true,
      min_similarity: 0.8
    },
    correct_answer: { text: 'Je nettoie la chambre' },
    explanation_text: 'La phrase correcte est: "Je nettoie la chambre"'
  },
  {
    question_type: 'AUDIO_TO_TEXT',
    skill_category: 'WRITING',
    difficulty_level: 'A2.1',
    category: 'work',
    subcategory: 'tasks',
    question_audio_url: '/audio/dictation/change_sheets.mp3',
    options: {
      type: 'free_text',
      expected_answer: 'Je change les draps',
      accepted_answers: ['je change les draps', 'Je change les draps.'],
      fuzzy_match: true,
      min_similarity: 0.8
    },
    correct_answer: { text: 'Je change les draps' },
    explanation_text: 'Draps se termine par "s" au pluriel'
  },
  {
    question_type: 'AUDIO_TO_TEXT',
    skill_category: 'WRITING',
    difficulty_level: 'A2.2',
    category: 'bathroom',
    subcategory: 'cleaning',
    question_audio_url: '/audio/dictation/clean_bathroom.mp3',
    options: {
      type: 'free_text',
      expected_answer: 'Je nettoie la salle de bain',
      accepted_answers: ['je nettoie la salle de bain', 'Je nettoie la salle de bain.'],
      fuzzy_match: true,
      min_similarity: 0.8
    },
    correct_answer: { text: 'Je nettoie la salle de bain' },
    explanation_text: '"Salle de bain" s\'écrit en trois mots'
  },
  {
    question_type: 'AUDIO_TO_TEXT',
    skill_category: 'WRITING',
    difficulty_level: 'B1.1',
    category: 'work',
    subcategory: 'schedule',
    question_audio_url: '/audio/dictation/work_morning.mp3',
    options: {
      type: 'free_text',
      expected_answer: 'Je travaille le matin',
      accepted_answers: ['je travaille le matin', 'Je travaille le matin.'],
      fuzzy_match: true,
      min_similarity: 0.8
    },
    correct_answer: { text: 'Je travaille le matin' },
    explanation_text: 'On dit "le matin" (pas "au matin")'
  }
  // ... (4 more AUDIO_TO_TEXT questions)
];

// ========================================
// 6. GENDER_SELECTION QUESTIONS (8) - A1.2-A2
// ========================================
const genderSelectionQuestions = [
  {
    question_type: 'GENDER_SELECTION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A1.2',
    category: 'bedroom',
    subcategory: 'furniture',
    question_text: 'lit',
    question_audio_url: '/audio/vocabulary/bed.mp3',
    options: {
      type: 'gender_choice',
      word: 'lit',
      options: [
        { id: 'M', text: 'Le / Un', label: 'Masculin', color: 'blue' },
        { id: 'F', text: 'La / Une', label: 'Féminin', color: 'pink' }
      ]
    },
    correct_answer: { id: 'M' },
    explanation_text: 'On dit "LE lit" (masculin). Exemple: Le lit est grand.'
  },
  {
    question_type: 'GENDER_SELECTION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A1.2',
    category: 'bedroom',
    subcategory: 'furniture',
    question_text: 'chambre',
    question_audio_url: '/audio/vocabulary/room.mp3',
    options: {
      type: 'gender_choice',
      word: 'chambre',
      options: [
        { id: 'M', text: 'Le / Un', label: 'Masculin', color: 'blue' },
        { id: 'F', text: 'La / Une', label: 'Féminin', color: 'pink' }
      ]
    },
    correct_answer: { id: 'F' },
    explanation_text: 'On dit "LA chambre" (féminin). Exemple: La chambre est propre.'
  },
  {
    question_type: 'GENDER_SELECTION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A1.2',
    category: 'bathroom',
    subcategory: 'items',
    question_text: 'serviette',
    options: {
      type: 'gender_choice',
      word: 'serviette',
      options: [
        { id: 'M', text: 'Le / Un', label: 'Masculin', color: 'blue' },
        { id: 'F', text: 'La / Une', label: 'Féminin', color: 'pink' }
      ]
    },
    correct_answer: { id: 'F' },
    explanation_text: 'On dit "LA serviette" (féminin).'
  },
  {
    question_type: 'GENDER_SELECTION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.1',
    category: 'cleaning',
    subcategory: 'tools',
    question_text: 'aspirateur',
    options: {
      type: 'gender_choice',
      word: 'aspirateur',
      options: [
        { id: 'M', text: 'Le / Un', label: 'Masculin', color: 'blue' },
        { id: 'F', text: 'La / Une', label: 'Féminin', color: 'pink' }
      ]
    },
    correct_answer: { id: 'M' },
    explanation_text: 'On dit "L\'aspirateur" (masculin). Les mots en -eur sont souvent masculins.'
  }
  // ... (4 more GENDER_SELECTION questions)
];

// ========================================
// 7. CONJUGATION QUESTIONS (8) - A2-B2
// ========================================
const conjugationQuestions = [
  {
    question_type: 'CONJUGATION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.1',
    category: 'work',
    subcategory: 'actions',
    question_text: 'Je _______ la chambre',
    question_audio_url: '/audio/conjugation/clean_present.mp3',
    options: {
      type: 'conjugation',
      verb: 'nettoyer',
      tense: 'présent',
      subject: 'je',
      sentence: 'Je _______ la chambre',
      options: [
        { id: 'A', text: 'nettoie' },
        { id: 'B', text: 'nettoies' },
        { id: 'C', text: 'nettoyons' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Au présent, "je" + nettoyer = "je nettoie" (pas de "s")'
  },
  {
    question_type: 'CONJUGATION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.1',
    category: 'work',
    subcategory: 'actions',
    question_text: 'Vous _______ les draps',
    options: {
      type: 'conjugation',
      verb: 'changer',
      tense: 'présent',
      subject: 'vous',
      sentence: 'Vous _______ les draps',
      options: [
        { id: 'A', text: 'change' },
        { id: 'B', text: 'changes' },
        { id: 'C', text: 'changez' }
      ]
    },
    correct_answer: { id: 'C' },
    explanation_text: 'Au présent, "vous" + changer = "vous changez" (avec -ez)'
  },
  {
    question_type: 'CONJUGATION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.2',
    category: 'work',
    subcategory: 'schedule',
    question_text: 'Hier, je _______ toute la journée',
    options: {
      type: 'conjugation',
      verb: 'travailler',
      tense: 'passé composé',
      subject: 'je',
      sentence: 'Hier, je _______ toute la journée',
      options: [
        { id: 'A', text: 'travaille' },
        { id: 'B', text: 'ai travaillé' },
        { id: 'C', text: 'travaillais' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'Passé composé: "j\'ai travaillé". "Hier" indique le passé.'
  },
  {
    question_type: 'CONJUGATION',
    skill_category: 'GRAMMAR',
    difficulty_level: 'B1.1',
    category: 'work',
    subcategory: 'future',
    question_text: 'Demain, je _______ l\'hôtel',
    options: {
      type: 'conjugation',
      verb: 'nettoyer',
      tense: 'futur simple',
      subject: 'je',
      sentence: 'Demain, je _______ l\'hôtel',
      options: [
        { id: 'A', text: 'nettoie' },
        { id: 'B', text: 'nettoierai' },
        { id: 'C', text: 'vais nettoyer' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'Futur simple: "je nettoierai". Les deux réponses B et C sont correctes, mais le futur simple est demandé.'
  }
  // ... (4 more CONJUGATION questions)
];

// ========================================
// 8. MATCHING QUESTIONS (6) - A1.2-B1
// ========================================
const matchingQuestions = [
  {
    question_type: 'MATCHING',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A1.2',
    category: 'cleaning',
    subcategory: 'tools',
    question_text: 'Associez les mots aux images',
    options: {
      type: 'matching',
      pairs: [
        { id: '1', text: 'Balai', image: '/images/cleaning/broom.jpg', alt: 'Balai', audio_url: '/audio/vocabulary/broom.mp3' },
        { id: '2', text: 'Seau', image: '/images/cleaning/bucket.jpg', alt: 'Seau', audio_url: '/audio/vocabulary/bucket.mp3' },
        { id: '3', text: 'Éponge', image: '/images/cleaning/sponge.jpg', alt: 'Éponge', audio_url: '/audio/vocabulary/sponge.mp3' },
        { id: '4', text: 'Chiffon', image: '/images/cleaning/cloth.jpg', alt: 'Chiffon', audio_url: '/audio/vocabulary/cloth.mp3' }
      ]
    },
    correct_answer: { matches: ['1-1', '2-2', '3-3', '4-4'] },
    explanation_text: 'Bien joué! Vous connaissez les outils de nettoyage.'
  },
  {
    question_type: 'MATCHING',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A2.1',
    category: 'bedroom',
    subcategory: 'linens',
    question_text: 'Associez le linge de lit',
    options: {
      type: 'matching',
      pairs: [
        { id: '1', text: 'Drap', image: '/images/bedroom/sheet.jpg', alt: 'Drap' },
        { id: '2', text: 'Oreiller', image: '/images/bedroom/pillow.jpg', alt: 'Oreiller' },
        { id: '3', text: 'Couverture', image: '/images/bedroom/blanket.jpg', alt: 'Couverture' }
      ]
    },
    correct_answer: { matches: ['1-1', '2-2', '3-3'] },
    explanation_text: 'Parfait! C\'est le linge qu\'on change dans les chambres d\'hôtel.'
  }
  // ... (4 more MATCHING questions)
];

// ========================================
// 9. COLOR_DESCRIPTION QUESTIONS (6) - A1.1-A2
// ========================================
const colorDescriptionQuestions = [
  {
    question_type: 'COLOR_DESCRIPTION',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A1.1',
    category: 'colors',
    subcategory: 'basic',
    question_text: 'De quelle couleur est la serviette?',
    question_image_url: '/images/colors/white_towel.jpg',
    question_audio_url: '/audio/questions/what_color_towel.mp3',
    options: {
      type: 'color_choice',
      question: 'De quelle couleur est la serviette?',
      options: [
        { id: 'A', text: 'Blanc', color: '#FFFFFF', audio_url: '/audio/colors/white.mp3' },
        { id: 'B', text: 'Bleu', color: '#0000FF', audio_url: '/audio/colors/blue.mp3' },
        { id: 'C', text: 'Rouge', color: '#FF0000', audio_url: '/audio/colors/red.mp3' },
        { id: 'D', text: 'Vert', color: '#00FF00', audio_url: '/audio/colors/green.mp3' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'La serviette est blanche. Dans les hôtels, les serviettes sont souvent blanches.'
  },
  {
    question_type: 'COLOR_DESCRIPTION',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A1.2',
    category: 'colors',
    subcategory: 'objects',
    question_text: 'De quelle couleur est le seau?',
    question_image_url: '/images/colors/blue_bucket.jpg',
    options: {
      type: 'color_choice',
      options: [
        { id: 'A', text: 'Jaune', color: '#FFFF00' },
        { id: 'B', text: 'Bleu', color: '#0000FF' },
        { id: 'C', text: 'Rouge', color: '#FF0000' },
        { id: 'D', text: 'Vert', color: '#00FF00' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'Le seau est bleu.'
  },
  {
    question_type: 'COLOR_DESCRIPTION',
    skill_category: 'VOCABULARY',
    difficulty_level: 'A2.1',
    category: 'colors',
    subcategory: 'multiple',
    question_text: 'Combien de serviettes blanches voyez-vous?',
    question_image_url: '/images/colors/towel_stack.jpg',
    options: {
      type: 'color_choice',
      options: [
        { id: 'A', text: 'Deux', color: null },
        { id: 'B', text: 'Trois', color: null },
        { id: 'C', text: 'Quatre', color: null },
        { id: 'D', text: 'Cinq', color: null }
      ]
    },
    correct_answer: { id: 'C' },
    explanation_text: 'Il y a quatre serviettes blanches empilées.'
  }
  // ... (3 more COLOR_DESCRIPTION questions)
];

// ========================================
// 10. FILL_BLANK QUESTIONS (8) - A2-B2
// ========================================
const fillBlankQuestions = [
  {
    question_type: 'FILL_BLANK',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.1',
    category: 'bedroom',
    subcategory: 'location',
    question_text: 'Le lit est dans la _______',
    question_audio_url: '/audio/fill_blank/bed_in_room.mp3',
    options: {
      type: 'fill_blank',
      sentence: 'Le lit est dans la _______',
      blank_position: 5,
      options: [
        { id: 'A', text: 'chambre' },
        { id: 'B', text: 'cuisine' },
        { id: 'C', text: 'salle de bain' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'Le lit est dans la chambre. C\'est logique!'
  },
  {
    question_type: 'FILL_BLANK',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.1',
    category: 'cleaning',
    subcategory: 'actions',
    question_text: 'Je nettoie le sol avec un _______',
    options: {
      type: 'fill_blank',
      sentence: 'Je nettoie le sol avec un _______',
      blank_position: 6,
      options: [
        { id: 'A', text: 'balai' },
        { id: 'B', text: 'oreiller' },
        { id: 'C', text: 'drap' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: 'On nettoie le sol avec un balai.'
  },
  {
    question_type: 'FILL_BLANK',
    skill_category: 'GRAMMAR',
    difficulty_level: 'A2.2',
    category: 'work',
    subcategory: 'time',
    question_text: 'Je travaille _______ le matin _______ le soir',
    options: {
      type: 'fill_blank',
      sentence: 'Je travaille _______ le matin _______ le soir',
      options: [
        { id: 'A', text: 'de ... à' },
        { id: 'B', text: 'du ... au' },
        { id: 'C', text: 'depuis ... jusqu\'à' }
      ]
    },
    correct_answer: { id: 'B' },
    explanation_text: 'On dit "du matin au soir" (contraction de "de le" = "du")'
  },
  {
    question_type: 'FILL_BLANK',
    skill_category: 'GRAMMAR',
    difficulty_level: 'B1.1',
    category: 'work',
    subcategory: 'politeness',
    question_text: '_______ m\'excuser, où est la réserve?',
    options: {
      type: 'fill_blank',
      sentence: '_______ m\'excuser, où est la réserve?',
      options: [
        { id: 'A', text: 'Veuillez' },
        { id: 'B', text: 'S\'il vous plaît' },
        { id: 'C', text: 'Excusez-moi' }
      ]
    },
    correct_answer: { id: 'A' },
    explanation_text: '"Veuillez m\'excuser" est très poli et professionnel.'
  }
  // ... (4 more FILL_BLANK questions)
];

// ========================================
// SEED FUNCTION
// ========================================
async function seedUniversalQuizQuestions() {
  console.log('🌱 Starting Universal Quiz Questions seed...\n');

  // Combine all questions
  const allQuestions = [
    ...alphabetQuestions,
    ...audioToImageQuestions,
    ...textToImageQuestions,
    ...imageToTextQuestions,
    ...audioToTextQuestions,
    ...genderSelectionQuestions,
    ...conjugationQuestions,
    ...matchingQuestions,
    ...colorDescriptionQuestions,
    ...fillBlankQuestions
  ];

  console.log(`📊 Total questions to seed: ${allQuestions.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const questionData of allQuestions) {
    try {
      await prisma.universalQuizQuestion.create({
        data: questionData
      });
      successCount++;
      process.stdout.write(`✅ ${successCount}/${allQuestions.length}\r`);
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error creating question:`, error.message);
    }
  }

  console.log(`\n\n🎉 Seed completed!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\n📈 Breakdown by type:`);
  console.log(`   🔤 ALPHABET: ${alphabetQuestions.length}`);
  console.log(`   🎧 AUDIO_TO_IMAGE: ${audioToImageQuestions.length}`);
  console.log(`   📖 TEXT_TO_IMAGE: ${textToImageQuestions.length}`);
  console.log(`   🖼️  IMAGE_TO_TEXT: ${imageToTextQuestions.length}`);
  console.log(`   ✍️  AUDIO_TO_TEXT: ${audioToTextQuestions.length}`);
  console.log(`   ⚧️  GENDER_SELECTION: ${genderSelectionQuestions.length}`);
  console.log(`   📝 CONJUGATION: ${conjugationQuestions.length}`);
  console.log(`   🔗 MATCHING: ${matchingQuestions.length}`);
  console.log(`   🎨 COLOR_DESCRIPTION: ${colorDescriptionQuestions.length}`);
  console.log(`   📄 FILL_BLANK: ${fillBlankQuestions.length}`);
}

// Run if called directly
if (require.main === module) {
  seedUniversalQuizQuestions()
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedUniversalQuizQuestions };
