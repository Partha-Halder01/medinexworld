import type { Metadata } from 'next';
import { ClinicsScreen } from '@/components/screens/ClinicsScreen';

export const metadata: Metadata = {
  title: 'Clinics & Hospitals',
  description: 'Browse verified clinics, hospitals and nursing homes near you, see their doctors and book an in-clinic visit.',
};

export default function ClinicsPage() {
  return <ClinicsScreen />;
}
