// ============================================
// VECTRYS — Seed Guest Portal DEMO COMPLET
// Données riches pour démo complète
// Usage : node prisma/seeds/guest-portal-demo.seed.js
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Guest Portal Demo Data...\n');

  // ─── Récupérer les entités existantes ─────
  const guest = await prisma.guest.findUnique({ where: { email: 'marie.dupont@gmail.com' } });
  const property = await prisma.property.findUnique({ where: { id: 'prop-demo-001' } });
  const reservation = await prisma.reservation.findFirst({ where: { code: 'VEC-TEST01' } });

  if (!guest || !property || !reservation) {
    console.error('❌ Exécuter d\'abord: node prisma/seeds/guest-portal.seed.js');
    process.exit(1);
  }
  console.log(`✅ Guest: ${guest.email}`);
  console.log(`✅ Property: ${property.name}`);
  console.log(`✅ Reservation: ${reservation.code}\n`);

  // ─── SERVICES SUPPLÉMENTAIRES ─────────────
  const existingServices = await prisma.service.count({ where: { propertyId: property.id } });
  if (existingServices < 8) {
    const newServices = [
      { name: 'Bouteille de champagne', nameEn: 'Champagne bottle', description: 'Moët & Chandon Impérial, 75cl', category: 'MINIBAR', price: 4500, stock: 2 },
      { name: 'Plateau de fromages', nameEn: 'Cheese platter', description: 'Sélection de 5 fromages affinés', category: 'BREAKFAST', price: 1800, stock: null },
      { name: 'Bouquet de fleurs', nameEn: 'Flower bouquet', description: 'Roses fraîches du marché', category: 'OTHER', price: 3500, stock: 5 },
      { name: 'Ménage supplémentaire', nameEn: 'Extra cleaning', description: 'Nettoyage complet de l\'appartement', category: 'CLEANING', price: 4000, stock: null },
      { name: 'Pack bébé', nameEn: 'Baby kit', description: 'Lit parapluie + chaise haute + baignoire', category: 'OTHER', price: 0, stock: 1 },
      { name: 'Cours de cuisine', nameEn: 'Cooking class', description: 'Atelier pâtisserie française — 2h, à domicile', category: 'EXPERIENCE', price: 8500, stock: null },
      { name: 'Panier apéro', nameEn: 'Aperitif basket', description: 'Vin, charcuterie, olives, crackers', category: 'MINIBAR', price: 2200, stock: null },
      { name: 'Pass musées 2 jours', nameEn: '2-day museum pass', description: 'Accès illimité à 50+ musées parisiens', category: 'EXPERIENCE', price: 5200, stock: null },
    ];

    for (const service of newServices) {
      await prisma.service.create({
        data: { ...service, propertyId: property.id },
      });
    }
    console.log(`✅ ${newServices.length} services supplémentaires créés`);
  } else {
    console.log('⏭️  Services déjà existants, skip');
  }

  // ─── MESSAGES DE CHAT ─────────────────────
  const existingMessages = await prisma.guestMessage.count({ where: { reservationId: reservation.id } });
  if (existingMessages === 0) {
    const now = new Date();
    const messages = [
      { senderType: 'HOST', content: 'Bonjour Marie ! Bienvenue dans votre Studio Marais. Je suis Bastien, votre hôte. N\'hésitez pas si vous avez la moindre question ! 🏠', minutesAgo: 180 },
      { senderType: 'GUEST', content: 'Bonjour Bastien ! Merci beaucoup. L\'appartement est super. Petite question : où se trouvent les draps supplémentaires ?', minutesAgo: 170 },
      { senderType: 'HOST', content: 'Les draps et serviettes supplémentaires sont dans le placard du couloir, étagère du haut. Il y a aussi un sèche-cheveux sous le lavabo de la salle de bain 😊', minutesAgo: 165 },
      { senderType: 'GUEST', content: 'Parfait, trouvés ! Merci 👍', minutesAgo: 160 },
      { senderType: 'HOST', content: 'Je vous recommande le Marché des Enfants Rouges juste à côté (2 min à pied) pour le déjeuner. Les stands japonais et marocains sont excellents !', minutesAgo: 155 },
      { senderType: 'GUEST', content: 'Super conseil ! On va y aller. Est-ce que le parking de la rue est gratuit le dimanche ?', minutesAgo: 90 },
      { senderType: 'HOST', content: 'Oui, le stationnement est gratuit le dimanche et jours fériés à Paris. En semaine, le parking Vinci Bretagne (100m) est le plus pratique. Environ €4/heure.', minutesAgo: 85 },
      { senderType: 'GUEST', content: 'Merci pour toutes ces infos ! On adore le quartier 😍', minutesAgo: 30 },
      { senderType: 'HOST', content: 'Ravi que ça vous plaise ! N\'hésitez vraiment pas. Bon séjour à vous deux ! 🎉', minutesAgo: 25 },
    ];

    for (const msg of messages) {
      const createdAt = new Date(now.getTime() - msg.minutesAgo * 60000);
      await prisma.guestMessage.create({
        data: {
          reservationId: reservation.id,
          senderId: guest.id,
          senderType: msg.senderType,
          content: msg.content,
          readAt: msg.senderType === 'HOST' ? createdAt : null,
          createdAt,
        },
      });
    }
    console.log(`✅ ${messages.length} messages de chat créés`);
  } else {
    console.log('⏭️  Messages déjà existants, skip');
  }

  // ─── TRANSPORT POINTS SUPPLÉMENTAIRES ─────
  const existingTransport = await prisma.transportPoint.count({ where: { propertyId: property.id } });
  if (existingTransport < 8) {
    const newPoints = [
      { name: 'Gare de l\'Est', type: 'TRAIN', latitude: 48.8763, longitude: 2.3594, distanceMeters: 1500, walkMinutes: 18, transitMinutes: 8, notes: 'TGV Est, Eurostar' },
      { name: 'Gare du Nord', type: 'TRAIN', latitude: 48.8809, longitude: 2.3553, distanceMeters: 2000, walkMinutes: 24, transitMinutes: 12, notes: 'Thalys, Eurostar, RER B/D' },
      { name: 'Station Vélib\' Bretagne', type: 'BUS', latitude: 48.8633, longitude: 2.3618, distanceMeters: 30, walkMinutes: 1, notes: 'Vélos en libre-service 24h/24' },
      { name: 'CDG Airport (via RER B)', type: 'AIRPORT', latitude: 49.0097, longitude: 2.5479, distanceMeters: 25000, transitMinutes: 45, notes: 'RER B depuis Gare du Nord — €11.45' },
    ];

    for (const point of newPoints) {
      await prisma.transportPoint.create({
        data: { ...point, propertyId: property.id },
      });
    }
    console.log(`✅ ${newPoints.length} transport points supplémentaires créés`);
  } else {
    console.log('⏭️  Transport points déjà existants, skip');
  }

  // ─── COMMANDE DE DÉMO ─────────────────────
  const existingOrders = await prisma.order.count({ where: { guestId: guest.id } });
  if (existingOrders === 0) {
    const services = await prisma.service.findMany({ where: { propertyId: property.id }, take: 3 });
    if (services.length >= 2) {
      const order = await prisma.order.create({
        data: {
          reservationId: reservation.id,
          guestId: guest.id,
          totalAmount: services[0].price + services[1].price,
          status: 'CONFIRMED',
          items: {
            create: [
              { serviceId: services[0].id, quantity: 1, unitPrice: services[0].price },
              { serviceId: services[1].id, quantity: 1, unitPrice: services[1].price },
            ],
          },
        },
      });
      console.log(`✅ Commande démo créée (${(order.totalAmount / 100).toFixed(2)}€)`);
    }
  } else {
    console.log('⏭️  Commandes déjà existantes, skip');
  }

  // ─── METTRE À JOUR LA RÉSERVATION EN CHECKED_IN ─
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: 'CHECKED_IN', checkinDone: true },
  });
  console.log('✅ Reservation mise en CHECKED_IN');

  console.log('\n🎉 Seed Guest Portal Demo terminé !');
  console.log('📱 Accès : http://localhost:5175/ → Code: VEC-TEST01');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
