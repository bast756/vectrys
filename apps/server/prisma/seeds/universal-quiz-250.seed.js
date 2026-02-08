import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 🌱 SEED UNIVERSAL QUIZ QUESTIONS - 250 Questions
 *
 * Distribution complète pour tous niveaux CECRL (A1.0 → C2)
 * Thématique: Vocabulaire hôtelier/nettoyage + vie quotidienne
 *
 * Structure:
 * - 26 ALPHABET (A-Z)
 * - 40 AUDIO_TO_IMAGE
 * - 40 TEXT_TO_IMAGE
 * - 30 IMAGE_TO_TEXT
 * - 20 AUDIO_TO_TEXT (dictée)
 * - 20 GENDER_SELECTION
 * - 25 CONJUGATION
 * - 15 MATCHING
 * - 15 COLOR_DESCRIPTION
 * - 20 FILL_BLANK
 * = 251 TOTAL
 */

// ========================================
// HELPER: Generate alphabet questions (26)
// ========================================
function generateAlphabetQuestions() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return letters.map((letter, index) => {
    // Create 4 random options including the correct one
    const otherLetters = letters.filter(l => l !== letter);
    const options = [letter];

    for (let i = 0; i < 3; i++) {
      const randomLetter = otherLetters[Math.floor(Math.random() * otherLetters.length)];
      if (!options.includes(randomLetter)) {
        options.push(randomLetter);
      }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    return {
      question_type: 'ALPHABET',
      skill_category: 'ALPHABET',
      difficulty_level: 'A1.0',
      category: 'alphabet',
      subcategory: 'AEIOU'.includes(letter) ? 'vowels' : 'consonants',
      question_text: 'Quelle lettre entendez-vous?',
      question_audio_url: `/audio/alphabet/${letter.toLowerCase()}.mp3`,
      options: {
        type: 'alphabet_choice',
        sound: letter,
        options: options.map(opt => ({ id: opt, letter: opt }))
      },
      correct_answer: { id: letter },
      explanation_text: `La lettre ${letter} se prononce "${letter.toLowerCase()}"`,
      explanation_audio_url: `/audio/alphabet/${letter.toLowerCase()}_explanation.mp3`
    };
  });
}

// ========================================
// AUDIO_TO_IMAGE Questions (40)
// ========================================
const audioToImageData = [
  // Bedroom (10)
  { word: 'lit', category: 'bedroom', subcategory: 'furniture', level: 'A1.0', distractors: ['chaise', 'table', 'armoire'] },
  { word: 'oreiller', category: 'bedroom', subcategory: 'linens', level: 'A1.0', distractors: ['couverture', 'drap', 'matelas'] },
  { word: 'lampe', category: 'bedroom', subcategory: 'furniture', level: 'A1.0', distractors: ['bureau', 'chaise', 'table'] },
  { word: 'réveil', category: 'bedroom', subcategory: 'objects', level: 'A1.1', distractors: ['téléphone', 'ordinateur', 'lampe'] },
  { word: 'placard', category: 'bedroom', subcategory: 'furniture', level: 'A1.1', distractors: ['armoire', 'commode', 'étagère'] },
  { word: 'rideau', category: 'bedroom', subcategory: 'decoration', level: 'A1.1', distractors: ['volet', 'fenêtre', 'porte'] },
  { word: 'matelas', category: 'bedroom', subcategory: 'furniture', level: 'A1.2', distractors: ['oreiller', 'drap', 'couverture'] },
  { word: 'couette', category: 'bedroom', subcategory: 'linens', level: 'A1.2', distractors: ['couverture', 'drap', 'oreiller'] },
  { word: 'table de nuit', category: 'bedroom', subcategory: 'furniture', level: 'A1.2', distractors: ['table', 'bureau', 'étagère'] },
  { word: 'housse', category: 'bedroom', subcategory: 'linens', level: 'A2.1', distractors: ['drap', 'oreiller', 'couette'] },

  // Bathroom (10)
  { word: 'savon', category: 'bathroom', subcategory: 'products', level: 'A1.0', distractors: ['shampooing', 'dentifrice', 'gel douche'] },
  { word: 'serviette', category: 'bathroom', subcategory: 'linens', level: 'A1.0', distractors: ['peignoir', 'tapis', 'gant'] },
  { word: 'brosse à dents', category: 'bathroom', subcategory: 'objects', level: 'A1.1', distractors: ['peigne', 'brosse', 'rasoir'] },
  { word: 'miroir', category: 'bathroom', subcategory: 'fixtures', level: 'A1.1', distractors: ['lavabo', 'douche', 'baignoire'] },
  { word: 'peignoir', category: 'bathroom', subcategory: 'linens', level: 'A1.2', distractors: ['serviette', 'pyjama', 'robe'] },
  { word: 'papier toilette', category: 'bathroom', subcategory: 'supplies', level: 'A1.0', distractors: ['mouchoir', 'serviette', 'essuie-tout'] },
  { word: 'gel douche', category: 'bathroom', subcategory: 'products', level: 'A1.2', distractors: ['shampooing', 'savon', 'lotion'] },
  { word: 'sèche-cheveux', category: 'bathroom', subcategory: 'appliances', level: 'A2.1', distractors: ['fer à lisser', 'rasoir', 'brosse'] },
  { word: 'tapis de bain', category: 'bathroom', subcategory: 'linens', level: 'A2.1', distractors: ['serviette', 'peignoir', 'gant'] },
  { word: 'distributeur', category: 'bathroom', subcategory: 'fixtures', level: 'A2.2', distractors: ['porte-savon', 'crochet', 'étagère'] },

  // Cleaning tools (10)
  { word: 'balai', category: 'cleaning', subcategory: 'tools', level: 'A1.0', distractors: ['serpillière', 'aspirateur', 'plumeau'] },
  { word: 'seau', category: 'cleaning', subcategory: 'tools', level: 'A1.0', distractors: ['bassine', 'poubelle', 'panier'] },
  { word: 'éponge', category: 'cleaning', subcategory: 'supplies', level: 'A1.1', distractors: ['chiffon', 'lavette', 'brosse'] },
  { word: 'chiffon', category: 'cleaning', subcategory: 'supplies', level: 'A1.1', distractors: ['éponge', 'torchon', 'lavette'] },
  { word: 'aspirateur', category: 'cleaning', subcategory: 'appliances', level: 'A1.2', distractors: ['balai', 'serpillière', 'plumeau'] },
  { word: 'serpillière', category: 'cleaning', subcategory: 'tools', level: 'A1.2', distractors: ['balai', 'chiffon', 'éponge'] },
  { word: 'gants', category: 'cleaning', subcategory: 'protection', level: 'A1.2', distractors: ['tablier', 'masque', 'lunettes'] },
  { word: 'spray', category: 'cleaning', subcategory: 'products', level: 'A2.1', distractors: ['produit', 'savon', 'détergent'] },
  { word: 'plumeau', category: 'cleaning', subcategory: 'tools', level: 'A2.1', distractors: ['balai', 'chiffon', 'brosse'] },
  { word: 'chariot', category: 'cleaning', subcategory: 'equipment', level: 'A2.2', distractors: ['panier', 'seau', 'boîte'] },

  // Kitchen/Dining (5)
  { word: 'verre', category: 'kitchen', subcategory: 'dishes', level: 'A1.0', distractors: ['tasse', 'assiette', 'bol'] },
  { word: 'assiette', category: 'kitchen', subcategory: 'dishes', level: 'A1.0', distractors: ['bol', 'plat', 'verre'] },
  { word: 'fourchette', category: 'kitchen', subcategory: 'cutlery', level: 'A1.1', distractors: ['couteau', 'cuillère', 'cuillère à café'] },
  { word: 'couteau', category: 'kitchen', subcategory: 'cutlery', level: 'A1.1', distractors: ['fourchette', 'cuillère', 'spatule'] },
  { word: 'plateau', category: 'kitchen', subcategory: 'service', level: 'A2.1', distractors: ['plat', 'assiette', 'plateau de service'] },

  // Colors (5)
  { word: 'blanc', category: 'colors', subcategory: 'basic', level: 'A1.0', distractors: ['noir', 'bleu', 'rouge'] },
  { word: 'bleu', category: 'colors', subcategory: 'basic', level: 'A1.0', distractors: ['rouge', 'vert', 'jaune'] },
  { word: 'rouge', category: 'colors', subcategory: 'basic', level: 'A1.0', distractors: ['bleu', 'vert', 'orange'] },
  { word: 'vert', category: 'colors', subcategory: 'basic', level: 'A1.0', distractors: ['bleu', 'jaune', 'rouge'] },
  { word: 'jaune', category: 'colors', subcategory: 'basic', level: 'A1.0', distractors: ['orange', 'vert', 'rouge'] }
];

