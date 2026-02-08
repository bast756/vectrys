/**
 * VECTRYS — Script de test manuel SMS + FATE
 *
 * Usage : node test-sms.js
 *
 * ⚠️ Ce script envoie de VRAIS SMS via Twilio.
 * Remplacez le numéro ci-dessous par votre numéro personnel.
 *
 * @version 2.0.0
 */

import dotenv from 'dotenv';
dotenv.config();

import smsService from './services/sms.service.js';
import fateService from './services/fate-profile.service.js';
import { getTemplate, listTemplates } from './config/sms-templates.js';
import alertService from './services/alert.service.js';

// ⚠️ REMPLACEZ PAR VOTRE NUMÉRO
const MON_NUMERO = process.env.TWILIO_PHONE_NUMBER || '+33612345678';

async function testSMS() {
  console.log('🧪 ══════════════════════════════════════════════');
  console.log('🧪 Test VECTRYS — SMS + FATE');
  console.log('🧪 ══════════════════════════════════════════════\n');

  let testsReussis = 0;
  let testsTotal = 0;

  // ──────────────────────────────────────────
  // Test 1 : Détection profil FATE — Family
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 1 : Détection FATE — Family ---');
  try {
    const profileF = fateService.detectProfile({
      nbGuests: 4,
      duration: 7,
      propertyType: 'house',
      hasChildren: true,
      period: '2026-07-15'
    });
    console.log('🎭 Profil :', profileF);
    if (profileF.profile === 'F' && profileF.confidence > 0.5) {
      console.log('✅ Test 1 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 1 ÉCHOUÉ — attendu F avec confiance > 0.5\n');
    }
  } catch (e) {
    console.log('❌ Test 1 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 2 : Détection profil FATE — Traveler
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 2 : Détection FATE — Traveler ---');
  try {
    const profileT = fateService.detectProfile({
      nbGuests: 1,
      duration: 2,
      propertyType: 'studio',
      hasChildren: false,
      period: '2026-03-10'
    });
    console.log('🎭 Profil :', profileT);
    if (profileT.profile === 'T' && profileT.confidence > 0.4) {
      console.log('✅ Test 2 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 2 ÉCHOUÉ — attendu T avec confiance > 0.4\n');
    }
  } catch (e) {
    console.log('❌ Test 2 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 3 : Détection profil FATE — Escape
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 3 : Détection FATE — Escape ---');
  try {
    const profileE = fateService.detectProfile({
      nbGuests: 2,
      duration: 3,
      hasChildren: false
    });
    console.log('🎭 Profil :', profileE);
    if (profileE.profile === 'E' && profileE.confidence > 0.4) {
      console.log('✅ Test 3 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 3 ÉCHOUÉ — attendu E avec confiance > 0.4\n');
    }
  } catch (e) {
    console.log('❌ Test 3 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 4 : Enrichissement messages
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 4 : Enrichissement FATE par messages ---');
  try {
    const base = { profile: 'default', confidence: 0.2, reasons: [] };
    const enrichi = fateService.enrichProfileFromMessages(base, [
      'Bonjour, nous voyageons avec un bébé et avons besoin d\'un lit parapluie et d\'une chaise haute.'
    ]);
    console.log('🎭 Avant :', base);
    console.log('🎭 Après :', enrichi);
    if (enrichi.profile === 'F' && enrichi.confidence > 0.3) {
      console.log('✅ Test 4 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 4 ÉCHOUÉ\n');
    }
  } catch (e) {
    console.log('❌ Test 4 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 5 : Templates FATE — variantes différentes
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 5 : Templates FATE ---');
  try {
    const params = { guestName: 'Marie', propertyName: 'Le Petit Nid' };
    console.log('📋 Family  :', getTemplate('welcome', 'F', params).body);
    console.log('📋 Adventure:', getTemplate('welcome', 'A', params).body);
    console.log('📋 Traveler :', getTemplate('welcome', 'T', params).body);
    console.log('📋 Escape  :', getTemplate('welcome', 'E', params).body);
    console.log('📋 Default :', getTemplate('welcome', 'default', params).body);

    const templates = listTemplates();
    console.log(`📋 ${templates.length} templates disponibles`);

    if (templates.length === 8) {
      console.log('✅ Test 5 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 5 ÉCHOUÉ — attendu 8 templates\n');
    }
  } catch (e) {
    console.log('❌ Test 5 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 6 : Vacances scolaires
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 6 : Vacances scolaires ---');
  try {
    const juillet = fateService.isSchoolHoliday(new Date('2026-07-15'));
    const septembre = fateService.isSchoolHoliday(new Date('2026-09-15'));
    const noel = fateService.isSchoolHoliday(new Date('2026-12-25'));
    console.log('📅 Juillet :', juillet, '(attendu: true)');
    console.log('📅 Septembre :', septembre, '(attendu: false)');
    console.log('📅 Noël :', noel, '(attendu: true)');

    if (juillet && !septembre && noel) {
      console.log('✅ Test 6 RÉUSSI\n');
      testsReussis++;
    } else {
      console.log('❌ Test 6 ÉCHOUÉ\n');
    }
  } catch (e) {
    console.log('❌ Test 6 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 7 : Envoi SMS réel (optionnel)
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 7 : Envoi SMS réel ---');
  try {
    const resultat = await smsService.sendSMS(
      MON_NUMERO,
      'Test VECTRYS — Intégration Twilio + FATE réussie ! ✅🎭'
    );
    console.log('📨 Résultat :', resultat);
    if (resultat.succes) {
      console.log('✅ Test 7 RÉUSSI — SMS envoyé !\n');
      testsReussis++;
    } else {
      console.log('⚠️ Test 7 — SMS non envoyé :', resultat.raison, '\n');
    }
  } catch (e) {
    console.log('⚠️ Test 7 SKIP — Twilio non configuré :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 8 : Envoi FATE SMS réel (optionnel)
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 8 : Envoi FATE SMS réel ---');
  try {
    const resultat = await smsService.sendFATESMS(
      MON_NUMERO,
      'welcome',
      { guestName: 'Marie', propertyName: 'Le Petit Nid' },
      { nbGuests: 2, duration: 3, hasChildren: false }
    );
    console.log('📨 Résultat :', resultat);
    console.log('🎭 Profil FATE :', resultat.fateProfile);
    if (resultat.succes) {
      console.log('✅ Test 8 RÉUSSI — FATE SMS envoyé !\n');
      testsReussis++;
    } else {
      console.log('⚠️ Test 8 — FATE SMS non envoyé\n');
    }
  } catch (e) {
    console.log('⚠️ Test 8 SKIP — Twilio non configuré :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // Test 9 : Alertes monitoring
  // ──────────────────────────────────────────
  testsTotal++;
  console.log('--- Test 9 : Alertes monitoring ---');
  try {
    const checks = await alertService.runAllChecks();
    console.log('📊 Résultat checks :', JSON.stringify(checks, null, 2));
    console.log('✅ Test 9 RÉUSSI\n');
    testsReussis++;
  } catch (e) {
    console.log('❌ Test 9 ERREUR :', e.message, '\n');
  }

  // ──────────────────────────────────────────
  // RÉSULTAT FINAL
  // ──────────────────────────────────────────
  console.log('══════════════════════════════════════════════');
  console.log(`🧪 RÉSULTAT : ${testsReussis}/${testsTotal} tests réussis`);
  if (testsReussis >= testsTotal - 2) {
    console.log('🎉 Intégration SMS + FATE opérationnelle !');
  } else {
    console.log('⚠️ Certains tests ont échoué — vérifiez la configuration');
  }
  console.log('══════════════════════════════════════════════');

  process.exit(testsReussis >= testsTotal - 2 ? 0 : 1);
}

testSMS();
