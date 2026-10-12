import type { Metadata } from 'next';
import { BlogListScreen } from '@/components/screens/BlogListScreen';

export const metadata: Metadata = {
  title: 'Health Blog',
  description: 'Read the latest health tips, wellness advice, disease information, and nutrition guides on Medinex World.',
};

export default function BlogPage() {
  return <BlogListScreen />;
}
