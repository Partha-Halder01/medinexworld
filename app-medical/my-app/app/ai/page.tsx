import type { Metadata } from 'next';
import { AISymptomScreen } from '@/components/screens/AISymptomScreen';

export const metadata: Metadata = {
  title: 'Medinex AI - Health Assistant',
  description:
    'Describe your symptoms to Medinex AI and get instant analysis — possible causes, home remedies, and which specialist to visit. Supports Hindi and English.',
  openGraph: {
    title: 'Medinex AI - Health Assistant | Medinex World',
    description: 'Instant AI health analysis in Hindi and English — causes, remedies, and specialist recommendations.',
  },
};

export default function AIPage() {
  return <AISymptomScreen />;
}
