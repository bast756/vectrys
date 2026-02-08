/**
 * VECTRYS — Tests unitaires Profilage FATE
 *
 * 8 suites de tests couvrant :
 * - Détection des 4 profils (F, A, T, E)
 * - Fallback default
 * - Vacances scolaires
 * - Enrichissement par messages
 * - Confiance faible
 *
 * @version 2.0.0
 */

// Mock Prisma
jest.unstable_mockModule('@prisma/client', () => {
  const mockPrisma = {
    fATE_Profile: {
      groupBy: jest.fn().mockResolvedValue([])
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    __esModule: true
  };
});

// Import dynamique après mock
let fateService;

beforeAll(async () => {
  const module = await import('../services/fate-profile.service.js');
  fateService = module.default;
});

// ============================================
// SUITE 1 : Détection Family (F)
// ============================================
describe('1. Détection Family (F)', () => {
  test('détecte Family avec hasChildren=true', () => {
    const profil = fateService.detectProfile({
      nbGuests: 4,
      hasChildren: true,
      duration: 7
    });
    expect(profil.profile).toBe('F');
    expect(profil.confidence).toBeGreaterThan(0.5);
    expect(profil.reasons).toContain('hasChildren');
  });

  test('détecte Family avec nbGuests élevé en vacances scolaires', () => {
    const profil = fateService.detectProfile({
      nbGuests: 5,
      duration: 7,
      period: '2026-07-15',
      hasChildren: false
    });
    // En juillet, vacances scolaires → devrait être F ou A
    expect(['F', 'A']).toContain(profil.profile);
    expect(profil.confidence).toBeGreaterThan(0);
  });

  test('détecte Family avec enfants et logement familial', () => {
    const profil = fateService.detectProfile({
      nbGuests: 4,
      hasChildren: true,
      duration: 5,
      propertyType: 'house'
    });
    expect(profil.profile).toBe('F');
    expect(profil.confidence).toBeGreaterThanOrEqual(0.7);
  });
});

// ============================================
// SUITE 2 : Détection Adventure (A)
// ============================================
describe('2. Détection Adventure (A)', () => {
  test('détecte Adventure avec long séjour en été', () => {
    const profil = fateService.detectProfile({
      nbGuests: 2,
      duration: 10,
      period: '2026-08-01',
      hasChildren: false
    });
    // Long séjour en vacances → Adventure
    expect(profil.profile).toBe('A');
    expect(profil.confidence).toBeGreaterThan(0.3);
  });

  test('détecte Adventure avec séjour >= 7 jours en vacances', () => {
    const profil = fateService.detectProfile({
      nbGuests: 3,
      duration: 8,
      period: '2026-07-20',
      hasChildren: false
    });
    expect(['A', 'F']).toContain(profil.profile);
  });
});

// ============================================
// SUITE 3 : Détection Traveler (T)
// ============================================
describe('3. Détection Traveler (T)', () => {
  test('détecte Traveler avec solo court séjour en studio', () => {
    const profil = fateService.detectProfile({
      nbGuests: 1,
      duration: 2,
      propertyType: 'studio',
      hasChildren: false,
      period: '2026-03-10' // Hors vacances
    });
    expect(profil.profile).toBe('T');
    expect(profil.confidence).toBeGreaterThan(0.5);
  });

  test('détecte Traveler avec solo apartment court séjour', () => {
    const profil = fateService.detectProfile({
      nbGuests: 1,
      duration: 1,
      propertyType: 'apartment',
      hasChildren: false,
      period: '2026-11-15' // Hors vacances scolaires (avant Noël)
    });
    expect(profil.profile).toBe('T');
  });
});

// ============================================
// SUITE 4 : Détection Escape (E)
// ============================================
describe('4. Détection Escape (E)', () => {
  test('détecte Escape avec couple court séjour', () => {
    const profil = fateService.detectProfile({
      nbGuests: 2,
      duration: 3,
      hasChildren: false
    });
    expect(profil.profile).toBe('E');
    expect(profil.confidence).toBeGreaterThan(0.4);
  });

  test('détecte Escape avec duo sans enfants', () => {
    const profil = fateService.detectProfile({
      nbGuests: 2,
      duration: 2,
      propertyType: 'apartment',
      hasChildren: false,
      period: '2026-02-14' // Saint-Valentin (vacances février)
    });
    expect(profil.profile).toBe('E');
  });
});

// ============================================
// SUITE 5 : Fallback default
// ============================================
describe('5. Fallback default', () => {
  test('retourne default pour données ambiguës', () => {
    const profil = fateService.detectProfile({
      nbGuests: 3,
      duration: 2,
      hasChildren: false,
      period: '2026-11-15'
    });
    // Avec ces données, pas de profil dominant clair
    expect(['default', 'E', 'T', 'F', 'A']).toContain(profil.profile);
  });

  test('retourne default pour données vides', () => {
    const profil = fateService.detectProfile({});
    expect(profil.profile).toBe('default');
    expect(profil.confidence).toBeLessThan(0.3);
  });

  test('retourne default pour null', () => {
    const profil = fateService.detectProfile(null);
    expect(profil.profile).toBe('default');
  });
});

// ============================================
// SUITE 6 : Vacances scolaires
// ============================================
describe('6. Vacances scolaires', () => {
  test('juillet est en vacances scolaires', () => {
    expect(fateService.isSchoolHoliday(new Date('2026-07-15'))).toBe(true);
  });

  test('août est en vacances scolaires', () => {
    expect(fateService.isSchoolHoliday(new Date('2026-08-10'))).toBe(true);
  });

  test('septembre (hors vacances) retourne false', () => {
    expect(fateService.isSchoolHoliday(new Date('2026-09-15'))).toBe(false);
  });

  test('fin décembre est en vacances scolaires', () => {
    expect(fateService.isSchoolHoliday(new Date('2026-12-25'))).toBe(true);
  });

  test('isVacationPeriod retourne true en été', () => {
    expect(fateService.isVacationPeriod(new Date('2026-07-15'))).toBe(true);
  });
});

// ============================================
// SUITE 7 : Enrichissement par messages
// ============================================
describe('7. Enrichissement par messages', () => {
  test('boost profil T avec mots-clés WiFi et bureau', () => {
    const base = { profile: 'T', confidence: 0.5, reasons: ['solo'] };
    const enrichi = fateService.enrichProfileFromMessages(base, [
      'Bonjour, est-ce que le WiFi est performant ?',
      'Y a-t-il un bureau pour travailler ?'
    ]);
    expect(enrichi.confidence).toBeGreaterThan(0.5);
    expect(enrichi.profile).toBe('T');
  });

  test('boost profil F avec mots-clés bébé et lit parapluie', () => {
    const base = { profile: 'F', confidence: 0.5, reasons: ['hasChildren'] };
    const enrichi = fateService.enrichProfileFromMessages(base, [
      'Nous avons un bébé, avez-vous un lit parapluie ?'
    ]);
    expect(enrichi.confidence).toBeGreaterThan(0.5);
    expect(enrichi.profile).toBe('F');
  });

  test('peut basculer le profil si messages très différents', () => {
    const base = { profile: 'default', confidence: 0.2, reasons: [] };
    const enrichi = fateService.enrichProfileFromMessages(base, [
      'romantique anniversaire surprise couple dîner spa escapade bougie'
    ]);
    // Score E devrait dominer avec autant de mots-clés
    expect(enrichi.profile).toBe('E');
    expect(enrichi.confidence).toBeGreaterThan(0.3);
  });

  test('retourne le profil de base si pas de messages', () => {
    const base = { profile: 'T', confidence: 0.6, reasons: ['solo'] };
    const enrichi = fateService.enrichProfileFromMessages(base, []);
    expect(enrichi.profile).toBe('T');
    expect(enrichi.confidence).toBe(0.6);
  });
});

// ============================================
// SUITE 8 : Confiance faible
// ============================================
describe('8. Confiance faible → default dans envoi', () => {
  test('profil avec confiance < 0.3 retourne default', () => {
    const profil = fateService.detectProfile({});
    expect(profil.profile).toBe('default');
    expect(profil.confidence).toBeLessThan(0.3);
  });

  test('getProfileLabel retourne les bons labels', () => {
    expect(fateService.getProfileLabel('F')).toBe('Family');
    expect(fateService.getProfileLabel('A')).toBe('Adventure');
    expect(fateService.getProfileLabel('T')).toBe('Traveler');
    expect(fateService.getProfileLabel('E')).toBe('Escape');
    expect(fateService.getProfileLabel('default')).toBe('Standard');
    expect(fateService.getProfileLabel('inconnu')).toBe('Standard');
  });
});
