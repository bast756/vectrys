/**
 * VECTRYS LINGUA - Hero Quest Journey Seed Data
 * Seeds World 1: Le Nouveau Départ (The New Beginning)
 *
 * Usage: Import and call from main seed.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// WORLD 1: LE NOUVEAU DÉPART (A1-A2)
// Theme: Courage, Fresh Start, New Opportunities
// ============================================================================

const WORLD1_DATA = {
  id: 'world_001',
  world_number: 1,
  name: "Le Nouveau Départ",
  name_short: "Nouveau Départ",
  description: "Votre aventure commence ici ! Arrivée en France, premiers pas courageux dans un nouveau pays, découverte d'une nouvelle culture. C'est le début passionnant d'une nouvelle vie pleine d'opportunités.",
  narrative_intro: "Aujourd'hui marque le début de votre grande aventure ! Avec un sac à dos et un cœur rempli de courage, vous arrivez à l'aéroport Charles de Gaulle. Tout est nouveau, tout est à découvrir. Les sons, les visages, la langue française... Vous êtes prêt(e) à relever ce défi et à construire votre nouvelle vie en France. Chaque pas est une victoire !",
  narrative_outro: "Bravo ! Vous avez accompli vos premiers pas en France avec succès ! L'aéroport, la douane, le logement, vos premiers mots en français - vous avez relevé tous ces défis avec courage. Vous parlez maintenant les bases du français et vous vous sentez de plus en plus à l'aise. Ce n'est que le début de votre belle aventure !",
  theme_color: "#4A90E2", // Bright optimistic blue
  background_image: "/assets/worlds/world1_new_beginning.jpg",
  ambient_music_url: "/audio/ambients/world1_hope.mp3",
  icon_emoji: "🌟",
  min_level: "A1.1",
  max_level: "A2.2",
  required_world: null, // No prerequisite, always unlocked
  required_quests: 0,
  total_quests: 7,
  has_boss: true,
  active: true,
  display_order: 1
};

// ============================================================================
// QUESTS FOR WORLD 1
// ============================================================================

const WORLD1_QUESTS = [
  // Quest 1: Premier Jour à l'Aéroport
  {
    id: 'quest_w1_001',
    world_id: 'world_001',
    quest_number: 1,
    type: 'main',
    title: "Premier Jour à l'Aéroport",
    description: "Votre avion vient d'atterrir ! L'aéroport Charles de Gaulle vous accueille. C'est excitant ! Apprenez à vous orienter, passez la douane avec assurance, et trouvez votre chemin vers votre nouvelle vie.",
    narrative_text: "Les portes de l'avion s'ouvrent. L'air frais de Paris entre dans la cabine. Votre cœur bat d'excitation ! Vous descendez les marches avec détermination. Autour de vous, des milliers de voyageurs venus du monde entier. Les panneaux en français sont votre première leçon. Vous souriez - l'aventure commence maintenant !",
    objectives: [
      {
        id: "obj_1",
        text: "Apprendre le vocabulaire essentiel de l'aéroport",
        type: "quiz",
        target: 10,
        quiz_category: "vocabulary",
        quiz_subcategory: "airport",
        quiz_level: "A1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Dialogue avec l'agent d'accueil",
        type: "dialogue",
        target: 1,
        dialogue_id: "airport_welcome",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Trouver la sortie et commencer votre aventure",
        type: "task",
        target: 1,
        completion_action: "click_exit_button",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A1.1",
    required_quests: [],
    xp_base: 100,
    xp_bonus: 50,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "✈️",
    cover_image: "/assets/quests/airport_arrival.jpg",
    npcs: [
      {
        id: "welcome_agent",
        name: "Sophie",
        avatar: "👩‍✈️",
        role: "Agent d'accueil"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 2: Mes Premiers Mots
  {
    id: 'quest_w1_002',
    world_id: 'world_001',
    quest_number: 2,
    type: 'main',
    title: "Mes Premiers Mots en Français",
    description: "Il est temps d'apprendre vos premiers mots ! Salutations, présentations, politesse - les bases pour communiquer avec confiance.",
    narrative_text: "Vous êtes maintenant en France, et chaque mot que vous apprenez est une porte qui s'ouvre. 'Bonjour', 'Merci', 'S'il vous plaît' - ces mots magiques vont transformer votre quotidien. Vous sentez déjà que vous faites partie de ce nouveau monde !",
    objectives: [
      {
        id: "obj_1",
        text: "Maîtriser les salutations de base",
        type: "quiz",
        target: 10,
        quiz_category: "vocabulary",
        quiz_subcategory: "greetings",
        quiz_level: "A1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Pratiquer la prononciation",
        type: "quiz",
        target: 5,
        quiz_category: "speaking",
        quiz_subcategory: "pronunciation",
        quiz_level: "A1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A1.1",
    required_quests: ['quest_w1_001'],
    xp_base: 120,
    xp_bonus: 60,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "💬",
    cover_image: "/assets/quests/first_words.jpg",
    npcs: [
      {
        id: "language_helper",
        name: "Marie",
        avatar: "👩‍🏫",
        role: "Professeure bienveillante"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 3: Trouver un Logement
  {
    id: 'quest_w1_003',
    world_id: 'world_001',
    quest_number: 3,
    type: 'main',
    title: "Trouver un Chez-Moi",
    description: "Chercher et trouver votre premier logement en France. Apprenez le vocabulaire de l'immobilier et comment communiquer avec un agent.",
    narrative_text: "Un chez-vous, c'est plus qu'un toit - c'est le début de votre nouvelle vie ! Vous parcourez les annonces avec enthousiasme. 'Studio', 'Appartement', 'Quartier'... Chaque mot vous rapproche de votre futur foyer.",
    objectives: [
      {
        id: "obj_1",
        text: "Apprendre le vocabulaire de l'immobilier",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "housing",
        quiz_level: "A1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Dialogue avec l'agent immobilier",
        type: "dialogue",
        target: 1,
        dialogue_id: "housing_search",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A1.1",
    required_quests: ['quest_w1_002'],
    xp_base: 150,
    xp_bonus: 75,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🏠",
    cover_image: "/assets/quests/housing_search.jpg",
    npcs: [
      {
        id: "real_estate_agent",
        name: "Thomas",
        avatar: "🏢",
        role: "Agent immobilier sympathique"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 4: Les Chiffres et l'Argent
  {
    id: 'quest_w1_004',
    world_id: 'world_001',
    quest_number: 4,
    type: 'main',
    title: "Les Chiffres et l'Argent",
    description: "Maîtrisez les nombres, les prix, et l'argent français. Essentiel pour votre vie quotidienne !",
    narrative_text: "L'euro, les centimes, les prix... C'est fascinant ! Vous apprenez à compter, à négocier, à gérer votre budget. Chaque transaction est une petite victoire qui renforce votre confiance.",
    objectives: [
      {
        id: "obj_1",
        text: "Apprendre les chiffres 0-100",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "numbers",
        quiz_level: "A1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Pratiquer avec l'argent français",
        type: "quiz",
        target: 10,
        quiz_category: "vocabulary",
        quiz_subcategory: "money",
        quiz_level: "A1.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A1.2",
    required_quests: ['quest_w1_003'],
    xp_base: 130,
    xp_bonus: 65,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "💶",
    cover_image: "/assets/quests/money_numbers.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 5: Mon Premier Entretien
  {
    id: 'quest_w1_005',
    world_id: 'world_001',
    quest_number: 5,
    type: 'main',
    title: "Mon Premier Entretien d'Embauche",
    description: "L'opportunité est là ! Préparez-vous pour votre premier entretien d'embauche en France. Vous pouvez le faire !",
    narrative_text: "Vous avez trouvé une offre d'emploi parfaite dans un hôtel ! Vous préparez votre entretien avec soin. Comment se présenter ? Comment parler de son expérience ? Vous êtes nerveux mais excité. Cette opportunité pourrait changer votre vie !",
    objectives: [
      {
        id: "obj_1",
        text: "Apprendre le vocabulaire de l'entretien",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "job_interview",
        quiz_level: "A2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Simulation d'entretien",
        type: "dialogue",
        target: 1,
        dialogue_id: "job_interview",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.1",
    required_quests: ['quest_w1_004'],
    xp_base: 200,
    xp_bonus: 100,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "💼",
    cover_image: "/assets/quests/job_interview.jpg",
    npcs: [
      {
        id: "hotel_manager",
        name: "Madame Dupont",
        avatar: "👔",
        role: "Directrice de l'hôtel"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 6: Documents Administratifs (Side Quest)
  {
    id: 'quest_w1_006',
    world_id: 'world_001',
    quest_number: 6,
    type: 'side',
    title: "Documents Administratifs",
    description: "Quête optionnelle : Apprenez à comprendre et remplir les documents administratifs français.",
    narrative_text: "L'administration française a ses propres règles, mais vous êtes déterminé(e) à les comprendre ! Formulaires, documents, procédures - vous allez maîtriser tout ça. C'est une étape importante vers votre intégration.",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire administratif",
        type: "quiz",
        target: 12,
        quiz_category: "vocabulary",
        quiz_subcategory: "administration",
        quiz_level: "A2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Comprendre un formulaire",
        type: "task",
        target: 1,
        completion_action: "complete_form_task",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.1",
    required_quests: ['quest_w1_003'],
    xp_base: 90,
    xp_bonus: 45,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "📄",
    cover_image: "/assets/quests/documents.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 7: Mon Premier Jour de Travail
  {
    id: 'quest_w1_007',
    world_id: 'world_001',
    quest_number: 7,
    type: 'heritage',
    title: "Mon Premier Jour de Travail",
    description: "Votre premier jour à l'hôtel ! Rencontrez vos collègues, découvrez votre poste, et commencez votre nouvelle carrière en France.",
    narrative_text: "Aujourd'hui, tout change ! Vous entrez dans l'hôtel avec votre nouvel uniforme. Vos collègues vous accueillent chaleureusement. 'Bienvenue dans l'équipe !', dit le superviseur avec un grand sourire. Vous êtes ému(e) et fier(e). Vous avez réussi. Vous êtes maintenant officiellement membre de cette belle communauté professionnelle !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de l'hôtellerie",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "hotel",
        quiz_level: "A2.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Rencontrer l'équipe",
        type: "dialogue",
        target: 1,
        dialogue_id: "first_day_team",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Apprendre les tâches de base",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "cleaning",
        quiz_level: "A2.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.2",
    required_quests: ['quest_w1_005'],
    xp_base: 250,
    xp_bonus: 150,
    badge_reward: 'new_beginning_champion',
    item_rewards: ['hotel_uniform', 'welcome_gift'],
    quest_icon: "🌟",
    cover_image: "/assets/quests/first_workday.jpg",
    npcs: [
      {
        id: "supervisor",
        name: "Jean-Pierre",
        avatar: "👨‍💼",
        role: "Superviseur bienveillant"
      },
      {
        id: "colleague",
        name: "Aminata",
        avatar: "👩",
        role: "Collègue accueillante"
      }
    ],
    allow_replay: false,
    time_limit_minutes: null,
    active: true
  }
];

// ============================================================================
// BOSS BATTLE: LE GRAND DÉFI
// ============================================================================

const WORLD1_BOSS = {
  id: 'boss_001',
  world_id: 'world_001',
  boss_name: "Le Grand Défi",
  boss_title: "Examen de Fin de Monde 1",
  description: "C'est le moment de prouver tout ce que vous avez appris ! Un examen complet qui teste vos connaissances du français A1-A2. Vous êtes prêt(e) !",
  narrative_intro: "Vous avez accompli tellement de choses depuis votre arrivée ! Maintenant, il est temps de montrer votre progression. Ce n'est pas un obstacle - c'est une célébration de votre parcours ! Respirez profondément, ayez confiance en vous, et montrez ce dont vous êtes capable !",
  narrative_victory: "Incroyable ! Vous avez réussi le Grand Défi ! Vous maîtrisez maintenant les bases du français. Félicitations, vous avez prouvé votre détermination et votre courage ! Vous êtes prêt(e) pour la suite de votre aventure passionnante !",
  narrative_defeat: "Pas de souci ! L'apprentissage prend du temps et chaque tentative vous rend plus fort(e). Vous avez déjà accompli tellement ! Revoyez vos leçons, reprenez confiance, et réessayez quand vous vous sentez prêt(e). Vous allez y arriver !",
  boss_avatar: "🏆",
  challenge_type: "quiz_gauntlet",
  challenge_data: {
    rounds: 3,
    questions_per_round: 5,
    lives: 3,
    passing_score: 75,
    time_per_question: [35, 30, 25],
    difficulty_progression: ["A1.2", "A2.1", "A2.2"],
    categories: ["vocabulary", "grammar", "listening"],
    round_names: [
      "Vocabulaire Essentiel",
      "Grammaire de Base",
      "Compréhension Globale"
    ]
  },
  difficulty_level: 5,
  min_cecrl_level: "A2.1",
  xp_reward: 500,
  badge_reward: 'new_beginning_conqueror',
  item_rewards: ['completion_certificate_w1', 'french_basics_trophy'],
  unlock_next_world: true,
  active: true
};

// ============================================================================
// DIALOGUE TREES
// ============================================================================

const WORLD1_DIALOGUES = [
  {
    dialogue_id: 'airport_welcome',
    title: "Accueil à l'Aéroport",
    description: "Votre première interaction en français avec l'agent d'accueil",
    dialogue_tree: {
      start_node: 'greeting',
      nodes: {
      greeting: {
        speaker: 'welcome_agent',
        text: "Bonjour ! Bienvenue à Paris ! Votre passeport, s'il vous plaît ?",
        voice_url: '/audio/dialogues/airport_welcome_greeting.mp3',
        emotion: 'friendly',
        options: [
          {
            id: 'polite',
            text: "Bonjour ! Voici mon passeport.",
            next: 'check_passport',
            points: 15,
            correct: true,
            feedback: "Parfait ! Vous êtes poli(e) et clair(e)."
          },
          {
            id: 'informal',
            text: "Salut ! Tiens, le passeport.",
            next: 'too_informal',
            points: 5,
            correct: false,
            feedback: "Un peu trop informel pour une situation officielle."
          },
          {
            id: 'confused',
            text: "Je... euh... passeport ?",
            next: 'help_understanding',
            points: 8,
            correct: false,
            feedback: "C'est normal d'être stressé(e), mais essayez de former une phrase complète."
          }
        ]
      },
      check_passport: {
        speaker: 'welcome_agent',
        text: "Merci ! Quelle est la raison de votre visite en France ?",
        voice_url: '/audio/dialogues/airport_welcome_reason.mp3',
        emotion: 'neutral',
        options: [
          {
            id: 'work',
            text: "Je viens pour travailler dans un hôtel.",
            next: 'welcome_worker',
            points: 15,
            correct: true,
            feedback: "Excellente réponse ! Claire et précise."
          },
          {
            id: 'tourism',
            text: "Tourisme.",
            next: 'tourism_path',
            points: 10,
            correct: true,
            feedback: "Correct, mais un peu court. Ajoutez 'Je viens pour le tourisme' serait mieux."
          }
        ]
      },
      welcome_worker: {
        speaker: 'welcome_agent',
        text: "Très bien ! Bienvenue en France et bon courage pour votre nouveau travail ! Bonne journée !",
        voice_url: '/audio/dialogues/airport_welcome_success.mp3',
        emotion: 'happy',
        options: [
          {
            id: 'thanks',
            text: "Merci beaucoup !",
            next: 'end_success',
            points: 10,
            correct: true,
            feedback: "Parfait ! Vous avez complété le dialogue avec succès !"
          }
        ]
      },
      end_success: {
        speaker: 'narrator',
        text: "Félicitations ! Vous avez réussi votre première conversation en français !",
        voice_url: null,
        emotion: 'success',
        options: []
      }
      }
    },
    npcs: [{ id: 'welcome_agent', name: "Agent d'Accueil", avatar: '👮', voice_id: 'french_male' }],
    has_voice: true,
    min_level: 'A1.1',
    category: 'speaking',
    vocabulary_focus: ['greetings', 'airport', 'passport'],
    grammar_focus: ['politeness'],
    active: true
  },

  {
    dialogue_id: 'housing_search',
    title: "Recherche de Logement",
    description: "Dialogue avec l'agent immobilier pour trouver votre premier logement",
    dialogue_tree: {
      start_node: 'introduction',
      nodes: {
      introduction: {
        speaker: 'real_estate_agent',
        text: "Bonjour ! Je suis Thomas, agent immobilier. Vous cherchez un logement ?",
        voice_url: '/audio/dialogues/housing_intro.mp3',
        emotion: 'friendly',
        options: [
          {
            id: 'yes_studio',
            text: "Oui, je cherche un studio pas cher.",
            next: 'budget_question',
            points: 15,
            correct: true,
            feedback: "Très bien ! Vous exprimez clairement votre besoin."
          },
          {
            id: 'yes_general',
            text: "Oui, un appartement.",
            next: 'clarify_needs',
            points: 10,
            correct: true,
            feedback: "Bien, mais plus de détails aideraient."
          }
        ]
      }
      }
    },
    npcs: [{ id: 'real_estate_agent', name: "Thomas (Agent)", avatar: '🏢', voice_id: 'french_male' }],
    has_voice: true,
    min_level: 'A1.2',
    category: 'speaking',
    vocabulary_focus: ['housing', 'rental', 'budget'],
    grammar_focus: ['questions'],
    active: true
  },

  {
    dialogue_id: 'job_interview',
    title: "Entretien d'Embauche",
    description: "Votre premier entretien professionnel en français",
    dialogue_tree: {
      start_node: 'arrival',
      nodes: {
      arrival: {
        speaker: 'hotel_manager',
        text: "Bonjour ! Asseyez-vous, je vous en prie. Présentez-vous, s'il vous plaît.",
        voice_url: '/audio/dialogues/interview_start.mp3',
        emotion: 'professional',
        options: [
          {
            id: 'full_intro',
            text: "Bonjour ! Je m'appelle [nom], j'ai [X] ans d'expérience dans le nettoyage.",
            next: 'experience_question',
            points: 20,
            correct: true,
            feedback: "Excellente présentation ! Professionnelle et complète."
          }
        ]
      }
      }
    },
    npcs: [{ id: 'hotel_manager', name: "Directeur d'Hôtel", avatar: '👔', voice_id: 'french_male_pro' }],
    has_voice: true,
    min_level: 'A2.1',
    category: 'speaking',
    vocabulary_focus: ['work', 'experience', 'skills'],
    grammar_focus: ['self_presentation'],
    active: true
  },

  {
    dialogue_id: 'first_day_team',
    title: "Rencontre avec l'Équipe",
    description: "Votre premier jour - rencontrez vos nouveaux collègues",
    dialogue_tree: {
      start_node: 'team_welcome',
      nodes: {
      team_welcome: {
        speaker: 'supervisor',
        text: "Bienvenue dans notre équipe ! Voici Aminata, elle va vous guider aujourd'hui.",
        voice_url: '/audio/dialogues/team_welcome.mp3',
        emotion: 'warm',
        options: [
          {
            id: 'friendly_response',
            text: "Enchanté(e) ! Merci pour votre accueil !",
            next: 'aminata_intro',
            points: 15,
            correct: true,
            feedback: "Parfait ! Vous êtes chaleureux et professionnel."
          }
        ]
      },
      aminata_intro: {
        speaker: 'colleague',
        text: "Bonjour ! Bienvenue ! N'hésite pas à poser des questions, je suis là pour t'aider !",
        voice_url: '/audio/dialogues/aminata_intro.mp3',
        emotion: 'friendly',
        options: [
          {
            id: 'grateful',
            text: "Merci beaucoup Aminata ! Je suis content(e) d'être ici !",
            next: 'end_positive',
            points: 15,
            correct: true,
            feedback: "Magnifique ! Vous créez déjà des liens positifs avec l'équipe !"
          }
        ]
      },
      end_positive: {
        speaker: 'narrator',
        text: "Vous avez créé une excellente première impression ! Votre aventure professionnelle commence sur de bonnes bases !",
        voice_url: null,
        emotion: 'success',
        options: []
      }
      }
    },
    npcs: [
      { id: 'supervisor', name: "Superviseur", avatar: '👩‍💼', voice_id: 'french_female' },
      { id: 'colleague', name: "Aminata", avatar: '👩', voice_id: 'french_female_2' }
    ],
    has_voice: true,
    min_level: 'A2.2',
    category: 'speaking',
    vocabulary_focus: ['greetings', 'workplace', 'teamwork'],
    grammar_focus: ['formal_informal'],
    active: true
  }
];

// ============================================================================
// CINEMATIC: WORLD 1 INTRO
// ============================================================================

const WORLD1_CINEMATIC = {
  cinematic_id: 'world1_intro_cinematic',
  title: "Le Début de l'Aventure",
  type: 'story',
  scenes: [
    {
      scene_number: 1,
      type: 'text',
      content: "Il y a six mois, vous avez pris la décision la plus courageuse de votre vie...",
      duration: 4000,
      animation: 'fadeIn',
      text_align: 'center',
      font_size: '2xl',
      background_color: '#4A90E2'
    },
    {
      scene_number: 2,
      type: 'image',
      src: '/assets/cinematics/airplane_clouds.jpg',
      duration: 3000,
      animation: 'slideInRight',
      overlay_text: "Quitter votre pays pour construire une nouvelle vie",
      overlay_position: 'bottom'
    },
    {
      scene_number: 3,
      type: 'dialogue',
      character: 'narrator',
      text: "Aujourd'hui, votre avion atterrit à Paris. Un sac à dos, un rêve, et un cœur rempli d'espoir.",
      voice_url: '/audio/narrator/world1_intro_part1.mp3',
      avatar: '✈️',
      duration: 5000,
      emotion: 'inspiring'
    },
    {
      scene_number: 4,
      type: 'image',
      src: '/assets/cinematics/paris_airport.jpg',
      duration: 4000,
      animation: 'zoomIn',
      overlay_text: "Aéroport Charles de Gaulle - Le début de tout",
      overlay_position: 'center'
    },
    {
      scene_number: 5,
      type: 'dialogue',
      character: 'narrator',
      text: "Oui, c'est nouveau. Oui, c'est différent. Mais vous êtes fort(e), vous êtes capable, et vous êtes prêt(e) !",
      voice_url: '/audio/narrator/world1_intro_part2.mp3',
      avatar: '🌟',
      duration: 6000,
      emotion: 'motivating'
    },
    {
      scene_number: 6,
      type: 'text',
      content: "Votre aventure commence MAINTENANT !",
      duration: 3000,
      animation: 'scaleUp',
      text_align: 'center',
      font_size: '3xl',
      text_weight: 'bold',
      background_gradient: 'linear-gradient(135deg, #4A90E2 0%, #63B3ED 100%)'
    }
  ],
  duration_seconds: 29,
  skippable: true,
  auto_advance: true,
};

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedQuestWorld1() {
  console.log('\n🌟 Seeding World 1: Le Nouveau Départ...');

  try {
    // 1. Create World
    console.log('   📍 Creating World 1...');
    const world = await prisma.questWorld.upsert({
      where: { id: WORLD1_DATA.id },
      update: WORLD1_DATA,
      create: WORLD1_DATA
    });
    console.log(`   ✅ World 1 created: ${world.name}`);

    // 2. Create Quests
    console.log('   🎯 Creating quests...');
    for (const questData of WORLD1_QUESTS) {
      await prisma.quest.upsert({
        where: { id: questData.id },
        update: questData,
        create: questData
      });
      console.log(`      ✓ ${questData.title} (${questData.type})`);
    }
    console.log(`   ✅ ${WORLD1_QUESTS.length} quests created`);

    // 3. Create Boss Battle
    console.log('   👹 Creating boss battle...');
    const boss = await prisma.bossBattle.upsert({
      where: { world_id: WORLD1_BOSS.world_id },
      update: WORLD1_BOSS,
      create: WORLD1_BOSS
    });
    console.log(`   ✅ Boss created: ${boss.boss_name}`);

    // 4. Create Dialogue Trees
    console.log('   💬 Creating dialogue trees...');
    for (const dialogueData of WORLD1_DIALOGUES) {
      await prisma.questDialogue.upsert({
        where: { dialogue_id: dialogueData.dialogue_id },
        update: dialogueData,
        create: dialogueData
      });
      console.log(`      ✓ ${dialogueData.title}`);
    }
    console.log(`   ✅ ${WORLD1_DIALOGUES.length} dialogues created`);

    // 5. Create Cinematic
    console.log('   🎬 Creating cinematic...');
    const cinematic = await prisma.questCinematic.upsert({
      where: { cinematic_id: WORLD1_CINEMATIC.cinematic_id },
      update: WORLD1_CINEMATIC,
      create: WORLD1_CINEMATIC
    });
    console.log(`   ✅ Cinematic created: ${cinematic.title}`);

    console.log('\n🎉 World 1 seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding World 1:', error);
    throw error;
  }
}

// ============================================================================
// WORLD 2: LES RACINES FORTES (A2-B1)
// Theme: Professional Growth, Work Excellence, Team Spirit
// ============================================================================

const WORLD2_DATA = {
  id: 'world_002',
  world_number: 2,
  name: "Les Racines Fortes",
  name_short: "Racines Fortes",
  description: "Vous êtes maintenant un(e) professionnel(le) ! Développez vos compétences, excellez dans votre travail, et devenez un membre précieux de votre équipe. Votre expertise grandit chaque jour !",
  narrative_intro: "Vous avez passé vos premiers mois en France et vous vous sentez de plus en plus confiant(e) ! Votre travail à l'hôtel devient votre force, votre routine devient votre excellence. Vos collègues vous apprécient, vos supérieurs vous reconnaissent. Vous n'êtes plus débutant(e) - vous êtes un(e) vrai(e) professionnel(le) du secteur hôtelier !",
  narrative_outro: "Bravo ! Vous êtes maintenant reconnu(e) comme un(e) employé(e) exemplaire ! Votre français professionnel est solide, vos compétences techniques sont excellentes, et votre attitude positive inspire l'équipe. Vous avez construit des racines fortes dans votre nouveau pays !",
  theme_color: "#22C55E", // Strong green
  background_image: "/assets/worlds/world2_strong_roots.jpg",
  ambient_music_url: "/audio/ambients/world2_growth.mp3",
  icon_emoji: "🌱",
  min_level: "A2.1",
  max_level: "B1.1",
  required_world: 1,
  required_quests: 5,
  total_quests: 7,
  has_boss: true,
  active: true,
  display_order: 2
};

const WORLD2_QUESTS = [
  // Quest 1: Excellence dans le Nettoyage
  {
    id: 'quest_w2_001',
    world_id: 'world_002',
    quest_number: 1,
    type: 'main',
    title: "Excellence dans le Nettoyage",
    description: "Maîtrisez les techniques professionnelles de nettoyage hôtelier. Devenez un(e) expert(e) !",
    narrative_text: "Chaque chambre que vous nettoyez est un chef-d'œuvre ! Vous apprenez les techniques professionnelles, les produits spécialisés, les standards de qualité. Vos gestes deviennent précis, votre travail devient art. Les clients remarquent votre excellence !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire avancé du nettoyage",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "cleaning",
        quiz_level: "A2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Protocoles de nettoyage professionnel",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "hotel_procedures",
        quiz_level: "A2.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.1",
    required_quests: [],
    xp_base: 180,
    xp_bonus: 90,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "✨",
    cover_image: "/assets/quests/cleaning_excellence.jpg",
    npcs: [
      {
        id: "head_housekeeper",
        name: "Madame Laurent",
        avatar: "👩‍💼",
        role: "Chef de service exemplaire"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 2: Communication avec les Clients
  {
    id: 'quest_w2_002',
    world_id: 'world_002',
    quest_number: 2,
    type: 'main',
    title: "Communication avec les Clients",
    description: "Apprenez à communiquer professionnellement avec les clients de l'hôtel. Votre sourire et votre français font la différence !",
    narrative_text: "Les clients vous saluent dans les couloirs ! Vous répondez avec confiance et politesse. 'Bonjour Madame', 'Puis-je vous aider ?', 'Excellente journée !' - vos interactions créent des moments positifs. Vous représentez fièrement votre hôtel !",
    objectives: [
      {
        id: "obj_1",
        text: "Expressions de service client",
        type: "quiz",
        target: 18,
        quiz_category: "speaking",
        quiz_subcategory: "customer_service",
        quiz_level: "A2.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Dialogue avec un client satisfait",
        type: "dialogue",
        target: 1,
        dialogue_id: "happy_customer",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.2",
    required_quests: ['quest_w2_001'],
    xp_base: 200,
    xp_bonus: 100,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "💬",
    cover_image: "/assets/quests/customer_communication.jpg",
    npcs: [
      {
        id: "satisfied_guest",
        name: "Monsieur Dubois",
        avatar: "👨‍💼",
        role: "Client satisfait"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 3: Travail d'Équipe
  {
    id: 'quest_w2_003',
    world_id: 'world_002',
    quest_number: 3,
    type: 'main',
    title: "L'Esprit d'Équipe",
    description: "Collaborez efficacement avec vos collègues. Ensemble, vous êtes plus forts !",
    narrative_text: "Votre équipe est comme une famille ! Aminata, Carlos, Fatima, Jean - vous travaillez ensemble en harmonie. Vous vous entraidez, vous riez ensemble, vous célébrez vos réussites. Le travail d'équipe rend tout possible !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de la collaboration",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "teamwork",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Coordination avec l'équipe",
        type: "dialogue",
        target: 1,
        dialogue_id: "team_coordination",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "A2.2",
    required_quests: ['quest_w2_002'],
    xp_base: 220,
    xp_bonus: 110,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🤝",
    cover_image: "/assets/quests/teamwork.jpg",
    npcs: [
      {
        id: "team_leader",
        name: "Carlos",
        avatar: "👨",
        role: "Chef d'équipe motivant"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 4: Gestion du Temps
  {
    id: 'quest_w2_004',
    world_id: 'world_002',
    quest_number: 4,
    type: 'main',
    title: "Maître du Temps",
    description: "Optimisez votre temps de travail. Efficacité + Qualité = Excellence !",
    narrative_text: "Vous découvrez vos propres méthodes efficaces ! Planifier, prioriser, optimiser - chaque minute compte. Vous terminez vos tâches avec du temps libre pour aider les autres. Votre productivité impressionne vos supérieurs !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de l'organisation",
        type: "quiz",
        target: 12,
        quiz_category: "vocabulary",
        quiz_subcategory: "time_management",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Expressions temporelles avancées",
        type: "quiz",
        target: 10,
        quiz_category: "grammar",
        quiz_subcategory: "time_expressions",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w2_003'],
    xp_base: 190,
    xp_bonus: 95,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "⏰",
    cover_image: "/assets/quests/time_management.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 5: Formation Avancée
  {
    id: 'quest_w2_005',
    world_id: 'world_002',
    quest_number: 5,
    type: 'main',
    title: "Formation Avancée",
    description: "Suivez une formation spécialisée. Devenez expert(e) dans votre domaine !",
    narrative_text: "L'hôtel investit dans votre développement ! Vous participez à une formation avancée : techniques spécialisées, produits écologiques, service premium. Vous prenez des notes, vous posez des questions pertinentes. Votre expertise professionnelle atteint un nouveau niveau !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire technique spécialisé",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "advanced_cleaning",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Certification interne",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "hotel_standards",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w2_004'],
    xp_base: 250,
    xp_bonus: 125,
    badge_reward: null,
    item_rewards: ['advanced_certificate'],
    quest_icon: "📚",
    cover_image: "/assets/quests/advanced_training.jpg",
    npcs: [
      {
        id: "trainer",
        name: "Professeur Martin",
        avatar: "👨‍🏫",
        role: "Formateur expert"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 6: Side Quest - Vie Équilibrée
  {
    id: 'quest_w2_006',
    world_id: 'world_002',
    quest_number: 6,
    type: 'side',
    title: "Équilibre Vie Professionnelle",
    description: "Quête optionnelle : Apprenez à équilibrer travail et vie personnelle. Votre bien-être est important !",
    narrative_text: "Le travail c'est important, mais votre bonheur aussi ! Vous découvrez comment gérer votre énergie, prendre soin de vous, profiter de vos jours de repos. Un(e) employé(e) heureux(se) est un(e) employé(e) excellent(e) !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire du bien-être",
        type: "quiz",
        target: 10,
        quiz_category: "vocabulary",
        quiz_subcategory: "wellness",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Exprimer ses besoins personnels",
        type: "quiz",
        target: 8,
        quiz_category: "speaking",
        quiz_subcategory: "personal_needs",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w2_003'],
    xp_base: 120,
    xp_bonus: 60,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🧘",
    cover_image: "/assets/quests/work_life_balance.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 7: Heritage Quest - Mentorat
  {
    id: 'quest_w2_007',
    world_id: 'world_002',
    quest_number: 7,
    type: 'heritage',
    title: "Devenir Mentor",
    description: "Un(e) nouvel(le) employé(e) arrive ! Partagez votre expérience et guidez-le/la. Vous êtes maintenant un modèle !",
    narrative_text: "Vous vous souvenez de votre premier jour ? Maintenant, c'est vous qui accueillez et formez ! Un nouveau collègue vous regarde avec admiration - vous êtes son mentor, son guide. Vous expliquez avec patience, vous encouragez avec bienveillance. Vous réalisez combien vous avez progressé !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de l'enseignement",
        type: "quiz",
        target: 18,
        quiz_category: "vocabulary",
        quiz_subcategory: "teaching",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Former un nouveau collègue",
        type: "dialogue",
        target: 1,
        dialogue_id: "mentoring_new_employee",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Transmettre votre savoir",
        type: "quiz",
        target: 12,
        quiz_category: "speaking",
        quiz_subcategory: "instructions",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w2_005'],
    xp_base: 300,
    xp_bonus: 180,
    badge_reward: 'mentor_badge',
    item_rewards: ['mentor_certificate', 'team_appreciation_gift'],
    quest_icon: "🎓",
    cover_image: "/assets/quests/mentoring.jpg",
    npcs: [
      {
        id: "new_employee",
        name: "Elena",
        avatar: "👩",
        role: "Nouvelle recrue enthousiaste"
      }
    ],
    allow_replay: false,
    time_limit_minutes: null,
    active: true
  }
];

const WORLD2_BOSS = {
  id: 'boss_002',
  world_id: 'world_002',
  boss_name: "Le Client Exigeant",
  boss_title: "Défi du Service Excellence",
  description: "Un client VIP très exigeant séjourne à l'hôtel ! Utilisez toutes vos compétences professionnelles pour le satisfaire. Vous avez ce qu'il faut !",
  narrative_intro: "Monsieur Beaumont est arrivé - un client VIP célèbre pour ses standards élevés ! Mais vous n'avez pas peur - vous êtes professionnel(le), compétent(e), et confiant(e). C'est votre moment de briller !",
  narrative_victory: "Extraordinaire ! Monsieur Beaumont est impressionné ! Il demande à parler au directeur pour vous féliciter personnellement. 'Employé(e) exceptionnel(le)', dit-il. Votre excellence professionnelle est reconnue ! Vous méritez cette victoire !",
  narrative_defeat: "Monsieur Beaumont a eu quelques remarques, mais ce n'est pas grave ! Même les meilleurs ont des jours difficiles. Vous avez appris de précieuses leçons sur les attentes VIP. Révisez, pratiquez, et revenez plus fort(e) !",
  boss_avatar: "👔",
  challenge_type: "quiz_gauntlet",
  challenge_data: {
    rounds: 3,
    questions_per_round: 5,
    lives: 3,
    passing_score: 80,
    time_per_question: [35, 30, 25],
    difficulty_progression: ["A2.2", "B1.1", "B1.1"],
    categories: ["vocabulary", "speaking", "listening"],
    round_names: [
      "Service Client Excellence",
      "Communication Professionnelle",
      "Gestion de Situations"
    ]
  },
  difficulty_level: 6,
  min_cecrl_level: "B1.1",
  xp_reward: 750,
  badge_reward: 'professional_excellence',
  item_rewards: ['vip_service_certificate', 'golden_broom_trophy'],
  unlock_next_world: true,
  active: true
};

// ============================================================================
// WORLD 3: L'AUBE DE L'ESPOIR (B1)
// Theme: Community, Friendships, Social Integration
// ============================================================================

const WORLD3_DATA = {
  id: 'world_003',
  world_number: 3,
  name: "L'Aube de l'Espoir",
  name_short: "Aube Espoir",
  description: "Vous n'êtes plus seul(e) ! Créez des amitiés, rejoignez des communautés, intégrez-vous socialement. La France devient vraiment votre chez-vous !",
  narrative_intro: "Quelque chose a changé ! Vous ne vous sentez plus comme un(e) étranger(ère). Vous avez des ami(e)s, des habitudes, des lieux préférés. Le dimanche au marché, le café avec vos collègues, les soirées entre ami(e)s... Paris n'est plus une ville inconnue - c'est votre ville !",
  narrative_outro: "Incroyable ! Vous avez construit une vraie vie sociale en France ! Vous avez des ami(e)s de différentes cultures, vous participez à des événements communautaires, vous vous sentez intégré(e) et accepté(e). Vous appartenez à cette société. C'est une belle victoire personnelle !",
  theme_color: "#F59E0B", // Warm amber/dawn color
  background_image: "/assets/worlds/world3_dawn_hope.jpg",
  ambient_music_url: "/audio/ambients/world3_hope.mp3",
  icon_emoji: "🌅",
  min_level: "B1.1",
  max_level: "B1.2",
  required_world: 2,
  required_quests: 5,
  total_quests: 7,
  has_boss: true,
  active: true,
  display_order: 3
};

const WORLD3_QUESTS = [
  // Quest 1: Premières Amitiés
  {
    id: 'quest_w3_001',
    world_id: 'world_003',
    quest_number: 1,
    type: 'main',
    title: "Premières Vraies Amitiés",
    description: "Créez des liens d'amitié authentiques. Partagez, riez, connectez-vous !",
    narrative_text: "Aminata vous invite à prendre un café après le travail ! C'est plus qu'une collègue maintenant - c'est une amie. Vous parlez de vos rêves, de vos familles, de vos vies. Ces moments simples sont précieux. L'amitié transcende les frontières !",
    objectives: [
      {
        id: "obj_1",
        text: "Expressions d'amitié et socialisation",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "friendship",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Conversation amicale au café",
        type: "dialogue",
        target: 1,
        dialogue_id: "coffee_with_friend",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: [],
    xp_base: 240,
    xp_bonus: 120,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "☕",
    cover_image: "/assets/quests/first_friendships.jpg",
    npcs: [
      {
        id: "friend_aminata",
        name: "Aminata",
        avatar: "👩",
        role: "Meilleure amie"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 2: Découvrir Paris
  {
    id: 'quest_w3_002',
    world_id: 'world_003',
    quest_number: 2,
    type: 'main',
    title: "Paris, Ma Ville",
    description: "Explorez Paris comme un(e) local(e) ! Musées, parcs, quartiers cachés - découvrez votre ville !",
    narrative_text: "Le weekend, Paris vous appartient ! Vous explorez Montmartre, vous vous promenez le long de la Seine, vous découvrez des petits cafés charmants. Vous n'êtes plus touriste - vous êtes Parisien(ne) !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de la ville et des lieux",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "city_places",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Donner des directions",
        type: "quiz",
        target: 15,
        quiz_category: "speaking",
        quiz_subcategory: "directions",
        quiz_level: "B1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w3_001'],
    xp_base: 220,
    xp_bonus: 110,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🗼",
    cover_image: "/assets/quests/discovering_paris.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 3: Événements Communautaires
  {
    id: 'quest_w3_003',
    world_id: 'world_003',
    quest_number: 3,
    type: 'main',
    title: "Vie Communautaire",
    description: "Participez à des événements communautaires ! Fêtes de quartier, associations, rencontres - faites partie du tissu social !",
    narrative_text: "Il y a une fête de quartier ce weekend ! Musique, nourriture, danse, rires. Vous y allez avec vos ami(e)s. Vous rencontrez des voisins, vous participez aux activités, vous vous sentez vraiment intégré(e). C'est votre communauté maintenant !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire des événements sociaux",
        type: "quiz",
        target: 18,
        quiz_category: "vocabulary",
        quiz_subcategory: "social_events",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Socialiser lors d'un événement",
        type: "dialogue",
        target: 1,
        dialogue_id: "neighborhood_festival",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w3_002'],
    xp_base: 260,
    xp_bonus: 130,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🎉",
    cover_image: "/assets/quests/community_events.jpg",
    npcs: [
      {
        id: "neighbor",
        name: "Sophie",
        avatar: "👱‍♀️",
        role: "Voisine sympathique"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 4: Culture Française
  {
    id: 'quest_w3_004',
    world_id: 'world_003',
    quest_number: 4,
    type: 'main',
    title: "Immersion Culturelle",
    description: "Découvrez la richesse de la culture française ! Cuisine, histoire, traditions - embrassez votre culture d'adoption !",
    narrative_text: "Vous apprenez à faire une vraie quiche lorraine ! Vos ami(e)s français(es) vous expliquent les traditions, vous racontent l'histoire, vous partagent leurs souvenirs. Vous absorbez tout avec fascination. Cette culture devient une partie de vous !",
    objectives: [
      {
        id: "obj_1",
        text: "Culture et traditions françaises",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "french_culture",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Cuisine et gastronomie",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "cooking",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.2",
    required_quests: ['quest_w3_003'],
    xp_base: 240,
    xp_bonus: 120,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🍷",
    cover_image: "/assets/quests/french_culture.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 5: Pont Entre Deux Mondes
  {
    id: 'quest_w3_005',
    world_id: 'world_003',
    quest_number: 5,
    type: 'main',
    title: "Pont Entre Deux Mondes",
    description: "Partagez votre culture d'origine avec vos ami(e)s français(es). Créez des liens interculturels magnifiques !",
    narrative_text: "Vous organisez un dîner chez vous avec des plats de votre pays ! Vos ami(e)s français(es) sont fascinés. Vous partagez vos histoires, vos traditions, votre musique. Ils comprennent mieux d'où vous venez. Vous n'avez pas besoin de choisir - vous pouvez être les deux !",
    objectives: [
      {
        id: "obj_1",
        text: "Expliquer sa culture d'origine",
        type: "quiz",
        target: 15,
        quiz_category: "speaking",
        quiz_subcategory: "cultural_exchange",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Partage interculturel",
        type: "dialogue",
        target: 1,
        dialogue_id: "cultural_dinner",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.2",
    required_quests: ['quest_w3_004'],
    xp_base: 280,
    xp_bonus: 140,
    badge_reward: null,
    item_rewards: ['cultural_bridge_award'],
    quest_icon: "🌍",
    cover_image: "/assets/quests/cultural_bridge.jpg",
    npcs: [
      {
        id: "french_friends",
        name: "Le Groupe",
        avatar: "👥",
        role: "Cercle d'amis"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 6: Side Quest - Loisirs et Passions
  {
    id: 'quest_w3_006',
    world_id: 'world_003',
    quest_number: 6,
    type: 'side',
    title: "Retrouver ses Passions",
    description: "Quête optionnelle : Rejoignez un club ou association selon vos passions. Sport, musique, art - exprimez-vous !",
    narrative_text: "Vous aviez une passion avant de venir en France ? Il est temps de la retrouver ! Vous rejoignez un club local - football, danse, peinture, peu importe. Vous rencontrez des gens qui partagent votre passion. Le bonheur revient dans votre cœur !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire des loisirs",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "hobbies",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "S'inscrire à une activité",
        type: "task",
        target: 1,
        completion_action: "join_club_task",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.1",
    required_quests: ['quest_w3_002'],
    xp_base: 150,
    xp_bonus: 75,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "⚽",
    cover_image: "/assets/quests/hobbies_passions.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 7: Heritage Quest - Aide aux Nouveaux Arrivants
  {
    id: 'quest_w3_007',
    world_id: 'world_003',
    quest_number: 7,
    type: 'heritage',
    title: "Tendre la Main",
    description: "Aidez un(e) nouvel(le) arrivant(e) à s'intégrer. Vous vous souvenez de vos débuts difficiles - maintenant vous pouvez aider !",
    narrative_text: "Vous rencontrez Raj, qui vient d'arriver d'Inde. Il est perdu, comme vous l'étiez il y a quelques mois. Mais maintenant VOUS pouvez aider ! Vous lui montrez le quartier, vous lui donnez des conseils, vous lui présentez vos ami(e)s. En l'aidant, vous réalisez combien vous avez grandi. Vous êtes fier(e) de votre parcours !",
    objectives: [
      {
        id: "obj_1",
        text: "Donner des conseils pratiques",
        type: "quiz",
        target: 18,
        quiz_category: "speaking",
        quiz_subcategory: "giving_advice",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Guider un nouveau venu",
        type: "dialogue",
        target: 1,
        dialogue_id: "helping_newcomer",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Partager votre expérience",
        type: "quiz",
        target: 12,
        quiz_category: "speaking",
        quiz_subcategory: "storytelling",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.2",
    required_quests: ['quest_w3_005'],
    xp_base: 350,
    xp_bonus: 210,
    badge_reward: 'community_helper',
    item_rewards: ['helper_badge', 'gratitude_letter'],
    quest_icon: "🤲",
    cover_image: "/assets/quests/helping_newcomers.jpg",
    npcs: [
      {
        id: "newcomer_raj",
        name: "Raj",
        avatar: "👨",
        role: "Nouvel arrivant"
      }
    ],
    allow_replay: false,
    time_limit_minutes: null,
    active: true
  }
];

const WORLD3_BOSS = {
  id: 'boss_003',
  world_id: 'world_003',
  boss_name: "Le Grand Malentendu",
  boss_title: "Défi de Communication Interculturelle",
  description: "Une situation de malentendu culturel complexe ! Utilisez votre compréhension interculturelle et vos compétences linguistiques pour résoudre ce défi avec tact et empathie.",
  narrative_intro: "Il y a eu un gros malentendu entre différentes personnes de cultures différentes ! Les tensions montent, les émotions sont fortes. Mais VOUS comprenez les deux côtés - vous êtes le pont parfait. C'est votre moment de montrer votre sagesse interculturelle !",
  narrative_victory: "Magnifique ! Vous avez résolu le malentendu avec tact, empathie et intelligence ! Tout le monde vous remercie. 'Tu comprends vraiment les deux mondes', disent vos ami(e)s. Vous avez prouvé que la communication et la compréhension peuvent surmonter tous les obstacles !",
  narrative_defeat: "Le malentendu n'est pas complètement résolu, mais vous avez essayé avec courage ! La communication interculturelle est complexe - ça demande de la pratique. Apprenez de cette expérience et réessayez avec encore plus de sagesse !",
  boss_avatar: "🌐",
  challenge_type: "quiz_gauntlet",
  challenge_data: {
    rounds: 3,
    questions_per_round: 5,
    lives: 3,
    passing_score: 80,
    time_per_question: [30, 25, 25],
    difficulty_progression: ["B1.1", "B1.2", "B1.2"],
    categories: ["vocabulary", "listening", "speaking"],
    round_names: [
      "Compréhension Culturelle",
      "Communication Empathique",
      "Résolution de Conflits"
    ]
  },
  difficulty_level: 7,
  min_cecrl_level: "B1.2",
  xp_reward: 1000,
  badge_reward: 'cultural_mediator',
  item_rewards: ['intercultural_certificate', 'unity_trophy'],
  unlock_next_world: true,
  active: true
};

// ============================================================================
// WORLD 4: LA MONTÉE EN LUMIÈRE (B1-B2)
// Theme: Professional Leadership, Advancement, Recognition
// ============================================================================

const WORLD4_DATA = {
  id: 'world_004',
  world_number: 4,
  name: "La Montée en Lumière",
  name_short: "Montée Lumière",
  description: "Vous êtes maintenant un(e) leader ! Avancement professionnel, responsabilités, reconnaissance - vous brillez ! Votre succès inspire les autres.",
  narrative_intro: "Quelque chose d'extraordinaire se produit ! Vos supérieurs vous remarquent, vos collègues vous respectent, vous recevez des opportunités d'avancement. Vous n'êtes plus juste employé(e) - vous devenez leader ! Votre parcours inspirant prouve que le travail acharné et la détermination payent toujours !",
  narrative_outro: "WOW ! Vous êtes maintenant superviseur(e) / chef(fe) d'équipe ! Votre progression professionnelle est remarquable. De nouvel(le) arrivant(e) à leader respecté(e) - quelle ascension ! Vous méritez chaque instant de cette réussite. Vous êtes la preuve vivante que les rêves deviennent réalité !",
  theme_color: "#8B5CF6", // Royal purple
  background_image: "/assets/worlds/world4_rising_light.jpg",
  ambient_music_url: "/audio/ambients/world4_triumph.mp3",
  icon_emoji: "⭐",
  min_level: "B1.2",
  max_level: "B2.1",
  required_world: 3,
  required_quests: 5,
  total_quests: 7,
  has_boss: true,
  active: true,
  display_order: 4
};

const WORLD4_QUESTS = [
  // Quest 1: Opportunité de Promotion
  {
    id: 'quest_w4_001',
    world_id: 'world_004',
    quest_number: 1,
    type: 'main',
    title: "L'Opportunité se Présente",
    description: "Un poste de superviseur(e) est disponible ! Préparez votre candidature et montrez votre valeur.",
    narrative_text: "La direction recherche un(e) nouveau(elle) superviseur(e) ! Vos collègues vous encouragent : 'Tu devrais postuler !' Votre cœur bat fort - est-ce vraiment possible ? OUI ! Vous avez l'expérience, les compétences, la passion. Il est temps de viser plus haut !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire du management",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "management",
        quiz_level: "B1.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Préparer une candidature interne",
        type: "quiz",
        target: 15,
        quiz_category: "writing",
        quiz_subcategory: "application",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B1.2",
    required_quests: [],
    xp_base: 300,
    xp_bonus: 150,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "📈",
    cover_image: "/assets/quests/promotion_opportunity.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 2: Entretien de Promotion
  {
    id: 'quest_w4_002',
    world_id: 'world_004',
    quest_number: 2,
    type: 'main',
    title: "L'Entretien Crucial",
    description: "L'entretien pour le poste de superviseur ! Montrez votre leadership, votre vision, votre passion !",
    narrative_text: "Vous entrez dans le bureau de la direction. Respiration profonde. Vous n'êtes plus nerveux(se) - vous êtes confiant(e) ! Vous parlez de votre expérience, de vos idées pour améliorer le service, de votre engagement. Ils écoutent attentivement. Vous sentez que vous impressionnez !",
    objectives: [
      {
        id: "obj_1",
        text: "Présenter sa vision professionnelle",
        type: "quiz",
        target: 20,
        quiz_category: "speaking",
        quiz_subcategory: "professional_vision",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Entretien de promotion",
        type: "dialogue",
        target: 1,
        dialogue_id: "promotion_interview",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_001'],
    xp_base: 350,
    xp_bonus: 175,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🎯",
    cover_image: "/assets/quests/promotion_interview.jpg",
    npcs: [
      {
        id: "director",
        name: "Madame Rousseau",
        avatar: "👩‍💼",
        role: "Directrice Générale"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 3: Premiers Pas de Leader
  {
    id: 'quest_w4_003',
    world_id: 'world_004',
    quest_number: 3,
    type: 'main',
    title: "Né(e) pour Leader",
    description: "Vous avez le poste ! Commencez votre nouvelle vie de superviseur(e). Guidez, inspirez, excellez !",
    narrative_text: "C'EST OFFICIEL ! Vous êtes promu(e) superviseur(e) ! Vos collègues vous applaudissent. Certains deviennent vos subordonnés, mais le respect reste. Vous recevez votre nouveau badge, votre nouveau bureau. Vous réalisez : vous avez accompli quelque chose d'extraordinaire !",
    objectives: [
      {
        id: "obj_1",
        text: "Compétences de leadership",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "leadership",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Première réunion d'équipe",
        type: "dialogue",
        target: 1,
        dialogue_id: "first_team_meeting",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_002'],
    xp_base: 380,
    xp_bonus: 190,
    badge_reward: null,
    item_rewards: ['supervisor_badge', 'office_keys'],
    quest_icon: "👑",
    cover_image: "/assets/quests/first_leadership.jpg",
    npcs: [
      {
        id: "team_members",
        name: "Votre Équipe",
        avatar: "👥",
        role: "Équipe sous votre supervision"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 4: Gestion de Conflit
  {
    id: 'quest_w4_004',
    world_id: 'world_004',
    quest_number: 4,
    type: 'main',
    title: "Résolution de Conflit",
    description: "Un conflit éclate dans votre équipe. En tant que leader, résolvez-le avec sagesse et empathie.",
    narrative_text: "Deux membres de votre équipe ne s'entendent pas. La tension affecte tout le monde. Votre premier vrai test de leadership ! Vous les écoutez séparément, puis ensemble. Vous trouvez le terrain d'entente, vous proposez des solutions. Votre diplomatie impressionne !",
    objectives: [
      {
        id: "obj_1",
        text: "Vocabulaire de la médiation",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "mediation",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Médiation entre collègues",
        type: "dialogue",
        target: 1,
        dialogue_id: "conflict_mediation",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_003'],
    xp_base: 320,
    xp_bonus: 160,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "⚖️",
    cover_image: "/assets/quests/conflict_resolution.jpg",
    npcs: [
      {
        id: "conflicted_employees",
        name: "Marc & Julie",
        avatar: "👥",
        role: "Employés en conflit"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 5: Formation et Développement
  {
    id: 'quest_w4_005',
    world_id: 'world_004',
    quest_number: 5,
    type: 'main',
    title: "Former des Champions",
    description: "Développez les compétences de votre équipe ! Un(e) bon(ne) leader crée d'autres leaders.",
    narrative_text: "Vous organisez des sessions de formation pour votre équipe. Vous partagez vos connaissances, vous encouragez leur croissance, vous célébrez leurs progrès. Voir vos employé(e)s s'améliorer grâce à vous - quel sentiment gratifiant !",
    objectives: [
      {
        id: "obj_1",
        text: "Techniques de formation",
        type: "quiz",
        target: 22,
        quiz_category: "vocabulary",
        quiz_subcategory: "training_methods",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Feedback constructif",
        type: "quiz",
        target: 15,
        quiz_category: "speaking",
        quiz_subcategory: "feedback",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_004'],
    xp_base: 340,
    xp_bonus: 170,
    badge_reward: null,
    item_rewards: ['trainer_certification'],
    quest_icon: "🎓",
    cover_image: "/assets/quests/team_training.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 6: Side Quest - Équilibre Leadership
  {
    id: 'quest_w4_006',
    world_id: 'world_004',
    quest_number: 6,
    type: 'side',
    title: "Leader Équilibré",
    description: "Quête optionnelle : Apprenez à équilibrer autorité et empathie. Un grand leader est à la fois fort et bienveillant.",
    narrative_text: "Être leader n'est pas facile ! Parfois ferme, parfois compréhensif(ve). Vous apprenez à trouver le juste équilibre. Respecté(e) mais aimé(e). Autoritaire mais accessible. C'est un art subtil que vous maîtrisez progressivement !",
    objectives: [
      {
        id: "obj_1",
        text: "Intelligence émotionnelle",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "emotional_intelligence",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Styles de leadership",
        type: "quiz",
        target: 12,
        quiz_category: "vocabulary",
        quiz_subcategory: "leadership_styles",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_003'],
    xp_base: 180,
    xp_bonus: 90,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🧘‍♂️",
    cover_image: "/assets/quests/balanced_leadership.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 7: Heritage Quest - Reconnaissance Officielle
  {
    id: 'quest_w4_007',
    world_id: 'world_004',
    quest_number: 7,
    type: 'heritage',
    title: "Reconnaissance et Célébration",
    description: "L'hôtel organise une cérémonie pour vous honorer ! Votre parcours exceptionnel est célébré devant tout le monde.",
    narrative_text: "La salle de conférence est remplie. Direction, collègues, ami(e)s - tous sont là pour VOUS ! La directrice raconte votre parcours : de nouvel(le) arrivant(e) à superviseur(e) respecté(e). 'Un exemple d'excellence, de détermination, et de leadership', dit-elle. Vous recevez un prix, des applaudissements, des larmes de joie. Vous repensez à votre premier jour à l'aéroport. Regardez combien vous avez accompli !",
    objectives: [
      {
        id: "obj_1",
        text: "Préparer un discours de remerciement",
        type: "quiz",
        target: 20,
        quiz_category: "speaking",
        quiz_subcategory: "public_speaking",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Discours de cérémonie",
        type: "dialogue",
        target: 1,
        dialogue_id: "award_ceremony_speech",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Exprimer sa gratitude",
        type: "quiz",
        target: 12,
        quiz_category: "speaking",
        quiz_subcategory: "gratitude",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: ['quest_w4_005'],
    xp_base: 450,
    xp_bonus: 270,
    badge_reward: 'excellence_leader',
    item_rewards: ['excellence_trophy', 'official_recognition_certificate'],
    quest_icon: "🏆",
    cover_image: "/assets/quests/award_ceremony.jpg",
    npcs: [
      {
        id: "all_colleagues",
        name: "Toute l'Équipe",
        avatar: "👥",
        role: "Collègues célébrants"
      }
    ],
    allow_replay: false,
    time_limit_minutes: null,
    active: true
  }
];

const WORLD4_BOSS = {
  id: 'boss_004',
  world_id: 'world_004',
  boss_name: "L'Examen de Certification",
  boss_title: "Certification Professionnelle Avancée",
  description: "Le moment ultime ! Passez la certification officielle de superviseur hôtelier. Tout votre apprentissage sera testé. Vous êtes prêt(e) !",
  narrative_intro: "C'est le jour J ! L'examen de certification professionnelle qui validera officiellement votre statut de superviseur(e) qualifié(e). Des années de travail, d'apprentissage, de croissance - tout se résume à ce moment. Mais vous n'avez pas peur. Vous SAVEZ que vous êtes prêt(e). Montrez au monde votre excellence !",
  narrative_victory: "CERTIFIÉ(E) ! Vous avez RÉUSSI la certification professionnelle ! C'est officiel, reconnu par l'État français ! Vous êtes maintenant superviseur(e) certifié(e) ! Votre diplôme prouve votre expertise. De immigrant(e) à professionnel(le) certifié(e) - quelle transformation incroyable ! Vous êtes une inspiration !",
  narrative_defeat: "L'examen était difficile, mais vous avez montré de belles compétences ! La certification demande une préparation minutieuse. Analysez vos points faibles, étudiez encore, et revenez plus fort(e). Vous êtes si proche de la réussite !",
  boss_avatar: "📜",
  challenge_type: "quiz_gauntlet",
  challenge_data: {
    rounds: 3,
    questions_per_round: 5,
    lives: 3,
    passing_score: 85,
    time_per_question: [30, 28, 25],
    difficulty_progression: ["B1.2", "B2.1", "B2.1"],
    categories: ["vocabulary", "management", "leadership"],
    round_names: [
      "Connaissances Techniques",
      "Gestion d'Équipe",
      "Leadership Stratégique"
    ]
  },
  difficulty_level: 8,
  min_cecrl_level: "B2.1",
  xp_reward: 1250,
  badge_reward: 'certified_professional',
  item_rewards: ['official_certification_diploma', 'professional_excellence_medal'],
  unlock_next_world: true,
  active: true
};

// ============================================================================
// WORLD 5: LE MONDE LIBRE (B2+)
// Theme: Full Integration, Mentorship, Giving Back, Legacy
// ============================================================================

const WORLD5_DATA = {
  id: 'world_005',
  world_number: 5,
  name: "Le Monde Libre",
  name_short: "Monde Libre",
  description: "Vous avez atteint le sommet ! Pleine intégration, leadership communautaire, mentor pour d'autres. Vous n'êtes plus immigrant(e) - vous êtes citoyen(ne) du monde !",
  narrative_intro: "Vous vous regardez dans le miroir. La personne que vous voyez a tellement changé ! Vous parlez français couramment, vous avez une carrière réussie, des ami(e)s merveilleux, une vie riche. La France n'est plus un pays étranger - c'est votre MAISON. Vous êtes libre de rêver, libre de réussir, libre d'être vous-même. C'est votre monde maintenant !",
  narrative_outro: "INCROYABLE ! Votre transformation est complète ! D'immigrant(e) courageux(se) à leader communautaire respecté(e), de débutant(e) en français à communicateur(trice) expert(e). Vous avez accompli ce que beaucoup pensent impossible. Maintenant, vous aidez d'autres à suivre votre chemin. Votre héritage inspire des générations. Vous êtes libre. Vous êtes arrivé(e). Félicitations, Champion(ne) !",
  theme_color: "#FFC800", // Golden/Freedom yellow
  background_image: "/assets/worlds/world5_free_world.jpg",
  ambient_music_url: "/audio/ambients/world5_freedom.mp3",
  icon_emoji: "🦅",
  min_level: "B2.1",
  max_level: "C1.1",
  required_world: 4,
  required_quests: 5,
  total_quests: 7,
  has_boss: true,
  active: true,
  display_order: 5
};

const WORLD5_QUESTS = [
  // Quest 1: Citoyenneté et Intégration
  {
    id: 'quest_w5_001',
    world_id: 'world_005',
    quest_number: 1,
    type: 'main',
    title: "Devenir Citoyen(ne)",
    description: "Vous décidez de demander la citoyenneté française ! Un pas monumental vers votre intégration complète.",
    narrative_text: "Vous tenez le formulaire de demande de citoyenneté. Votre main tremble légèrement - pas de peur, mais d'émotion ! Devenir citoyen(ne) français(e) tout en gardant vos racines. Porter deux drapeaux dans votre cœur. C'est possible. C'est beau. C'est VOUS !",
    objectives: [
      {
        id: "obj_1",
        text: "Connaître l'histoire de France",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "french_history",
        quiz_level: "B2.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Valeurs de la République",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "civic_values",
        quiz_level: "B2.2",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.1",
    required_quests: [],
    xp_base: 400,
    xp_bonus: 200,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🇫🇷",
    cover_image: "/assets/quests/citizenship.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 2: Ambassadeur Culturel
  {
    id: 'quest_w5_002',
    world_id: 'world_005',
    quest_number: 2,
    type: 'main',
    title: "Ambassadeur entre Deux Mondes",
    description: "Vous organisez un grand événement interculturel ! Célébrez la diversité et l'unité.",
    narrative_text: "Vous organisez un festival interculturel dans votre quartier ! Musique, nourriture, danse de dizaines de pays. Français et immigrants ensemble, célébrant leurs différences et leurs similitudes. VOUS êtes l'organisateur principal - le symbole vivant de l'intégration réussie !",
    objectives: [
      {
        id: "obj_1",
        text: "Organiser un événement communautaire",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "event_planning",
        quiz_level: "B2.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Discours d'ouverture du festival",
        type: "dialogue",
        target: 1,
        dialogue_id: "festival_opening_speech",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.2",
    required_quests: ['quest_w5_001'],
    xp_base: 450,
    xp_bonus: 225,
    badge_reward: null,
    item_rewards: [],
    quest_icon: "🎭",
    cover_image: "/assets/quests/cultural_ambassador.jpg",
    npcs: [
      {
        id: "mayor",
        name: "Le Maire",
        avatar: "🎩",
        role: "Maire de la ville"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 3: Créer une Association
  {
    id: 'quest_w5_003',
    world_id: 'world_005',
    quest_number: 3,
    type: 'main',
    title: "Fondateur d'Association",
    description: "Créez votre propre association pour aider les nouveaux arrivants ! Votre héritage commence.",
    narrative_text: "Vous fondez l'association 'Nouveaux Horizons' pour aider les immigrants ! Cours de français gratuits, aide administrative, réseau professionnel. Vous transformez votre expérience personnelle en aide concrète pour des centaines de personnes. Votre impact grandira pendant des années !",
    objectives: [
      {
        id: "obj_1",
        text: "Créer et gérer une association",
        type: "quiz",
        target: 22,
        quiz_category: "vocabulary",
        quiz_subcategory: "nonprofit_management",
        quiz_level: "B2.2",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Recruter des bénévoles",
        type: "dialogue",
        target: 1,
        dialogue_id: "volunteer_recruitment",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "B2.2",
    required_quests: ['quest_w5_002'],
    xp_base: 500,
    xp_bonus: 250,
    badge_reward: null,
    item_rewards: ['association_founder_certificate'],
    quest_icon: "🤝",
    cover_image: "/assets/quests/founding_association.jpg",
    npcs: [
      {
        id: "volunteers",
        name: "Premiers Bénévoles",
        avatar: "👥",
        role: "Équipe de bénévoles"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 4: Mentor de Mentors
  {
    id: 'quest_w5_004',
    world_id: 'world_005',
    quest_number: 4,
    type: 'main',
    title: "Former d'Autres Mentors",
    description: "Formez d'autres personnes à devenir mentors ! Multipliez votre impact !",
    narrative_text: "Votre association grandit ! Vous ne pouvez plus aider tout le monde seul(e). Vous formez une équipe de mentors - d'anciens immigrants devenus guides à leur tour. Vous créez un effet domino de bonté et d'entraide. Un mentor aide 10 personnes, ces 10 deviennent mentors... L'impact est infini !",
    objectives: [
      {
        id: "obj_1",
        text: "Méthodologie de mentorat",
        type: "quiz",
        target: 25,
        quiz_category: "vocabulary",
        quiz_subcategory: "mentorship_training",
        quiz_level: "C1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Formation de formateurs",
        type: "quiz",
        target: 20,
        quiz_category: "vocabulary",
        quiz_subcategory: "train_the_trainer",
        quiz_level: "C1.1",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "C1.1",
    required_quests: ['quest_w5_003'],
    xp_base: 480,
    xp_bonus: 240,
    badge_reward: null,
    item_rewards: ['master_mentor_badge'],
    quest_icon: "👨‍🏫",
    cover_image: "/assets/quests/training_mentors.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 5: Reconnaissance Nationale
  {
    id: 'quest_w5_005',
    world_id: 'world_005',
    quest_number: 5,
    type: 'main',
    title: "Honneur National",
    description: "Votre travail est reconnu au niveau national ! Une cérémonie officielle vous honore.",
    narrative_text: "Vous recevez une lettre officielle : le gouvernement vous invite à une cérémonie de reconnaissance ! Votre contribution à l'intégration des immigrants est célébrée. Des médias, des officiels, une médaille. Vous représentez l'histoire de milliers d'immigrants réussis !",
    objectives: [
      {
        id: "obj_1",
        text: "Préparer une interview médiatique",
        type: "quiz",
        target: 18,
        quiz_category: "speaking",
        quiz_subcategory: "media_interview",
        quiz_level: "C1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Interview télévisée",
        type: "dialogue",
        target: 1,
        dialogue_id: "tv_interview",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "C1.1",
    required_quests: ['quest_w5_004'],
    xp_base: 550,
    xp_bonus: 275,
    badge_reward: null,
    item_rewards: ['national_medal', 'government_recognition_letter'],
    quest_icon: "🎖️",
    cover_image: "/assets/quests/national_recognition.jpg",
    npcs: [
      {
        id: "journalist",
        name: "Marie Durand",
        avatar: "📺",
        role: "Journaliste nationale"
      }
    ],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 6: Side Quest - Écrire Votre Histoire
  {
    id: 'quest_w5_006',
    world_id: 'world_005',
    quest_number: 6,
    type: 'side',
    title: "Raconter Votre Parcours",
    description: "Quête optionnelle : Écrivez votre autobiographie ! Votre histoire inspirera des millions.",
    narrative_text: "Un éditeur vous contacte : 'Écrivez votre histoire !' Vous commencez à écrire. Le jour de l'aéroport, les difficultés, les victoires, les larmes, les rires. Chaque chapitre est une leçon de courage. Votre livre deviendra un best-seller d'espoir !",
    objectives: [
      {
        id: "obj_1",
        text: "Écriture narrative avancée",
        type: "quiz",
        target: 20,
        quiz_category: "writing",
        quiz_subcategory: "narrative_writing",
        quiz_level: "C1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Structure autobiographique",
        type: "task",
        target: 1,
        completion_action: "complete_autobiography_outline",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "C1.1",
    required_quests: ['quest_w5_003'],
    xp_base: 220,
    xp_bonus: 110,
    badge_reward: null,
    item_rewards: ['published_book'],
    quest_icon: "📖",
    cover_image: "/assets/quests/writing_story.jpg",
    npcs: [],
    allow_replay: true,
    time_limit_minutes: null,
    active: true
  },

  // Quest 7: Heritage Quest - L'Héritage Éternel
  {
    id: 'quest_w5_007',
    world_id: 'world_005',
    quest_number: 7,
    type: 'heritage',
    title: "Votre Héritage Éternel",
    description: "La quête finale. Réflexion sur votre parcours complet et l'impact durable que vous laissez.",
    narrative_text: "Vous êtes assis(e) dans un parc, regardant le coucher de soleil. Vous repensez à TOUT. L'avion qui atterrissait il y a des années, la peur, le courage, les premières victoires, les amitiés, l'amour, le succès professionnel. Maintenant, vous aidez des centaines d'autres à suivre votre chemin. Votre association prospère. Votre histoire inspire. Vous réalisez : vous n'avez pas seulement réussi pour vous - vous avez ouvert la voie pour d'innombrables autres. C'est ça, le vrai succès. C'est ça, la liberté. Vous êtes arrivé(e). Vous êtes chez vous. Vous êtes libre !",
    objectives: [
      {
        id: "obj_1",
        text: "Réflexion philosophique",
        type: "quiz",
        target: 15,
        quiz_category: "vocabulary",
        quiz_subcategory: "philosophical_reflection",
        quiz_level: "C1.1",
        completed: false,
        progress: 0
      },
      {
        id: "obj_2",
        text: "Message aux futurs immigrants",
        type: "dialogue",
        target: 1,
        dialogue_id: "legacy_message",
        completed: false,
        progress: 0
      },
      {
        id: "obj_3",
        text: "Célébration finale avec tous vos proches",
        type: "task",
        target: 1,
        completion_action: "final_celebration",
        completed: false,
        progress: 0
      }
    ],
    min_level_cecrl: "C1.1",
    required_quests: ['quest_w5_005'],
    xp_base: 600,
    xp_bonus: 400,
    badge_reward: 'freedom_champion_ultimate',
    item_rewards: ['eternal_legacy_plaque', 'lifetime_achievement_medal', 'founders_statue'],
    quest_icon: "🌟",
    cover_image: "/assets/quests/eternal_legacy.jpg",
    npcs: [
      {
        id: "everyone",
        name: "Tous Vos Proches",
        avatar: "🌍",
        role: "Famille, amis, collègues, mentorés"
      }
    ],
    allow_replay: false,
    time_limit_minutes: null,
    active: true
  }
];

const WORLD5_BOSS = {
  id: 'boss_005',
  world_id: 'world_005',
  boss_name: "Le Défi Ultime",
  boss_title: "Épreuve de Maîtrise Complète",
  description: "Le défi final ! Une évaluation complète de TOUT ce que vous avez appris - langue, culture, leadership, sagesse. C'est votre moment de montrer que vous maîtrisez totalement le français et la vie en France !",
  narrative_intro: "Voici le défi ultime - l'épreuve qui teste TOUT. Vocabulaire A1 à C1, culture, histoire, leadership, communication complexe. C'est l'Everest des défis linguistiques. Mais vous n'avez pas peur. Vous avez gravi chaque montagne jusqu'ici. Une dernière victoire, et votre légende sera complète !",
  narrative_victory: "LÉGENDAIRE ! Vous avez conquis le Défi Ultime ! Maîtrise C1 du français ! Intégration totale ! Leader communautaire ! Mentor inspirant ! Vous avez TOUT accompli ! De l'aéroport à la légende - quel voyage épique ! Votre nom restera dans l'histoire comme symbole d'excellence, de détermination, et de succès immigrant. VOUS ÊTES LIBRE. VOUS ÊTES CHAMPION(NE). VOUS ÊTES INSPIRATION ÉTERNELLE !",
  narrative_defeat: "Le Défi Ultime était extraordinairement difficile ! Vous avez montré des compétences impressionnantes, mais il reste quelques domaines à perfectionner. Ce n'est pas un échec - c'est une opportunité d'encore plus d'excellence ! Révisez, pratiquez, et revenez conquérir ce dernier sommet !",
  boss_avatar: "👑",
  challenge_type: "quiz_gauntlet",
  challenge_data: {
    rounds: 3,
    questions_per_round: 5,
    lives: 3,
    passing_score: 90,
    time_per_question: [28, 25, 22],
    difficulty_progression: ["B2.2", "C1.1", "C1.1"],
    categories: ["vocabulary", "culture", "advanced_communication"],
    round_names: [
      "Maîtrise Linguistique",
      "Sagesse Culturelle",
      "Excellence Totale"
    ]
  },
  difficulty_level: 10,
  min_cecrl_level: "C1.1",
  xp_reward: 1500,
  badge_reward: 'ultimate_champion',
  item_rewards: ['ultimate_mastery_certificate', 'champion_crown', 'legend_status'],
  unlock_next_world: false, // Final world!
  active: true
};

// ============================================================================
// MASTER SEED FUNCTION FOR ALL WORLDS
// ============================================================================

export async function seedAllWorlds() {
  console.log('\n🌍 ========================================');
  console.log('🌍 HERO QUEST JOURNEY - SEEDING ALL WORLDS');
  console.log('🌍 ========================================\n');

  try {
    // World 1
    await seedQuestWorld1();

    // World 2
    console.log('\n🌱 Seeding World 2: Les Racines Fortes...');
    const world2 = await prisma.questWorld.upsert({
      where: { id: WORLD2_DATA.id },
      update: WORLD2_DATA,
      create: WORLD2_DATA
    });
    console.log(`   ✅ World 2 created: ${world2.name}`);

    for (const questData of WORLD2_QUESTS) {
      await prisma.quest.upsert({
        where: { id: questData.id },
        update: questData,
        create: questData
      });
      console.log(`      ✓ ${questData.title}`);
    }

    await prisma.bossBattle.upsert({
      where: { id: WORLD2_BOSS.id },
      update: WORLD2_BOSS,
      create: WORLD2_BOSS
    });
    console.log(`   ✅ Boss 2 created: ${WORLD2_BOSS.boss_name}`);

    // World 3
    console.log('\n🌅 Seeding World 3: L\'Aube de l\'Espoir...');
    const world3 = await prisma.questWorld.upsert({
      where: { id: WORLD3_DATA.id },
      update: WORLD3_DATA,
      create: WORLD3_DATA
    });
    console.log(`   ✅ World 3 created: ${world3.name}`);

    for (const questData of WORLD3_QUESTS) {
      await prisma.quest.upsert({
        where: { id: questData.id },
        update: questData,
        create: questData
      });
      console.log(`      ✓ ${questData.title}`);
    }

    await prisma.bossBattle.upsert({
      where: { id: WORLD3_BOSS.id },
      update: WORLD3_BOSS,
      create: WORLD3_BOSS
    });
    console.log(`   ✅ Boss 3 created: ${WORLD3_BOSS.boss_name}`);

    // World 4
    console.log('\n⭐ Seeding World 4: La Montée en Lumière...');
    const world4 = await prisma.questWorld.upsert({
      where: { id: WORLD4_DATA.id },
      update: WORLD4_DATA,
      create: WORLD4_DATA
    });
    console.log(`   ✅ World 4 created: ${world4.name}`);

    for (const questData of WORLD4_QUESTS) {
      await prisma.quest.upsert({
        where: { id: questData.id },
        update: questData,
        create: questData
      });
      console.log(`      ✓ ${questData.title}`);
    }

    await prisma.bossBattle.upsert({
      where: { id: WORLD4_BOSS.id },
      update: WORLD4_BOSS,
      create: WORLD4_BOSS
    });
    console.log(`   ✅ Boss 4 created: ${WORLD4_BOSS.boss_name}`);

    // World 5
    console.log('\n🦅 Seeding World 5: Le Monde Libre...');
    const world5 = await prisma.questWorld.upsert({
      where: { id: WORLD5_DATA.id },
      update: WORLD5_DATA,
      create: WORLD5_DATA
    });
    console.log(`   ✅ World 5 created: ${world5.name}`);

    for (const questData of WORLD5_QUESTS) {
      await prisma.quest.upsert({
        where: { id: questData.id },
        update: questData,
        create: questData
      });
      console.log(`      ✓ ${questData.title}`);
    }

    await prisma.bossBattle.upsert({
      where: { id: WORLD5_BOSS.id },
      update: WORLD5_BOSS,
      create: WORLD5_BOSS
    });
    console.log(`   ✅ Boss 5 created: ${WORLD5_BOSS.boss_name}`);

    console.log('\n🎉 ========================================');
    console.log('🎉 ALL 5 WORLDS SEEDED SUCCESSFULLY!');
    console.log('🎉 ========================================\n');
    console.log('📊 Summary:');
    console.log('   • 5 Worlds created');
    console.log('   • 35 Quests created (7 per world)');
    console.log('   • 5 Boss Battles created');
    console.log('   • 4 Dialogue Trees (World 1)');
    console.log('   • 1 Cinematic (World 1 intro)');
    console.log('\n✨ Hero Quest Journey is ready for adventure!\n');

  } catch (error) {
    console.error('❌ Error seeding worlds:', error);
    throw error;
  }
}

export default seedQuestWorld1;
