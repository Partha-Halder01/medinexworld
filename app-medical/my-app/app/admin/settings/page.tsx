import type { Metadata } from 'next';
import { AdminSettingsScreen } from '@/components/screens/admin/AdminSettingsScreen';

export const metadata: Metadata = {
  title: 'Website & Contact Settings — Admin Panel',
  description: 'Update phone number, support email, and emergency contact for the entire website.',
};

export default function AdminSettingsPage() {
  return <AdminSettingsScreen />;
}
