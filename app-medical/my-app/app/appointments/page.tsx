import type { Metadata } from 'next';
import { AppointmentsScreen } from '@/components/screens/AppointmentsScreen';

export const metadata: Metadata = {
  title: 'My Appointments',
  description: 'View, manage, and track all your upcoming and past doctor appointments on Medinex World.',
  robots: { index: false },
};

export default function AppointmentsPage() {
  return <AppointmentsScreen />;
}