const audioToImageQuestions = audioToImageData.map((item, index) => ({
  question_type: 'AUDIO_TO_IMAGE',
  skill_category: 'LISTENING',
  difficulty_level: item.level,
  category: item.category,
  subcategory: item.subcategory,
  question_text: null,
  question_audio_url: `/audio/vocabulary/${item.word.replace(/ /g, '_')}.mp3`,
  question_image_url: null,
  options: {
    type: 'image_choice',
    options: [
      { id: 'A', image: `/images/${item.category}/${item.word.replace(/ /g, '_')}.jpg`, alt: item.word },
      ...item.distractors.map((dist, i) => ({
        id: String.fromCharCode(66 + i), // B, C, D
        image: `/images/${item.category}/${dist.replace(/ /g, '_')}.jpg`,
        alt: dist
      }))
    ]
  },
  correct_answer: { id: 'A' },
  explanation_text: `C'est ${item.word.startsWith('a') || item.word.startsWith('e') || item.word.startsWith('i') || item.word.startsWith('o') || item.word.startsWith('u') ? "l'" : item.word.endsWith('e') ? 'la ' : 'le '}${item.word}`,
  explanation_audio_url: `/audio/explanations/${item.word.replace(/ /g, '_')}.mp3`
}));

// ========================================
// TEXT_TO_IMAGE Questions (40) - Same as AUDIO_TO_IMAGE but with text
// ========================================
const textToImageQuestions = audioToImageData.map((item, index) => ({
  question_type: 'TEXT_TO_IMAGE',
  skill_category: 'READING',
  difficulty_level: item.level === 'A1.0' ? 'A1.1' : item.level, // Bump level slightly
  category: item.category,
  subcategory: item.subcategory,
  question_text: item.word.charAt(0).toUpperCase() + item.word.slice(1),
  question_audio_url: `/audio/vocabulary/${item.word.replace(/ /g, '_')}.mp3`, // Helper
  options: {
    type: 'image_choice',
    options: [
      { id: 'A', image: `/images/${item.category}/${item.word.replace(/ /g, '_')}.jpg`, alt: item.word },
      ...item.distractors.map((dist, i) => ({
        id: String.fromCharCode(66 + i),
        image: `/images/${item.category}/${dist.replace(/ /g, '_')}.jpg`,
        alt: dist
      }))
    ]
  },
  correct_answer: { id: 'A' },
  explanation_text: `C'est ${item.word.startsWith('a') || item.word.startsWith('e') || item.word.startsWith('i') || item.word.startsWith('o') || item.word.startsWith('u') ? "l'" : item.word.endsWith('e') ? 'la ' : 'le '}${item.word}`
}));

