import type { Metadata } from 'next';
import { SearchScreen } from '@/components/screens/SearchScreen';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Find a Doctor',
  description:
    'Search and book top-rated doctors near you by specialty. See real distances, live availability, and patient reviews.',
  openGraph: {
    title: 'Find a Doctor Near You | Medinex World',
    description: 'Browse doctors by specialty, distance, and availability. Book instantly.',
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/70 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-14 bg-white dark:bg-gray-800 rounded-3xl" />
          <div className="h-10 bg-white dark:bg-gray-800 rounded-2xl w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchScreen />
    </Suspense>
  );
}
