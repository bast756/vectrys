import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMissions() {
  console.log('🌱 Seeding missions...');

  // Create test missions for Maria Silva (h1)
  const missions = [
    {
      housekeeper_id: 'h1',
      status: 'assigned',
      mission_type: 'checkout',
      property: {
        id: 'prop1',
        name: 'Appartement Centre-Ville',
        address: '15 Rue de la Paix',
        city: 'Paris',
        postalCode: '75002',
        coordinates: { lat: 48.8698, lng: 2.3315 }
      },
      scheduled_date: new Date(),
      scheduled_start_time: '10:00',
      estimated_duration_min: 120,
      access_code: '1234',
      access_instructions: 'Code à composer sur le digicode à l\'entrée',
      smoking_policy: 'non_smoking',
      expected_occupancy: 'empty',
      instructions: 'Check-out complet. Bien aérer les pièces.',
      manager_notes: 'Client régulier, attention aux détails.',
      tasks: [
        { id: 't1', label: 'Chambre: Changer les draps', category: 'bedroom', isPriority: true, estimatedMinutes: 15 },
        { id: 't2', label: 'Chambre: Passer l\'aspirateur', category: 'bedroom', isPriority: false, estimatedMinutes: 10 },
        { id: 't3', label: 'Salle de bain: Nettoyer la douche', category: 'bathroom', isPriority: true, estimatedMinutes: 20 },
        { id: 't4', label: 'Cuisine: Nettoyer le four', category: 'kitchen', isPriority: false, estimatedMinutes: 30 },
        { id: 't5', label: 'Salon: Dépoussiérer', category: 'living', isPriority: false, estimatedMinutes: 15 }
      ]
    },
    {
      housekeeper_id: 'h1',
      status: 'pending',
      mission_type: 'deep_clean',
      property: {
        id: 'prop2',
        name: 'Villa Montmartre',
        address: '42 Avenue de la République',
        city: 'Paris',
        postalCode: '75018',
        coordinates: { lat: 48.8927, lng: 2.3662 }
      },
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduled_start_time: '14:00',
      estimated_duration_min: 180,
      access_code: '5678',
      smoking_policy: 'non_smoking',
      expected_occupancy: 'owner_present',
      instructions: 'Grand nettoyage de printemps. Propriétaire sera présent.',
      tasks: [
        { id: 't1', label: 'Toutes les pièces: Nettoyage complet', isPriority: true, estimatedMinutes: 180 }
      ]
    },
    {
      housekeeper_id: 'h1',
      status: 'in_progress',
      mission_type: 'checkin',
      property: {
        id: 'prop3',
        name: 'Studio Marais',
        address: '8 Rue des Archives',
        city: 'Paris',
        postalCode: '75004',
        coordinates: { lat: 48.8592, lng: 2.3585 }
      },
      scheduled_date: new Date(),
      scheduled_start_time: '16:00',
      estimated_duration_min: 60,
      access_code: '9012',
      smoking_policy: 'non_smoking',
      expected_occupancy: 'empty',
      instructions: 'Préparer pour l\'arrivée du client ce soir.',
      tasks: [
        { id: 't1', label: 'Vérifier l\'état général', isPriority: true, estimatedMinutes: 20, completedAt: new Date() },
        { id: 't2', label: 'Ajouter produits d\'accueil', isPriority: true, estimatedMinutes: 10, completedAt: new Date() },
        { id: 't3', label: 'Vérifier équipements', isPriority: false, estimatedMinutes: 15 }
      ]
    }
  ];

  for (const missionData of missions) {
    await prisma.mission.create({ data: missionData });
    console.log(`✅ Mission created: ${missionData.property.name}`);
  }

  console.log('✅ Missions seeding complete!');
}

seedMissions()
  .catch((e) => {
    console.error('❌ Error seeding missions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