// ========================================
// IMAGE_TO_TEXT Questions (30)
// ========================================
const imageToTextData = audioToImageData.slice(0, 30); // Reuse first 30
const imageToTextQuestions = imageToTextData.map((item, index) => ({
  question_type: 'IMAGE_TO_TEXT',
  skill_category: 'VOCABULARY',
  difficulty_level: item.level === 'A1.0' ? 'A1.2' : item.level >= 'A2' ? item.level : 'A2.1',
  category: item.category,
  subcategory: item.subcategory,
  question_text: 'Qu\'est-ce que c\'est?',
  question_image_url: `/images/${item.category}/${item.word.replace(/ /g, '_')}.jpg`,
  question_audio_url: '/audio/questions/what_is_this.mp3',
  options: {
    type: 'multiple_choice',
    options: [
      { id: 'B', text: item.word.charAt(0).toUpperCase() + item.word.slice(1) },
      ...item.distractors.map((dist, i) => ({
        id: i === 0 ? 'A' : String.fromCharCode(67 + i - 1), // Shuffle
        text: dist.charAt(0).toUpperCase() + dist.slice(1)
      }))
    ].sort(() => Math.random() - 0.5)
  },
  correct_answer: { id: 'B' },
  explanation_text: `C'est ${item.word.startsWith('a') || item.word.startsWith('e') || item.word.startsWith('i') || item.word.startsWith('o') || item.word.startsWith('u') ? "l'" : item.word.endsWith('e') ? 'la ' : 'le '}${item.word}.`
}));

// Fix correct_answer to match shuffled options
imageToTextQuestions.forEach(q => {
  const correctOption = q.options.options.find(opt =>
    opt.text.toLowerCase() === imageToTextData[imageToTextQuestions.indexOf(q)].word
  );
  q.correct_answer = { id: correctOption?.id || 'A' };
});

// ========================================
// AUDIO_TO_TEXT Questions (20) - Dictée
// ========================================
const dictationSentences = [
  // A2.1 (5)
  { sentence: 'Je nettoie la chambre', level: 'A2.1', category: 'work', subcategory: 'tasks' },
  { sentence: 'Je change les draps', level: 'A2.1', category: 'work', subcategory: 'tasks' },
  { sentence: 'Le lit est propre', level: 'A2.1', category: 'bedroom', subcategory: 'state' },
  { sentence: 'La serviette est blanche', level: 'A2.1', category: 'bathroom', subcategory: 'description' },
  { sentence: 'Je travaille le matin', level: 'A2.1', category: 'work', subcategory: 'schedule' },

  // A2.2 (5)
  { sentence: 'Je nettoie la salle de bain', level: 'A2.2', category: 'bathroom', subcategory: 'tasks' },
  { sentence: 'Les chambres sont prêtes', level: 'A2.2', category: 'bedroom', subcategory: 'state' },
  { sentence: 'Je passe l\'aspirateur tous les jours', level: 'A2.2', category: 'cleaning', subcategory: 'routine' },
  { sentence: 'Il faut changer les serviettes', level: 'A2.2', category: 'bathroom', subcategory: 'tasks' },
  { sentence: 'Je commence à huit heures', level: 'A2.2', category: 'work', subcategory: 'schedule' },

  // B1.1 (5)
  { sentence: 'J\'ai nettoyé toutes les chambres', level: 'B1.1', category: 'work', subcategory: 'past' },
  { sentence: 'Il faudra commander des produits', level: 'B1.1', category: 'cleaning', subcategory: 'supplies' },
  { sentence: 'Je vérifie toujours la propreté', level: 'B1.1', category: 'work', subcategory: 'quality' },
  { sentence: 'Les clients arrivent à midi', level: 'B1.1', category: 'hotel', subcategory: 'schedule' },
  { sentence: 'Je dois remplir le chariot', level: 'B1.1', category: 'cleaning', subcategory: 'preparation' },

  // B1.2 (5)
  { sentence: 'Pourriez-vous m\'aider avec le linge?', level: 'B1.2', category: 'work', subcategory: 'communication' },
  { sentence: 'J\'aimerais prendre ma pause maintenant', level: 'B1.2', category: 'work', subcategory: 'break' },
  { sentence: 'Il manque des produits dans le chariot', level: 'B1.2', category: 'cleaning', subcategory: 'problem' },
  { sentence: 'La machine à laver est en panne', level: 'B1.2', category: 'equipment', subcategory: 'problem' },
  { sentence: 'Je préfère travailler l\'après-midi', level: 'B1.2', category: 'work', subcategory: 'preference' }
];

const audioToTextQuestions = dictationSentences.map((item, index) => ({
  question_type: 'AUDIO_TO_TEXT',
  skill_category: 'WRITING',
  difficulty_level: item.level,
  category: item.category,
  subcategory: item.subcategory,
  question_text: 'Écoutez et écrivez la phrase',
  question_audio_url: `/audio/dictation/${index + 1}_${item.sentence.replace(/ /g, '_').substring(0, 20)}.mp3`,
  options: {
    type: 'free_text',
    expected_answer: item.sentence,
    accepted_answers: [
      item.sentence,
      item.sentence.toLowerCase(),
      item.sentence + '.',
      item.sentence.toLowerCase() + '.'
    ],
    fuzzy_match: true,
    min_similarity: 0.8
  },
  correct_answer: { text: item.sentence },
  explanation_text: `La phrase correcte est: "${item.sentence}"`
}));

