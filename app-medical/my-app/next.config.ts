import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "approximately-agreed-handheld-shell.trycloudflare.com",
    "localhost:3000",
    "10.29.26.254",
    "johnie-acotyledonous-overhugely.ngrok-free.dev"
  ],
  turbopack: {
    root: __dirname,
  },

  // Compress responses with gzip
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
    ],
  },

  // Strict mode for better React perf signals in dev
  reactStrictMode: true,

  // Aggressive caching headers for static assets
  async headers() {
    return [
      {
        // Apply security headers only to page routes, NOT static assets
        source: '/((?!_next/static|_next/image|favicon).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/:path*.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:path*.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:path*.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:path*.woff2',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        // Cache API responses for doctors list for 30 seconds
        source: '/api/doctors',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin/login',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
