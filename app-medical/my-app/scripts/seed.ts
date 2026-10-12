import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DOCTORS_SEED = [
  { name: "Dr. Sarah Jenkins",  email: "doctor1@nbms.in",  specialty: "General Physician", qual: "MBBS, MD",       exp: "12 years", rating: 4.8, reviews: 142, fee: 500,  videoFee: 300,  distance: 1.2, locationLat: 23.4155, locationLng: 88.5060, image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",   about: "Dr. Sarah is a highly experienced General Physician dedicated to providing comprehensive healthcare.",               address: "123 Health Ave, Medical District, Krishnanagar",   slots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"]   },
  { name: "Dr. Rajesh Kumar",   email: "doctor2@nbms.in",  specialty: "Cardiologist",     qual: "MBBS, MD, DM",   exp: "15 years", rating: 4.9, reviews: 218, fee: 1200, videoFee: 800,  distance: 3.5, locationLat: 23.3720, locationLng: 88.5150, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",  about: "Specializes in heart diseases and cardiovascular health with state-of-the-art diagnostic approaches.",             address: "Heart Care Clinic, West Wing, Nabadwip",           slots: ["09:00 AM", "01:00 PM", "05:00 PM"]                },
  { name: "Dr. Emily Chen",     email: "doctor3@nbms.in",  specialty: "Dermatologist",    qual: "MBBS, DDVL",     exp: "8 years",  rating: 4.6, reviews: 96,  fee: 800,  videoFee: 500,  distance: 2.1, locationLat: 23.3890, locationLng: 88.4800, image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",   about: "Expert in skin, hair, and nail conditions. Offers both clinical and cosmetic dermatological treatments.",          address: "SkinGlow Clinic, Downtown, Ranaghat",              slots: ["11:00 AM", "03:00 PM", "06:00 PM"]                },
  { name: "Dr. Michael Brown",  email: "doctor4@nbms.in",  specialty: "ENT Specialist",   qual: "MBBS, MS",       exp: "10 years", rating: 4.7, reviews: 110, fee: 700,  videoFee: 450,  distance: 5.0, locationLat: 23.3490, locationLng: 88.5400, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300", about: "Ear, Nose, and Throat specialist providing advanced care for sinus, hearing, and throat issues.",                 address: "ClearENT Hospital, North Side, Kalyani",           slots: ["09:30 AM", "12:00 PM", "04:30 PM"]                },
  { name: "Dr. Anita Desai",    email: "doctor5@nbms.in",  specialty: "Pediatrician",     qual: "MBBS, MD",       exp: "14 years", rating: 4.9, reviews: 185, fee: 600,  videoFee: 400,  distance: 0.8, locationLat: 23.4090, locationLng: 88.5020, image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300&h=300",   about: "Compassionate pediatrician ensuring the holistic health and development of infants and children.",                address: "Little Steps Clinic, Near Park, Krishnanagar",     slots: ["10:00 AM", "12:30 PM", "05:00 PM"]                },
  { name: "Dr. James Wilson",   email: "doctor6@nbms.in",  specialty: "Orthopedic",       qual: "MBBS, MS",       exp: "18 years", rating: 4.8, reviews: 164, fee: 1000, videoFee: 600,  distance: 4.2, locationLat: 23.3610, locationLng: 88.4700, image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300&h=300",   about: "Specialist in bone and joint care, sports injuries, and joint replacement surgeries.",                           address: "Bone & Joint Center, Chakdaha",                   slots: ["08:00 AM", "02:00 PM", "07:00 PM"]                },
  { name: "Dr. Priya Sharma",   email: "doctor7@nbms.in",  specialty: "Gynecologist",     qual: "MBBS, MS, DNB",  exp: "11 years", rating: 4.9, reviews: 204, fee: 900,  videoFee: 600,  distance: 2.8, locationLat: 23.3800, locationLng: 88.5220, image: "/images/doctor_priya_clinic.jpg",                                     about: "Dedicated to women's health, pregnancy care, and reproductive well-being.",                                      address: "Women's Health Clinic, East Wing, Santipur",       slots: ["10:30 AM", "01:30 PM", "05:30 PM"]                },
  { name: "Dr. Alok Verma",     email: "doctor8@nbms.in",  specialty: "Neurologist",      qual: "MBBS, MD, DM",   exp: "20 years", rating: 4.7, reviews: 156, fee: 1500, videoFee: 1000, distance: 6.5, locationLat: 23.3280, locationLng: 88.5600, image: "/images/dr_alok_verma.jpg",                                         about: "Expert in brain and nervous system disorders. Specialized in stroke and migraine treatments.",                   address: "NeuroCare Hospital, Berhampore Road",              slots: ["09:00 AM", "11:00 AM"]                            },
  { name: "Dr. Neha Gupta",     email: "doctor9@nbms.in",  specialty: "Dentist",          qual: "BDS, MDS",       exp: "7 years",  rating: 4.5, reviews: 88,  fee: 400,  videoFee: 250,  distance: 1.5, locationLat: 23.4000, locationLng: 88.4900, image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=300&h=300",    about: "Comprehensive dental care, from routine cleanings to advanced root canal treatments.",                           address: "Smile Dental Clinic, Station Road, Krishnanagar", slots: ["10:00 AM", "12:00 PM", "04:00 PM", "06:00 PM"]    },
  { name: "Dr. Rohan Das",      email: "doctor10@nbms.in", specialty: "Psychiatrist",     qual: "MBBS, MD",       exp: "9 years",  rating: 4.8, reviews: 112, fee: 1000, videoFee: 800,  distance: 3.0, locationLat: 23.3750, locationLng: 88.4950, image: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=300&h=300",   about: "Mental health specialist focusing on anxiety, depression, and holistic psychological well-being.",               address: "Mind Wellness Center, College Road, Krishnanagar", slots: ["11:00 AM", "03:00 PM", "07:00 PM"]                },
];

async function seed() {
  console.log('Connecting to MySQL database via Prisma...');

  // Seed Admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nbms.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password12';
  const adminHashedPw = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminHashedPw, role: 'admin' },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      phone: '+91 99999 99999',
      password: adminHashedPw,
      role: 'admin',
      isEmailVerified: true,
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@medinexworld.com' },
    update: { password: adminHashedPw, role: 'admin' },
    create: {
      name: 'Super Admin',
      email: 'admin@medinexworld.com',
      phone: '+91 99999 99999',
      password: adminHashedPw,
      role: 'admin',
      isEmailVerified: true,
    },
  });
  console.log(`👤 Admin verified/created: ${adminEmail} & admin@medinexworld.com`);

  // Seed demo patient
  const hashedPw = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@nbms.in' },
    update: { password: hashedPw, role: 'patient' },
    create: {
      name: 'Rahul Sharma',
      email: 'demo@nbms.in',
      phone: '+91 98765 43210',
      password: hashedPw,
      role: 'patient',
      isEmailVerified: true,
    },
  });
  console.log('👤 Demo patient created: demo@nbms.in / password123');

  // Seed doctors
  const doctorPw = await bcrypt.hash('password123', 10);
  for (const doc of DOCTORS_SEED) {
    await prisma.doctor.upsert({
      where: { email: doc.email },
      update: {
        ...doc,
        password: doctorPw,
        isVerified: true,
      },
      create: {
        ...doc,
        password: doctorPw,
        isVerified: true,
      },
    });
  }
  console.log(`🩺 ${DOCTORS_SEED.length} doctors seeded/updated`);

  // Seed sample hospitals
  const SAMPLE_HOSPITALS = [
    {
      name: 'City General Hospital',
      nameHi: 'सिटी जनरल अस्पताल',
      type: 'private',
      phone: '011-23456789',
      email: 'info@citygeneral.com',
      address: '123 Health Street, New Delhi, Delhi 110001',
      addressHi: '123 हेल्थ स्ट्रीट, नई दिल्ली, दिल्ली 110001',
      locationLat: 28.6139,
      locationLng: 77.2090,
      facilities: ['24/7 Emergency', 'ICU', 'Pharmacy', 'Blood Bank', 'Ambulance'],
      departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'],
      photos: ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000'],
      labServices: [
        { name: 'Blood Test', price: 500, description: 'Complete blood count and basic metabolic panel' },
        { name: 'X-Ray', price: 800, description: 'Chest or limb X-ray' }
      ],
      surgeryServices: [
        { name: 'Appendectomy', priceRange: '₹30,000 - ₹50,000', description: 'Emergency appendix removal' },
        { name: 'Cataract Surgery', priceRange: '₹15,000 - ₹40,000', description: 'Advanced eye surgery' }
      ],
      medicineShop: true,
      medicineDelivery: true,
      about: 'City General Hospital is a leading multi-specialty healthcare provider dedicated to delivering world-class medical services.',
      aboutHi: 'सिटी जनरल अस्पताल एक अग्रणी मल्टी-स्पेशियलिटी स्वास्थ्य सेवा प्रदाता है जो विश्व स्तरीय चिकित्सा सेवाएं प्रदान करने के लिए समर्पित है।',
      rating: 4.5,
      reviewCount: 120,
      isActive: true
    },
    {
      name: "St. Mary's Children Hospital",
      nameHi: 'सेंट मैरी चिल्ड्रन हॉस्पिटल',
      type: 'private',
      phone: '011-98765432',
      email: 'contact@stmarys.com',
      address: '45 Care Road, Saket, New Delhi 110017',
      addressHi: '45 केयर रोड, साकेत, नई दिल्ली 110017',
      locationLat: 28.5244,
      locationLng: 77.2167,
      facilities: ['Pediatric ICU', 'Neonatal Care', 'Child Play Area', 'Vaccination Center'],
      departments: ['Pediatrics', 'Child Psychology', 'Pediatric Surgery', 'Nutrition'],
      photos: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000'],
      labServices: [
        { name: 'Pediatric Blood Panel', price: 600, description: 'Child-specific blood testing' }
      ],
      surgeryServices: [
        { name: 'Pediatric Hernia Repair', priceRange: '₹25,000 - ₹45,000', description: 'Safe surgery for children' }
      ],
      medicineShop: true,
      medicineDelivery: false,
      about: 'Specialized care for children from birth to adolescence with a child-friendly environment.',
      aboutHi: 'जन्म से लेकर किशोरावस्था तक के बच्चों के लिए विशेष देखभाल और बच्चों के अनुकूल वातावरण।',
      rating: 4.8,
      reviewCount: 85,
      isActive: true
    },
    {
      name: 'Government District Hospital',
      nameHi: 'सरकारी जिला अस्पताल',
      type: 'government',
      phone: '011-11223344',
      email: 'admin@districthospital.gov.in',
      address: 'Main Market Road, Noida, Uttar Pradesh 201301',
      addressHi: 'मेन मार्केट रोड, नोएडा, उत्तर प्रदेश 201301',
      locationLat: 28.5355,
      locationLng: 77.3910,
      facilities: ['OPD Services', 'Free Medicine', 'Government Schemes', 'Maternity Ward'],
      departments: ['General Medicine', 'Maternity', 'Emergency', 'Dental'],
      photos: ['https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000'],
      labServices: [
        { name: 'Basic Lab Tests', price: 0, description: 'Free for residents' }
      ],
      surgeryServices: [
        { name: 'General Surgery', priceRange: 'Free/Subsidized', description: 'Government funded surgeries' }
      ],
      medicineShop: true,
      medicineDelivery: false,
      about: 'Providing affordable and accessible healthcare services to the local community under government initiatives.',
      aboutHi: 'सरकारी पहल के तहत स्थानीय समुदाय को सस्ती और सुलभ स्वास्थ्य सेवाएं प्रदान करना।',
      rating: 3.9,
      reviewCount: 250,
      isActive: true
    }
  ];

  for (const hospital of SAMPLE_HOSPITALS) {
    const existing = await prisma.hospital.findFirst({
      where: { name: hospital.name },
    });
    if (!existing) {
      await prisma.hospital.create({ data: hospital });
    }
  }
  console.log(`🏥 Sample hospitals verified/seeded`);

  // Seed default platform settings
  const existingSettings = await prisma.platformSettings.findFirst();
  if (!existingSettings) {
    await prisma.platformSettings.create({
      data: {
        gstPercent: 0,
        discountAmount: 0,
        defaultPlatformFeePercent: 10,
      },
    });
    console.log('⚙️ Platform settings initialized');
  }

  console.log('\n✅ MySQL Seed complete!');
  console.log('   Admin:   ' + adminEmail + ' / ' + adminPassword + ' (or password123)');
  console.log('   Patient: demo@nbms.in / password123');
  console.log('   Doctor:  doctor1@nbms.in / password123 (through doctor10@nbms.in)');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