// ========================================
// GENDER_SELECTION Questions (20)
// ========================================
const genderWords = [
  // Masculin (10)
  { word: 'lit', gender: 'M', level: 'A1.2', category: 'bedroom' },
  { word: 'aspirateur', gender: 'M', level: 'A1.2', category: 'cleaning' },
  { word: 'balai', gender: 'M', level: 'A1.2', category: 'cleaning' },
  { word: 'verre', gender: 'M', level: 'A1.2', category: 'kitchen' },
  { word: 'seau', gender: 'M', level: 'A2.1', category: 'cleaning' },
  { word: 'plateau', gender: 'M', level: 'A2.1', category: 'kitchen' },
  { word: 'peignoir', gender: 'M', level: 'A2.1', category: 'bathroom' },
  { word: 'rideau', gender: 'M', level: 'A2.1', category: 'bedroom' },
  { word: 'savon', gender: 'M', level: 'A1.2', category: 'bathroom' },
  { word: 'matelas', gender: 'M', level: 'A2.2', category: 'bedroom' },

  // Féminin (10)
  { word: 'chambre', gender: 'F', level: 'A1.2', category: 'bedroom' },
  { word: 'serviette', gender: 'F', level: 'A1.2', category: 'bathroom' },
  { word: 'éponge', gender: 'F', level: 'A1.2', category: 'cleaning' },
  { word: 'table', gender: 'F', level: 'A1.2', category: 'furniture' },
  { word: 'chaise', gender: 'F', level: 'A1.2', category: 'furniture' },
  { word: 'serpillière', gender: 'F', level: 'A2.1', category: 'cleaning' },
  { word: 'lampe', gender: 'F', level: 'A2.1', category: 'bedroom' },
  { word: 'brosse', gender: 'F', level: 'A2.1', category: 'cleaning' },
  { word: 'couverture', gender: 'F', level: 'A2.2', category: 'bedroom' },
  { word: 'armoire', gender: 'F', level: 'A2.2', category: 'furniture' }
];

const genderSelectionQuestions = genderWords.map((item, index) => ({
  question_type: 'GENDER_SELECTION',
  skill_category: 'GRAMMAR',
  difficulty_level: item.level,
  category: item.category,
  subcategory: 'gender',
  question_text: item.word,
  question_audio_url: `/audio/vocabulary/${item.word.replace(/ /g, '_')}.mp3`,
  options: {
    type: 'gender_choice',
    word: item.word,
    options: [
      { id: 'M', text: 'Le / Un', label: 'Masculin', color: 'blue' },
      { id: 'F', text: 'La / Une', label: 'Féminin', color: 'pink' }
    ]
  },
  correct_answer: { id: item.gender },
  explanation_text: `On dit "${item.gender === 'M' ? 'LE' : 'LA'} ${item.word}" (${item.gender === 'M' ? 'masculin' : 'féminin'}).`
}));

