import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    photos: ['https://images.unsplash.com/photo-1586773860418-d319a39005c0?auto=format&fit=crop&q=80&w=1000'],
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

export async function GET() {
  try {
    const created = [];
    for (const hospital of SAMPLE_HOSPITALS) {
      const existing = await prisma.hospital.findFirst({
        where: { name: hospital.name },
      });
      if (!existing) {
        const h = await prisma.hospital.create({ data: hospital });
        created.push(h);
      } else {
        created.push(existing);
      }
    }

    return NextResponse.json({
      message: `Successfully seeded ${created.length} hospitals`,
      hospitals: created.map(h => ({ ...h, _id: h.id })),
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
