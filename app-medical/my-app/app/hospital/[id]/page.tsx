import type { Metadata } from 'next';
import { HospitalDetailClient } from './HospitalDetailClient';

export const metadata: Metadata = {
  title: 'Hospital Details',
  description: 'View hospital details, facilities, departments, doctors, and book appointments.',
};

export default function HospitalDetailPage() {
  return <HospitalDetailClient />;
}
