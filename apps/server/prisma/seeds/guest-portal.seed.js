// ============================================
// VECTRYS — Seed Guest Portal V5
// Données de test pour le développement
// Usage : node prisma/seeds/guest-portal.seed.js
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Guest Portal...');

  // ─── Owner ─────────────────────────────────
  const owner = await prisma.owner.upsert({
    where: { email: 'bastien@vectrys.com' },
    update: {},
    create: {
      email: 'bastien@vectrys.com',
      firstName: 'Bastien',
      lastName: 'Admin',
      company: 'VECTRYS',
    },
  });
  console.log('✅ Owner créé:', owner.email);

  // ─── Property ──────────────────────────────
  const property = await prisma.property.upsert({
    where: { id: 'prop-demo-001' },
    update: {},
    create: {
      id: 'prop-demo-001',
      name: 'Studio Marais — Paris 3e',
      address: '15 Rue de Bretagne, 75003 Paris',
      city: 'Paris',
      zipCode: '75003',
      country: 'FR',
      latitude: 48.8631,
      longitude: 2.3622,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      wifiName: 'Marais-Guest',
      wifiPassword: 'Welcome2025!',
      houseRules: {
        maxGuests: 4,
        noSmoking: true,
        noPets: false,
        quietHours: '22:00-08:00',
        rules: [
          'Pas de fêtes ni événements',
          'Respecter le voisinage',
          'Éteindre les lumières en partant',
        ],
      },
      cameras: {
        hasExteriorCameras: true,
        description: "Caméra à l'entrée de l'immeuble (parties communes)",
      },
      pets: null,
      alarms: null,
      imageUrls: [],
      ownerId: owner.id,
    },
  });
  console.log('✅ Property créée:', property.name);

  // ─── Guest ─────────────────────────────────
  const guest = await prisma.guest.upsert({
    where: { email: 'marie.dupont@gmail.com' },
    update: {},
    create: {
      email: 'marie.dupont@gmail.com',
      firstName: 'Marie',
      lastName: 'Dupont',
      language: 'fr',
      authProvider: 'EMAIL_MAGIC_LINK',
      legalAcceptedAt: new Date(),
    },
  });
  console.log('✅ Guest créé:', guest.email);

  // ─── Reservation ───────────────────────────
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1); // demain
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3); // +3 nuits

  const reservation = await prisma.reservation.upsert({
    where: { code: 'VEC-TEST01' },
    update: {},
    create: {
      code: 'VEC-TEST01',
      guestId: guest.id,
      propertyId: property.id,
      checkIn,
      checkOut,
      guestCount: 2,
      status: 'CONFIRMED',
      source: 'Airbnb',
    },
  });
  console.log('✅ Reservation créée:', reservation.code);

  // ─── Checklist Items ───────────────────────
  const checklistItems = [
    { label: 'Éteindre toutes les lumières', labelEn: 'Turn off all lights', order: 1 },
    { label: 'Fermer les fenêtres', labelEn: 'Close all windows', order: 2 },
    { label: 'Sortir les poubelles', labelEn: 'Take out the trash', order: 3 },
    { label: 'Lancer un cycle de machine à laver (draps)', labelEn: 'Start washing machine (sheets)', order: 4 },
    { label: 'Vérifier que le four est éteint', labelEn: 'Check oven is off', order: 5 },
    { label: 'Remettre les clés dans la boîte à clés', labelEn: 'Return keys to lockbox', order: 6, required: true },
  ];

  for (const item of checklistItems) {
    await prisma.checklistItem.create({
      data: { ...item, propertyId: property.id },
    });
  }
  console.log(`✅ ${checklistItems.length} checklist items créés`);

  // ─── Services ──────────────────────────────
  const services = [
    { name: 'Bouteille de vin rouge', nameEn: 'Red wine bottle', category: 'MINIBAR', price: 1500, stock: 3 },
    { name: 'Pack petit-déjeuner', nameEn: 'Breakfast pack', category: 'BREAKFAST', price: 1200, stock: null },
    { name: 'Late check-out (14h)', nameEn: 'Late checkout (2pm)', category: 'OTHER', price: 2500, stock: 1 },
    { name: 'Transfert aéroport CDG', nameEn: 'CDG airport transfer', category: 'TRANSPORT', price: 6500, stock: null },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: { ...service, propertyId: property.id },
    });
  }
  console.log(`✅ ${services.length} services créés`);

  // ─── Transport Points ──────────────────────
  const transportPoints = [
    { name: 'Temple (Ligne 3)', type: 'METRO', latitude: 48.8662, longitude: 2.3619, distanceMeters: 350, walkMinutes: 4 },
    { name: 'Arts et Métiers (Lignes 3, 11)', type: 'METRO', latitude: 48.8653, longitude: 2.3560, distanceMeters: 500, walkMinutes: 6 },
    { name: 'Franprix Bretagne', type: 'SUPERMARKET', latitude: 48.8628, longitude: 2.3615, distanceMeters: 50, walkMinutes: 1 },
    { name: 'Pharmacie du Marais', type: 'PHARMACY', latitude: 48.8635, longitude: 2.3631, distanceMeters: 120, walkMinutes: 2 },
  ];

  for (const point of transportPoints) {
    await prisma.transportPoint.create({
      data: { ...point, propertyId: property.id },
    });
  }
  console.log(`✅ ${transportPoints.length} transport points créés`);

  console.log('\n🎉 Seed Guest Portal terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