// ========================================
// CONJUGATION Questions (25)
// ========================================
const conjugationData = [
  // Présent (10)
  { verb: 'nettoyer', tense: 'présent', subject: 'je', sentence: 'Je _______ la chambre', answer: 'nettoie', distractors: ['nettoies', 'nettoyons'], level: 'A2.1' },
  { verb: 'changer', tense: 'présent', subject: 'vous', sentence: 'Vous _______ les draps', answer: 'changez', distractors: ['change', 'changes'], level: 'A2.1' },
  { verb: 'être', tense: 'présent', subject: 'il', sentence: 'Le lit _______ propre', answer: 'est', distractors: ['es', 'sont'], level: 'A2.1' },
  { verb: 'avoir', tense: 'présent', subject: 'je', sentence: 'J\'_______ beaucoup de travail', answer: 'ai', distractors: ['as', 'a'], level: 'A2.1' },
  { verb: 'faire', tense: 'présent', subject: 'nous', sentence: 'Nous _______ les lits', answer: 'faisons', distractors: ['fait', 'faites'], level: 'A2.2' },
  { verb: 'passer', tense: 'présent', subject: 'je', sentence: 'Je _______ l\'aspirateur', answer: 'passe', distractors: ['passes', 'passons'], level: 'A2.1' },
  { verb: 'travailler', tense: 'présent', subject: 'elle', sentence: 'Elle _______ le matin', answer: 'travaille', distractors: ['travailles', 'travaillent'], level: 'A2.1' },
  { verb: 'commencer', tense: 'présent', subject: 'je', sentence: 'Je _______ à 8 heures', answer: 'commence', distractors: ['commences', 'commençons'], level: 'A2.2' },
  { verb: 'finir', tense: 'présent', subject: 'nous', sentence: 'Nous _______ à midi', answer: 'finissons', distractors: ['finis', 'finit'], level: 'A2.2' },
  { verb: 'ranger', tense: 'présent', subject: 'tu', sentence: 'Tu _______ le chariot', answer: 'ranges', distractors: ['range', 'rangez'], level: 'A2.2' },

  // Passé composé (8)
  { verb: 'nettoyer', tense: 'passé composé', subject: 'je', sentence: 'Hier, j\'_______ toutes les chambres', answer: 'ai nettoyé', distractors: ['nettoie', 'nettoyais'], level: 'A2.2' },
  { verb: 'travailler', tense: 'passé composé', subject: 'je', sentence: 'Hier, je _______ toute la journée', answer: 'ai travaillé', distractors: ['travaille', 'travaillais'], level: 'A2.2' },
  { verb: 'changer', tense: 'passé composé', subject: 'nous', sentence: 'Nous _______ tous les draps', answer: 'avons changé', distractors: ['changeons', 'changions'], level: 'B1.1' },
  { verb: 'finir', tense: 'passé composé', subject: 'elle', sentence: 'Elle _______ son travail', answer: 'a fini', distractors: ['finit', 'finissait'], level: 'B1.1' },
  { verb: 'passer', tense: 'passé composé', subject: 'ils', sentence: 'Ils _______ l\'aspirateur', answer: 'ont passé', distractors: ['passent', 'passaient'], level: 'B1.1' },
  { verb: 'faire', tense: 'passé composé', subject: 'je', sentence: 'J\'_______ les lits', answer: 'ai fait', distractors: ['fais', 'faisais'], level: 'B1.1' },
  { verb: 'arriver', tense: 'passé composé', subject: 'je', sentence: 'Je _______ en avance', answer: 'suis arrivé(e)', distractors: ['arrive', 'arrivais'], level: 'B1.2' },
  { verb: 'partir', tense: 'passé composé', subject: 'elle', sentence: 'Elle _______ tôt', answer: 'est partie', distractors: ['part', 'partait'], level: 'B1.2' },

  // Futur (7)
  { verb: 'nettoyer', tense: 'futur simple', subject: 'je', sentence: 'Demain, je _______ la chambre', answer: 'nettoierai', distractors: ['nettoie', 'nettoyais'], level: 'B1.1' },
  { verb: 'travailler', tense: 'futur simple', subject: 'nous', sentence: 'Demain, nous _______ ensemble', answer: 'travaillerons', distractors: ['travaillons', 'travaillerons'], level: 'B1.1' },
  { verb: 'être', tense: 'futur simple', subject: 'il', sentence: 'Il _______ là demain', answer: 'sera', distractors: ['est', 'était'], level: 'B1.1' },
  { verb: 'avoir', tense: 'futur simple', subject: 'vous', sentence: 'Vous _______ du temps', answer: 'aurez', distractors: ['avez', 'aviez'], level: 'B1.2' },
  { verb: 'faire', tense: 'futur simple', subject: 'je', sentence: 'Je _______ de mon mieux', answer: 'ferai', distractors: ['fais', 'faisais'], level: 'B1.2' },
  { verb: 'pouvoir', tense: 'futur simple', subject: 'tu', sentence: 'Tu _______ venir?', answer: 'pourras', distractors: ['peux', 'pouvais'], level: 'B1.2' },
  { verb: 'devoir', tense: 'futur simple', subject: 'je', sentence: 'Je _______ finir avant midi', answer: 'devrai', distractors: ['dois', 'devais'], level: 'B2.1' }
];

const conjugationQuestions = conjugationData.map((item, index) => ({
  question_type: 'CONJUGATION',
  skill_category: 'GRAMMAR',
  difficulty_level: item.level,
  category: 'grammar',
  subcategory: 'verbs',
  question_text: item.sentence,
  question_audio_url: `/audio/conjugation/${index + 1}.mp3`,
  options: {
    type: 'conjugation',
    verb: item.verb,
    tense: item.tense,
    subject: item.subject,
    sentence: item.sentence,
    options: [
      { id: 'A', text: item.answer },
      ...item.distractors.map((dist, i) => ({
        id: String.fromCharCode(66 + i),
        text: dist
      }))
    ]
  },
  correct_answer: { id: 'A' },
  explanation_text: `Au ${item.tense}, "${item.subject}" + ${item.verb} = "${item.subject} ${item.answer}"`
}));

