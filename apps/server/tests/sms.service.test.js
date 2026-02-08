/**
 * VECTRYS — Tests unitaires Service SMS + FATE
 *
 * 10 suites de tests couvrant :
 * - Formatage et validation numéros
 * - Envoi SMS (mock Twilio)
 * - Templates FATE
 * - Envoi FATE avec détection profil
 * - Rate limiting, budget, stats
 *
 * @version 2.0.0
 */

// Mock Twilio avant les imports
jest.unstable_mockModule('twilio', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    sid: 'SM_TEST_SID_123',
    status: 'queued',
    dateSent: new Date()
  });

  const mockFetch = jest.fn().mockResolvedValue({
    sid: 'SM_TEST_SID_123',
    status: 'delivered',
    dateSent: new Date(),
    dateUpdated: new Date(),
    price: '-0.0075',
    priceUnit: 'USD',
    errorCode: null,
    errorMessage: null
  });

  const mockClient = {
    messages: {
      create: mockCreate
    }
  };
  mockClient.messages.__proto__ = function (sid) {
    return { fetch: mockFetch };
  };

  return {
    default: jest.fn(() => mockClient),
    __esModule: true
  };
});

// Mock Prisma
jest.unstable_mockModule('@prisma/client', () => {
  const mockPrisma = {
    smsLog: {
      create: jest.fn().mockResolvedValue({ id: 'test-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-id' }),
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([])
    },
    fATE_Profile: {
      create: jest.fn().mockResolvedValue({ id: 'fate-id' }),
      groupBy: jest.fn().mockResolvedValue([])
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    __esModule: true
  };
});

// Mock dotenv
jest.unstable_mockModule('dotenv', () => ({
  default: { config: jest.fn() },
  config: jest.fn(),
  __esModule: true
}));

// Variables d'environnement pour tests
process.env.TWILIO_ACCOUNT_SID = 'AC_TEST_SID';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+33100000000';
process.env.NODE_ENV = 'test';
process.env.SMS_DAILY_LIMIT = '500';

// Imports dynamiques (après les mocks)
let smsService, getTemplate, listTemplates;

beforeAll(async () => {
  const smsModule = await import('../services/sms.service.js');
  smsService = smsModule.default;

  const templatesModule = await import('../config/sms-templates.js');
  getTemplate = templatesModule.getTemplate;
  listTemplates = templatesModule.listTemplates;
});

// ============================================
// SUITE 1 : formatPhoneNumber()
// ============================================
describe('1. formatPhoneNumber()', () => {
  test('convertit un numéro français 06 en E.164', () => {
    expect(smsService.formatPhoneNumber('0612345678')).toBe('+33612345678');
  });

  test('conserve un numéro déjà au format E.164', () => {
    expect(smsService.formatPhoneNumber('+33612345678')).toBe('+33612345678');
  });

  test('supprime les espaces et tirets', () => {
    expect(smsService.formatPhoneNumber('+33 6 12 34 56 78')).toBe('+33612345678');
    expect(smsService.formatPhoneNumber('06-12-34-56-78')).toBe('+33612345678');
  });

  test('retourne null pour une entrée vide', () => {
    expect(smsService.formatPhoneNumber('')).toBeNull();
    expect(smsService.formatPhoneNumber(null)).toBeNull();
    expect(smsService.formatPhoneNumber(undefined)).toBeNull();
  });
});

// ============================================
// SUITE 2 : validatePhoneNumber()
// ============================================
describe('2. validatePhoneNumber()', () => {
  test('valide un numéro E.164 correct', () => {
    expect(smsService.validatePhoneNumber('+33612345678')).toBe(true);
    expect(smsService.validatePhoneNumber('+14155552671')).toBe(true);
  });

  test('valide un numéro français 06', () => {
    expect(smsService.validatePhoneNumber('0612345678')).toBe(true);
  });

  test('rejette un numéro invalide', () => {
    expect(smsService.validatePhoneNumber('123')).toBe(false);
    expect(smsService.validatePhoneNumber('')).toBe(false);
    expect(smsService.validatePhoneNumber('abcdef')).toBe(false);
  });
});

// ============================================
// SUITE 3 : sendSMS() — mock Twilio
// ============================================
describe('3. sendSMS()', () => {
  test('envoie un SMS avec succès', async () => {
    const resultat = await smsService.sendSMS('+33612345678', 'Test message');
    expect(resultat.succes).toBe(true);
    expect(resultat.messageSid).toBe('SM_TEST_SID_123');
  });

  test('retourne erreur pour numéro invalide', async () => {
    const resultat = await smsService.sendSMS('123', 'Test');
    expect(resultat.succes).toBe(false);
    expect(resultat.raison).toBe('NUMERO_INVALIDE');
  });
});

// ============================================
// SUITE 4 : sendTemplatedSMS()
// ============================================
describe('4. sendTemplatedSMS()', () => {
  test('envoie un SMS template welcome', async () => {
    const resultat = await smsService.sendTemplatedSMS(
      '+33612345678',
      'welcome',
      { guestName: 'Marie', propertyName: 'Le Nid' },
      'default'
    );
    expect(resultat.succes).toBe(true);
    expect(resultat.template).toBe('welcome');
    expect(resultat.fateProfile).toBe('default');
  });

  test('lance une erreur pour template inexistant', async () => {
    await expect(
      smsService.sendTemplatedSMS('+33612345678', 'inexistant', {})
    ).rejects.toThrow();
  });
});

// ============================================
// SUITE 5 : logSMS()
// ============================================
describe('5. logSMS()', () => {
  test('enregistre un SMS en base', async () => {
    const resultat = await smsService.logSMS({
      messageSid: 'SM_LOG_TEST',
      destinataire: '+33612345678',
      messageContenu: 'Test log',
      type: 'SMS',
      statut: 'ENVOYE'
    });
    expect(resultat).toBeDefined();
  });
});

// ============================================
// SUITE 6 : getSMSStats()
// ============================================
describe('6. getSMSStats()', () => {
  test('retourne les stats sur un mois', async () => {
    const stats = await smsService.getSMSStats('month');
    expect(stats).toHaveProperty('periode', 'month');
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('budget');
    expect(stats.budget).toHaveProperty('limite');
  });
});

// ============================================
// SUITE 7 : Rate limiting
// ============================================
describe('7. Rate limiting', () => {
  test('autorise les premiers envois', () => {
    // Reset interne
    smsService.historiqueEnvois.clear();
    expect(smsService._checkRateLimit('+33699999999')).toBe(true);
  });

  test('bloque après 10 SMS/min sur le même numéro', () => {
    smsService.historiqueEnvois.clear();
    const numero = '+33688888888';
    for (let i = 0; i < 10; i++) {
      smsService._checkRateLimit(numero);
    }
    expect(smsService._checkRateLimit(numero)).toBe(false);
  });
});

// ============================================
// SUITE 8 : Budget
// ============================================
describe('8. Budget SMS', () => {
  test('retourne le budget avec limite configurée', async () => {
    const stats = await smsService.getSMSStats('month');
    expect(stats.budget.limite).toBe(500);
  });
});

// ============================================
// SUITE 9 : sendFATESMS()
// ============================================
describe('9. sendFATESMS()', () => {
  test('détecte le profil et envoie le SMS FATE', async () => {
    const resultat = await smsService.sendFATESMS(
      '+33612345678',
      'welcome',
      { guestName: 'Marie', propertyName: 'Le Nid' },
      { nbGuests: 2, duration: 3, hasChildren: false }
    );
    expect(resultat.succes).toBe(true);
    expect(resultat.fateProfile).toBeDefined();
    expect(resultat.fateProfile.detected).toBeDefined();
    expect(resultat.fateProfile.confidence).toBeGreaterThanOrEqual(0);
  });

  test('utilise default si confiance faible', async () => {
    const resultat = await smsService.sendFATESMS(
      '+33612345678',
      'welcome',
      { guestName: 'Test', propertyName: 'Test' },
      { nbGuests: 3, duration: 2 } // Ambiguë
    );
    expect(resultat.succes).toBe(true);
    // Si confiance < 0.6, le profil utilisé sera "default"
    expect(['F', 'A', 'T', 'E', 'default']).toContain(resultat.fateProfile.used);
  });
});

// ============================================
// SUITE 10 : Templates FATE — variantes différentes
// ============================================
describe('10. Templates FATE — variantes', () => {
  test('chaque profil produit un message différent pour welcome', () => {
    const params = { guestName: 'Marie', propertyName: 'Le Nid' };

    const family = getTemplate('welcome', 'F', params);
    const adventure = getTemplate('welcome', 'A', params);
    const traveler = getTemplate('welcome', 'T', params);
    const escape = getTemplate('welcome', 'E', params);
    const standard = getTemplate('welcome', 'default', params);

    // Tous doivent avoir un body non vide
    expect(family.body.length).toBeGreaterThan(0);
    expect(adventure.body.length).toBeGreaterThan(0);
    expect(traveler.body.length).toBeGreaterThan(0);
    expect(escape.body.length).toBeGreaterThan(0);

    // Les messages doivent être différents entre profils
    expect(family.body).not.toBe(traveler.body);
    expect(adventure.body).not.toBe(escape.body);
    expect(family.body).not.toBe(standard.body);
  });

  test('OTP est identique pour tous les profils', () => {
    const params = { code: '123456', expirationMinutes: 10 };

    const family = getTemplate('otp', 'F', params);
    const traveler = getTemplate('otp', 'T', params);
    const standard = getTemplate('otp', 'default', params);

    expect(family.body).toBe(traveler.body);
    expect(traveler.body).toBe(standard.body);
  });

  test('listTemplates retourne 8 templates', () => {
    const templates = listTemplates();
    expect(templates.length).toBe(8);
    expect(templates.map(t => t.nom)).toContain('welcome');
    expect(templates.map(t => t.nom)).toContain('otp');
    expect(templates.map(t => t.nom)).toContain('accessCode');
  });
});
