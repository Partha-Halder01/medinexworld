import type { Metadata } from 'next';
import { BlogDetailScreen } from '@/components/screens/BlogDetailScreen';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/blogs/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    const blog = await res.json();
    const title = `${blog.title} | Medinex World`;
    const description = blog.excerpt || (blog.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)) || 'Read health and wellness articles on Medinex World.';
    return {
      title,
      description,
      openGraph: {
        title: blog.title,
        description,
        type: 'article',
        publishedTime: blog.publishedAt || undefined,
        authors: [blog.author || 'Medinex World Editorial'],
        images: blog.coverImage ? [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description,
        images: blog.coverImage ? [blog.coverImage] : [],
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_APP_URL || ''}/blog/${slug}`,
      },
    };
  } catch {
    return {
      title: 'Blog Post | Medinex World',
      description: 'Read health and wellness articles on Medinex World.',
    };
  }
}

export default function BlogDetailPage() {
  return <BlogDetailScreen />;
}