// ========================================
// MATCHING Questions (15)
// ========================================
const matchingData = [
  // Cleaning tools (3)
  {
    title: 'Outils de nettoyage basiques',
    level: 'A1.2',
    category: 'cleaning',
    pairs: [
      { id: '1', text: 'Balai', image: '/images/cleaning/broom.jpg' },
      { id: '2', text: 'Seau', image: '/images/cleaning/bucket.jpg' },
      { id: '3', text: 'Éponge', image: '/images/cleaning/sponge.jpg' }
    ]
  },
  {
    title: 'Outils de nettoyage avancés',
    level: 'A2.1',
    category: 'cleaning',
    pairs: [
      { id: '1', text: 'Aspirateur', image: '/images/cleaning/vacuum.jpg' },
      { id: '2', text: 'Serpillière', image: '/images/cleaning/mop.jpg' },
      { id: '3', text: 'Chiffon', image: '/images/cleaning/cloth.jpg' },
      { id: '4', text: 'Spray', image: '/images/cleaning/spray.jpg' }
    ]
  },
  {
    title: 'Produits de nettoyage',
    level: 'A2.2',
    category: 'cleaning',
    pairs: [
      { id: '1', text: 'Savon', image: '/images/cleaning/soap.jpg' },
      { id: '2', text: 'Détergent', image: '/images/cleaning/detergent.jpg' },
      { id: '3', text: 'Javel', image: '/images/cleaning/bleach.jpg' }
    ]
  },

  // Bedroom linens (3)
  {
    title: 'Linge de lit',
    level: 'A2.1',
    category: 'bedroom',
    pairs: [
      { id: '1', text: 'Drap', image: '/images/bedroom/sheet.jpg' },
      { id: '2', text: 'Oreiller', image: '/images/bedroom/pillow.jpg' },
      { id: '3', text: 'Couverture', image: '/images/bedroom/blanket.jpg' }
    ]
  },
  {
    title: 'Meubles de chambre',
    level: 'A2.1',
    category: 'bedroom',
    pairs: [
      { id: '1', text: 'Lit', image: '/images/bedroom/bed.jpg' },
      { id: '2', text: 'Table de nuit', image: '/images/bedroom/nightstand.jpg' },
      { id: '3', text: 'Armoire', image: '/images/bedroom/closet.jpg' },
      { id: '4', text: 'Lampe', image: '/images/bedroom/lamp.jpg' }
    ]
  },
  {
    title: 'Éléments de décoration',
    level: 'B1.1',
    category: 'bedroom',
    pairs: [
      { id: '1', text: 'Rideau', image: '/images/bedroom/curtain.jpg' },
      { id: '2', text: 'Tableau', image: '/images/bedroom/painting.jpg' },
      { id: '3', text: 'Tapis', image: '/images/bedroom/rug.jpg' }
    ]
  },

  // Bathroom items (3)
  {
    title: 'Articles de salle de bain',
    level: 'A1.2',
    category: 'bathroom',
    pairs: [
      { id: '1', text: 'Savon', image: '/images/bathroom/soap.jpg' },
      { id: '2', text: 'Serviette', image: '/images/bathroom/towel.jpg' },
      { id: '3', text: 'Shampooing', image: '/images/bathroom/shampoo.jpg' }
    ]
  },
  {
    title: 'Équipements de salle de bain',
    level: 'A2.2',
    category: 'bathroom',
    pairs: [
      { id: '1', text: 'Miroir', image: '/images/bathroom/mirror.jpg' },
      { id: '2', text: 'Sèche-cheveux', image: '/images/bathroom/hairdryer.jpg' },
      { id: '3', text: 'Distributeur', image: '/images/bathroom/dispenser.jpg' },
      { id: '4', text: 'Peignoir', image: '/images/bathroom/bathrobe.jpg' }
    ]
  },
  {
    title: 'Produits d\'hygiène',
    level: 'B1.1',
    category: 'bathroom',
    pairs: [
      { id: '1', text: 'Gel douche', image: '/images/bathroom/shower_gel.jpg' },
      { id: '2', text: 'Lotion', image: '/images/bathroom/lotion.jpg' },
      { id: '3', text: 'Dentifrice', image: '/images/bathroom/toothpaste.jpg' }
    ]
  },

  // Kitchen/dining (3)
  {
    title: 'Vaisselle',
    level: 'A1.2',
    category: 'kitchen',
    pairs: [
      { id: '1', text: 'Assiette', image: '/images/kitchen/plate.jpg' },
      { id: '2', text: 'Verre', image: '/images/kitchen/glass.jpg' },
      { id: '3', text: 'Tasse', image: '/images/kitchen/cup.jpg' }
    ]
  },
  {
    title: 'Couverts',
    level: 'A2.1',
    category: 'kitchen',
    pairs: [
      { id: '1', text: 'Fourchette', image: '/images/kitchen/fork.jpg' },
      { id: '2', text: 'Couteau', image: '/images/kitchen/knife.jpg' },
      { id: '3', text: 'Cuillère', image: '/images/kitchen/spoon.jpg' }
    ]
  },
  {
    title: 'Service de table',
    level: 'A2.2',
    category: 'kitchen',
    pairs: [
      { id: '1', text: 'Plateau', image: '/images/kitchen/tray.jpg' },
      { id: '2', text: 'Carafe', image: '/images/kitchen/carafe.jpg' },
      { id: '3', text: 'Plat', image: '/images/kitchen/dish.jpg' },
      { id: '4', text: 'Bol', image: '/images/kitchen/bowl.jpg' }
    ]
  },

  // Colors (3)
  {
    title: 'Couleurs basiques',
    level: 'A1.1',
    category: 'colors',
    pairs: [
      { id: '1', text: 'Rouge', image: '/images/colors/red.jpg' },
      { id: '2', text: 'Bleu', image: '/images/colors/blue.jpg' },
      { id: '3', text: 'Jaune', image: '/images/colors/yellow.jpg' }
    ]
  },
  {
    title: 'Couleurs secondaires',
    level: 'A1.2',
    category: 'colors',
    pairs: [
      { id: '1', text: 'Vert', image: '/images/colors/green.jpg' },
      { id: '2', text: 'Orange', image: '/images/colors/orange.jpg' },
      { id: '3', text: 'Violet', image: '/images/colors/purple.jpg' }
    ]
  },
  {
    title: 'Couleurs neutres',
    level: 'A2.1',
    category: 'colors',
    pairs: [
      { id: '1', text: 'Blanc', image: '/images/colors/white.jpg' },
      { id: '2', text: 'Noir', image: '/images/colors/black.jpg' },
      { id: '3', text: 'Gris', image: '/images/colors/gray.jpg' }
    ]
  }
];

const matchingQuestions = matchingData.map((item, index) => ({
  question_type: 'MATCHING',
  skill_category: 'VOCABULARY',
  difficulty_level: item.level,
  category: item.category,
  subcategory: 'association',
  question_text: `Associez: ${item.title}`,
  options: {
    type: 'matching',
    pairs: item.pairs.map(pair => ({
      ...pair,
      audio_url: `/audio/vocabulary/${pair.text.toLowerCase().replace(/ /g, '_')}.mp3`
    }))
  },
  correct_answer: {
    matches: item.pairs.map(pair => `${pair.id}-${pair.id}`)
  },
  explanation_text: `Bien joué! Vous maîtrisez ${item.title.toLowerCase()}.`
}));

