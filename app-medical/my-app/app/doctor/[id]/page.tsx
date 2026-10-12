import type { Metadata } from 'next';
import DoctorProfileClient from './DoctorProfileClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/doctors/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const doc = await res.json();
      const name = doc?.name || 'Doctor';
      const specialty = doc?.specialty || 'Specialist';
      const rating = doc?.rating ? ` · ⭐ ${doc.rating}` : '';
      return {
        title: `${name} — ${specialty}`,
        description: `Book an appointment with ${name}, ${specialty}${rating}. View availability, fees, reviews, and clinic location on Medinex World.`,
        openGraph: {
          title: `${name} | ${specialty} on Medinex World`,
          description: `Book ${name}, ${specialty}. See fees, timings, and patient reviews.`,
          images: doc?.image ? [{ url: doc.image }] : [],
        },
      };
    }
  } catch {}
  return {
    title: 'Doctor Profile',
    description: 'View doctor profile, book appointments and read patient reviews on Medinex World.',
  };
}

export default function DoctorPage() {
  return <DoctorProfileClient />;
}
