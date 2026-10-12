import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlobalComponents } from '@/components/layout/GlobalComponents';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d9488',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://medinexworld.com'),
  title: {
    default: 'Medinex World — Book Doctors & AI Health Checker',
    template: '%s | Medinex World',
  },
  description:
    'Medinex World helps you find and book top-rated doctors near you, check symptoms with AI, and manage your health appointments — connecting you to trusted care.',
  keywords: [
    'Medinex World', 'Medinex', 'doctor booking', 'find doctor near me', 'online doctor consultation',
    'Medinex AI', 'medical appointments',
    'healthcare app', 'book appointment', 'telemedicine',
    'hospital near me', 'lab testing', 'health blog', 'digital prescription',
  ],
  authors: [{ name: 'Medinex World' }],
  creator: 'Medinex World',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://medinexworld.com',
    siteName: 'Medinex World',
    title: 'Medinex World — Book Doctors & AI Health Checker',
    description:
      'Find and book top-rated doctors near you. Check symptoms with AI. Connecting you to trusted care.',
    images: [{ url: '/newlogos.png', width: 2027, height: 776, alt: 'Medinex World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medinex World — Book Doctors & AI Health Checker',
    description: 'Find doctors near you, check symptoms with AI, book appointments instantly. Connecting you to trusted care.',
    images: ['/newlogos.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [
      { url: '/favicorn.png', href: '/favicorn.png' },
    ],
    shortcut: '/favicorn.png',
    apple: '/favicorn.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  name: 'Medinex World',
  alternateName: 'Medinex',
  url: 'https://medinexworld.com',
  logo: 'https://medinexworld.com/newlogos.png',
  description: 'Book appointments with top-rated doctors near you and check symptoms with AI. Connecting you to trusted care.',
  medicalSpecialty: [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
    'Neurologist', 'Orthopedic', 'ENT Specialist', 'Gynecologist',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans`}>
      <head>
        <link rel="icon" type="image/png" href="/favicorn.png" />
        <link rel="shortcut icon" href="/favicorn.png" />
        <link rel="apple-touch-icon" href="/favicorn.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200 antialiased">
        <LanguageProvider>
          <AppProvider>
            <ScrollToTop />
            <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main id="main-content" className="flex-1 relative overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
                  <GlobalComponents />
                  {children}
                </main>
                <BottomNav />
              </div>
            </div>
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