// ========================================
// COLOR_DESCRIPTION Questions (15)
// ========================================
const colorDescriptionData = [
  { object: 'serviette', color: 'blanc', level: 'A1.1', category: 'bathroom', distractors: ['bleu', 'rouge', 'vert'] },
  { object: 'seau', color: 'bleu', level: 'A1.2', category: 'cleaning', distractors: ['rouge', 'jaune', 'vert'] },
  { object: 'drap', color: 'blanc', level: 'A1.2', category: 'bedroom', distractors: ['bleu', 'rose', 'beige'] },
  { object: 'gants', color: 'jaune', level: 'A2.1', category: 'cleaning', distractors: ['bleu', 'rouge', 'vert'] },
  { object: 'couverture', color: 'rouge', level: 'A2.1', category: 'bedroom', distractors: ['bleu', 'vert', 'marron'] },
  { object: 'rideau', color: 'beige', level: 'A2.1', category: 'bedroom', distractors: ['blanc', 'gris', 'marron'] },
  { object: 'chariot', color: 'gris', level: 'A2.2', category: 'cleaning', distractors: ['noir', 'blanc', 'bleu'] },
  { object: 'oreiller', color: 'blanc', level: 'A1.2', category: 'bedroom', distractors: ['beige', 'rose', 'bleu'] },
  { object: 'tapis de bain', color: 'bleu', level: 'A2.1', category: 'bathroom', distractors: ['blanc', 'vert', 'rose'] },
  { object: 'peignoir', color: 'blanc', level: 'A2.2', category: 'bathroom', distractors: ['bleu', 'rose', 'beige'] },
  { object: 'plumeau', color: 'jaune', level: 'A2.2', category: 'cleaning', distractors: ['rouge', 'bleu', 'vert'] },
  { object: 'spray', color: 'vert', level: 'A2.2', category: 'cleaning', distractors: ['bleu', 'rouge', 'jaune'] },
  { object: 'coussins', color: 'rouge', level: 'A2.1', category: 'bedroom', distractors: ['bleu', 'vert', 'jaune'] },
  { object: 'tablier', color: 'bleu', level: 'A2.2', category: 'cleaning', distractors: ['blanc', 'vert', 'gris'] },
  { object: 'housse', color: 'beige', level: 'A2.1', category: 'bedroom', distractors: ['blanc', 'gris', 'marron'] }
];

const colorMap = {
  'blanc': '#FFFFFF',
  'bleu': '#0000FF',
  'rouge': '#FF0000',
  'vert': '#00FF00',
  'jaune': '#FFFF00',
  'gris': '#808080',
  'noir': '#000000',
  'beige': '#F5F5DC',
  'rose': '#FFC0CB',
  'marron': '#8B4513',
  'orange': '#FFA500',
  'violet': '#8B00FF'
};

const colorDescriptionQuestions = colorDescriptionData.map((item, index) => ({
  question_type: 'COLOR_DESCRIPTION',
  skill_category: 'VOCABULARY',
  difficulty_level: item.level,
  category: item.category,
  subcategory: 'colors',
  question_text: `De quelle couleur est ${item.object.startsWith('a') || item.object.startsWith('e') || item.object.startsWith('i') || item.object.startsWith('o') || item.object.startsWith('u') ? "l'" : item.object.endsWith('s') ? 'les ' : item.object.endsWith('e') ? 'la ' : 'le '}${item.object}?`,
  question_image_url: `/images/${item.category}/${item.color}_${item.object.replace(/ /g, '_')}.jpg`,
  question_audio_url: `/audio/questions/what_color_${item.object.replace(/ /g, '_')}.mp3`,
  options: {
    type: 'color_choice',
    options: [
      { id: 'A', text: item.color.charAt(0).toUpperCase() + item.color.slice(1), color: colorMap[item.color], audio_url: `/audio/colors/${item.color}.mp3` },
      ...item.distractors.map((dist, i) => ({
        id: String.fromCharCode(66 + i),
        text: dist.charAt(0).toUpperCase() + dist.slice(1),
        color: colorMap[dist],
        audio_url: `/audio/colors/${dist}.mp3`
      }))
    ]
  },
  correct_answer: { id: 'A', color: colorMap[item.color] },
  explanation_text: `${item.object.charAt(0).toUpperCase() + item.object.slice(1)} est ${item.color}.`
}));

