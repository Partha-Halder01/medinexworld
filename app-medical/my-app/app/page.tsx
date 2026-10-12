import type { Metadata } from 'next';
import { HomeScreen } from '@/components/screens/HomeScreen';

export const metadata: Metadata = {
  title: 'Home — Find Doctors, Check Symptoms with AI',
  description:
    'Medinex World — Book appointments with nearby doctors, use AI symptom checker, and manage your health all in one place. Connecting you to trusted care.',
  openGraph: {
    title: 'Medinex World — Your Personal Health Companion',
    description:
      'Book doctors, check symptoms with AI, and manage appointments — connecting you to trusted care.',
  },
};

export default function Home() {
  return <HomeScreen />;
}
