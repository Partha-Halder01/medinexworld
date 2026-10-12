import type { Metadata } from 'next';
import { PrescriptionsScreen } from '@/components/screens/PrescriptionsScreen';

export const metadata: Metadata = {
  title: 'Digital Prescriptions',
  robots: { index: false },
};

export default function PrescriptionsPage() {
  return <PrescriptionsScreen />;
}
