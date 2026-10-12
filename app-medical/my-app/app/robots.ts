import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/ai', '/doctor/'],
        disallow: ['/admin', '/doctor-panel', '/profile', '/appointments', '/register', '/login', '/doctor-login'],
      },
    ],
    sitemap: 'https://northbengalmedisathi.com/sitemap.xml',
  };
}
