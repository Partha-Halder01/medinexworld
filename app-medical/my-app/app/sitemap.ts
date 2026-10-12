import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://northbengalmedisathi.com';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/hospital`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true }
    });
    const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
      url: `${base}/blog/${blog.slug}`,
      lastModified: blog.updatedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true }
    });
    const hospitalRoutes: MetadataRoute.Sitemap = hospitals.map((h) => ({
      url: `${base}/hospital/${h.id}`,
      lastModified: h.updatedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...blogRoutes, ...hospitalRoutes];
  } catch {
    return staticRoutes;
  }
}
