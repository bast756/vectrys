// ============================================================================
// VECTRYS — Seed CEO Account
// Run: node prisma/seed-ceo.js
// ============================================================================

import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function seedCEO() {
  const matricule = 'VEC-001';
  const password = 'Vectrys2026!';

  const existing = await prisma.employee.findUnique({ where: { matricule } });
  if (existing) {
    console.log(`CEO account already exists: ${existing.matricule} (${existing.email})`);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const ceo = await prisma.employee.create({
    data: {
      matricule,
      first_name: 'Bastien',
      last_name: 'CEO',
      email: 'ceo@vectrys.fr',
      password_hash,
      role: 'ceo',
      active: true,
    },
  });

  console.log('CEO account created successfully!');
  console.log('================================');
  console.log(`Matricule: ${matricule}`);
  console.log(`Password:  ${password}`);
  console.log(`Role:      ceo`);
  console.log(`ID:        ${ceo.id}`);
  console.log('================================');
  console.log('Login at: http://localhost:5173/employee/login');

  process.exit(0);
}

seedCEO().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
