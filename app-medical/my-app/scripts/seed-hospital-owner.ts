import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function seedHospitalOwner() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create or update hospital@medinex.in
  const owner1 = await prisma.user.upsert({
    where: { email: 'hospital@medinex.in' },
    update: {
      password: hashedPassword,
      role: 'hospital_owner',
      isEmailVerified: true,
    },
    create: {
      name: 'City General Medical Director',
      email: 'hospital@medinex.in',
      phone: '+91 98765 43210',
      password: hashedPassword,
      role: 'hospital_owner',
      isEmailVerified: true,
    },
  });

  // 2. Also create owner@cityhospital.com for legacy support
  const owner2 = await prisma.user.upsert({
    where: { email: 'owner@cityhospital.com' },
    update: {
      password: hashedPassword,
      role: 'hospital_owner',
      isEmailVerified: true,
    },
    create: {
      name: 'City Hospital Admin',
      email: 'owner@cityhospital.com',
      phone: '+91 98765 43211',
      password: hashedPassword,
      role: 'hospital_owner',
      isEmailVerified: true,
    },
  });

  // 3. Assign City General Hospital to hospital@medinex.in
  const hospital = await prisma.hospital.findFirst({
    where: { name: { contains: 'City General' } },
  });

  if (hospital) {
    await prisma.hospital.update({
      where: { id: hospital.id },
      data: { ownerId: owner1.id },
    });
    console.log(`Assigned hospital "${hospital.name}" (ID ${hospital.id}) to owner "${owner1.email}" (ID ${owner1.id})`);
  } else {
    // If no hospital exists, create one
    const newHospital = await prisma.hospital.create({
      data: {
        name: 'City General Hospital',
        nameHi: 'सिटी जनरल हॉस्पिटल',
        type: 'Multispecialty Hospital',
        phone: '+91 98765 43210',
        email: 'hospital@medinex.in',
        address: '124 Healthcare Boulevard, Central District',
        ownerId: owner1.id,
        rating: 4.8,
        reviewCount: 142,
        facilities: ['24/7 Emergency', 'ICU & CCU', 'Digital Radiology', 'In-house Pharmacy', 'Pathology Lab'],
        departments: ['Cardiology', 'Neurology', 'Pediatrics', 'General Surgery', 'Orthopedics'],
        photos: ['/images/modern_hospital_care.jpg'],
      },
    });
    console.log(`Created new hospital "${newHospital.name}" assigned to "${owner1.email}"`);
  }

  console.log('Hospital owner seed completed successfully!');
}

seedHospitalOwner()
  .catch((err) => {
    console.error('Error seeding hospital owner:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