// ========================================
// FILL_BLANK Questions (20)
// ========================================
const fillBlankData = [
  // Location (5)
  { sentence: 'Le lit est dans la _______', answer: 'chambre', distractors: ['cuisine', 'salle de bain'], level: 'A2.1', category: 'bedroom' },
  { sentence: 'Le savon est dans la _______', answer: 'salle de bain', distractors: ['chambre', 'cuisine'], level: 'A2.1', category: 'bathroom' },
  { sentence: 'L\'aspirateur est dans la _______', answer: 'réserve', distractors: ['chambre', 'cuisine'], level: 'A2.2', category: 'cleaning' },
  { sentence: 'Les serviettes sont dans _______', answer: 'l\'armoire', distractors: ['le lit', 'la douche'], level: 'A2.2', category: 'bathroom' },
  { sentence: 'Le chariot est dans _______', answer: 'le couloir', distractors: ['la chambre', 'la salle de bain'], level: 'A2.2', category: 'cleaning' },

  // Actions (5)
  { sentence: 'Je nettoie le sol avec un _______', answer: 'balai', distractors: ['oreiller', 'drap'], level: 'A2.1', category: 'cleaning' },
  { sentence: 'Je change les _______ tous les jours', answer: 'draps', distractors: ['oreillers', 'rideaux'], level: 'A2.1', category: 'bedroom' },
  { sentence: 'Je passe _______ dans les couloirs', answer: 'l\'aspirateur', distractors: ['le balai', 'la serpillière'], level: 'A2.2', category: 'cleaning' },
  { sentence: 'Je remplis le _______ de produits', answer: 'chariot', distractors: ['seau', 'placard'], level: 'A2.2', category: 'cleaning' },
  { sentence: 'Je mets du _______ dans le distributeur', answer: 'savon', distractors: ['shampooing', 'gel douche'], level: 'A2.1', category: 'bathroom' },

  // Time expressions (5)
  { sentence: 'Je travaille _______ le matin _______ le soir', answer: 'du ... au', distractors: ['de ... à', 'depuis ... jusqu\'à'], level: 'A2.2', category: 'work' },
  { sentence: 'Je commence _______ 8 heures', answer: 'à', distractors: ['de', 'en'], level: 'A2.1', category: 'work' },
  { sentence: 'Je finis _______ midi', answer: 'à', distractors: ['de', 'en'], level: 'A2.1', category: 'work' },
  { sentence: 'Je travaille _______ lundi _______ vendredi', answer: 'du ... au', distractors: ['de ... à', 'le ... au'], level: 'A2.2', category: 'work' },
  { sentence: 'Je prends ma pause _______ 10 heures', answer: 'à', distractors: ['de', 'vers'], level: 'A2.1', category: 'work' },

  // Politeness/Communication (5)
  { sentence: '_______ m\'excuser, où est la réserve?', answer: 'Veuillez', distractors: ['S\'il vous plaît', 'Excusez-moi'], level: 'B1.1', category: 'communication' },
  { sentence: '_______ vous donner un coup de main?', answer: 'Puis-je', distractors: ['Peux-je', 'Veux-je'], level: 'B1.1', category: 'communication' },
  { sentence: 'J\'_______ besoin de plus de serviettes', answer: 'aurais', distractors: ['avais', 'ai'], level: 'B1.2', category: 'communication' },
  { sentence: '_______ il possible d\'avoir des gants?', answer: 'Serait', distractors: ['Était', 'Est'], level: 'B1.2', category: 'communication' },
  { sentence: 'Je _______ que la machine est en panne', answer: 'crois', distractors: ['pense', 'vois'], level: 'B1.1', category: 'communication' }
];

const fillBlankQuestions = fillBlankData.map((item, index) => ({
  question_type: 'FILL_BLANK',
  skill_category: 'GRAMMAR',
  difficulty_level: item.level,
  category: item.category,
  subcategory: 'completion',
  question_text: item.sentence,
  question_audio_url: `/audio/fill_blank/${index + 1}.mp3`,
  options: {
    type: 'fill_blank',
    sentence: item.sentence,
    blank_position: item.sentence.split(' ').findIndex(word => word.includes('_')),
    options: [
      { id: 'A', text: item.answer },
      ...item.distractors.map((dist, i) => ({
        id: String.fromCharCode(66 + i),
        text: dist
      }))
    ]
  },
  correct_answer: { id: 'A' },
  explanation_text: `La réponse correcte est: "${item.answer}"`
}));

// ========================================
// COMBINE ALL & SEED
// ========================================
async function seedUniversalQuizQuestions() {
  console.log('🌱 Starting ULTRA Universal Quiz Seed (250 questions)...\n');

  const alphabetQs = generateAlphabetQuestions();

  const allQuestions = [
    ...alphabetQs,
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
  console.log(`📈 Breakdown:`);
  console.log(`   🔤 ALPHABET: ${alphabetQs.length}`);
  console.log(`   🎧 AUDIO_TO_IMAGE: ${audioToImageQuestions.length}`);
  console.log(`   📖 TEXT_TO_IMAGE: ${textToImageQuestions.length}`);
  console.log(`   🖼️  IMAGE_TO_TEXT: ${imageToTextQuestions.length}`);
  console.log(`   ✍️  AUDIO_TO_TEXT: ${audioToTextQuestions.length}`);
  console.log(`   ⚧️  GENDER_SELECTION: ${genderSelectionQuestions.length}`);
  console.log(`   📝 CONJUGATION: ${conjugationQuestions.length}`);
  console.log(`   🔗 MATCHING: ${matchingQuestions.length}`);
  console.log(`   🎨 COLOR_DESCRIPTION: ${colorDescriptionQuestions.length}`);
  console.log(`   📄 FILL_BLANK: ${fillBlankQuestions.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const questionData of allQuestions) {
    try {
      await prisma.universalQuizQuestion.create({
        data: questionData
      });
      successCount++;
      process.stdout.write(`✅ ${successCount}/${allQuestions.length} (${Math.round(successCount/allQuestions.length*100)}%)\r`);
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error:`, error.message);
    }
  }

  console.log(`\n\n🎉 Seed completed!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\n🎓 Répartition par niveau:`);

  const byLevel = {};
  allQuestions.forEach(q => {
    byLevel[q.difficulty_level] = (byLevel[q.difficulty_level] || 0) + 1;
  });

  Object.keys(byLevel).sort().forEach(level => {
    console.log(`   ${level}: ${byLevel[level]} questions`);
  });
}

// Run the seed
seedUniversalQuizQuestions()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedUniversalQuizQuestions };
