import type { Metadata } from 'next';
import { UserProfileScreen } from '@/components/screens/UserProfileScreen';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your Medinex World profile, update personal info, change password, and track your appointment history.',
  robots: { index: false },
};

export default function ProfilePage() {
  return <UserProfileScreen />;
}
