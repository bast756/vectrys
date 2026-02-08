import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed test missions for testing Agent de Terrain module
 */
async function seedTestMissions() {
  console.log('🧪 Seeding test missions...');

  // Get Maria Silva (h1)
  const maria = await prisma.housekeeper.findUnique({
    where: { id: 'h1' }
  });

  if (!maria) {
    console.error('❌ Housekeeper h1 (Maria) not found. Run main seed first.');
    return;
  }

  // Get manager (m1)
  const manager = await prisma.manager.findUnique({
    where: { id: 'm1' }
  });

  if (!manager) {
    console.error('❌ Manager m1 not found. Run main seed first.');
    return;
  }

  // Create 3 test properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        id: 'prop_test_1',
        name: 'Hôtel Paris Centre - Chambre 301',
        address: '15 Rue de Rivoli',
        city: 'Paris',
        postalCode: '75001',
        coordinates: {
          lat: 48.8566,
          lng: 2.3522
        },
        qr_code_data: JSON.stringify({
          type: 'property',
          property_id: 'prop_test_1',
          property_name: 'Hôtel Paris Centre - Chambre 301',
          address: '15 Rue de Rivoli',
          generated_at: new Date().toISOString()
        })
      }
    }),
    prisma.property.create({
      data: {
        id: 'prop_test_2',
        name: 'Résidence Les Lilas - Apt 42',
        address: '8 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        coordinates: {
          lat: 48.8698,
          lng: 2.3078
        },
        qr_code_data: JSON.stringify({
          type: 'property',
          property_id: 'prop_test_2',
          property_name: 'Résidence Les Lilas - Apt 42',
          address: '8 Avenue des Champs-Élysées',
          generated_at: new Date().toISOString()
        })
      }
    }),
    prisma.property.create({
      data: {
        id: 'prop_test_3',
        name: 'Villa Montmartre',
        address: '22 Rue Lepic',
        city: 'Paris',
        postalCode: '75018',
        coordinates: {
          lat: 48.8867,
          lng: 2.3333
        },
        qr_code_data: JSON.stringify({
          type: 'property',
          property_id: 'prop_test_3',
          property_name: 'Villa Montmartre',
          address: '22 Rue Lepic',
          generated_at: new Date().toISOString()
        })
      }
    })
  ]);

  console.log(`✅ Created ${properties.length} test properties`);

  // Create test missions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missions = await Promise.all([
    // Mission 1: ASSIGNED (ready to start)
    prisma.mission.create({
      data: {
        id: 'mission_test_1',
        housekeeper_id: maria.id,
        property_id: properties[0].id,
        manager_id: manager.id,
        mission_type: 'checkout',
        status: 'assigned',
        scheduled_date: today,
        scheduled_start_time: '09:00',
        scheduled_end_time: '11:00',
        estimated_duration_min: 120,
        access_code: '1234',
        access_instructions: 'Code d\'accès à l\'entrée principale, puis ascenseur à droite.',
        instructions: 'Nettoyage après départ client. Vérifier minibar et serviettes.',
        smoking_policy: 'non_smoking',
        expected_occupancy: 'empty',
        tasks: [
          { id: 't1', label: 'Faire le lit', isPriority: true, estimatedMinutes: 15 },
          { id: 't2', label: 'Nettoyer salle de bain', isPriority: true, estimatedMinutes: 30 },
          { id: 't3', label: 'Passer l\'aspirateur', isPriority: false, estimatedMinutes: 20 },
          { id: 't4', label: 'Vider poubelles', isPriority: false, estimatedMinutes: 10 },
          { id: 't5', label: 'Réapprovisionner minibar', isPriority: true, estimatedMinutes: 15 }
        ]
      }
    }),

    // Mission 2: IN_PROGRESS (currently working)
    prisma.mission.create({
      data: {
        id: 'mission_test_2',
        housekeeper_id: maria.id,
        property_id: properties[1].id,
        manager_id: manager.id,
        mission_type: 'deep_clean',
        status: 'in_progress',
        scheduled_date: today,
        scheduled_start_time: '14:00',
        scheduled_end_time: '17:00',
        estimated_duration_min: 180,
        access_code: '5678',
        access_instructions: 'Clé disponible à la réception.',
        instructions: 'Grand nettoyage complet. Attention aux objets de valeur.',
        smoking_policy: 'non_smoking',
        expected_occupancy: 'guest_may_return',
        occupancy_note: 'Client peut revenir vers 18h',
        tasks: [
          { id: 't1', label: 'Nettoyer cuisine à fond', isPriority: true, estimatedMinutes: 45, completedAt: new Date().toISOString() },
          { id: 't2', label: 'Laver vitres', isPriority: false, estimatedMinutes: 30, completedAt: new Date().toISOString() },
          { id: 't3', label: 'Désinfecter surfaces', isPriority: true, estimatedMinutes: 40 },
          { id: 't4', label: 'Nettoyer appareils ménagers', isPriority: false, estimatedMinutes: 35 }
        ]
      }
    }),

    // Mission 3: COMPLETED (finished today)
    prisma.mission.create({
      data: {
        id: 'mission_test_3',
        housekeeper_id: maria.id,
        property_id: properties[2].id,
        manager_id: manager.id,
        mission_type: 'checkin',
        status: 'completed',
        scheduled_date: today,
        scheduled_start_time: '08:00',
        scheduled_end_time: '10:00',
        estimated_duration_min: 120,
        access_code: '9999',
        instructions: 'Préparation pour arrivée client VIP. Tout doit être parfait.',
        smoking_policy: 'non_smoking',
        expected_occupancy: 'empty',
        tasks: [
          { id: 't1', label: 'Préparer chambre', isPriority: true, estimatedMinutes: 30, completedAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 't2', label: 'Disposer fleurs', isPriority: false, estimatedMinutes: 10, completedAt: new Date(Date.now() - 3000000).toISOString() },
          { id: 't3', label: 'Vérifier équipements', isPriority: true, estimatedMinutes: 20, completedAt: new Date(Date.now() - 2400000).toISOString() }
        ]
      }
    })
  ]);

  console.log(`✅ Created ${missions.length} test missions`);

  // Create check-in/out for mission 2 (in_progress)
  const checkinTime = new Date();
  checkinTime.setHours(14, 5, 0, 0);

  await prisma.pointage.create({
    data: {
      id: 'pointage_test_1',
      mission_id: missions[1].id,
      housekeeper_id: maria.id,
      type: 'checkin',
      method: 'qr',
      timestamp: checkinTime,
      gps_position: {
        lat: 48.8698,
        lng: 2.3078,
        accuracy: 12.5
      },
      device_id: 'device_maria_iphone',
      is_valid: true
    }
  });

  console.log('✅ Created test check-in pointage');

  // Create check-in/out for mission 3 (completed)
  const mission3CheckinTime = new Date();
  mission3CheckinTime.setHours(8, 2, 0, 0);
  const mission3CheckoutTime = new Date();
  mission3CheckoutTime.setHours(9, 58, 0, 0);

  await Promise.all([
    prisma.pointage.create({
      data: {
        id: 'pointage_test_2',
        mission_id: missions[2].id,
        housekeeper_id: maria.id,
        type: 'checkin',
        method: 'qr',
        timestamp: mission3CheckinTime,
        gps_position: {
          lat: 48.8867,
          lng: 2.3333,
          accuracy: 8.2
        },
        device_id: 'device_maria_iphone',
        is_valid: true
      }
    }),
    prisma.pointage.create({
      data: {
        id: 'pointage_test_3',
        mission_id: missions[2].id,
        housekeeper_id: maria.id,
        type: 'checkout',
        method: 'qr',
        timestamp: mission3CheckoutTime,
        gps_position: {
          lat: 48.8867,
          lng: 2.3333,
          accuracy: 10.1
        },
        device_id: 'device_maria_iphone',
        is_valid: true
      }
    })
  ]);

  console.log('✅ Created test check-in/out pointages for completed mission');

  console.log('\n🎉 Test missions seed completed!');
  console.log('\n📋 Test Data Summary:');
  console.log('  - 3 properties created');
  console.log('  - 3 missions created:');
  console.log('    1. mission_test_1: ASSIGNED (ready to start)');
  console.log('    2. mission_test_2: IN_PROGRESS (currently working)');
  console.log('    3. mission_test_3: COMPLETED (finished)');
  console.log('\n🧪 Ready for testing!\n');
}

seedTestMissions()
  .catch((e) => {
    console.error('❌ Error seeding test missions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
