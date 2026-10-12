"use client";
import { DoctorSidebar } from '@/components/layout/DoctorSidebar';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useEffect } from 'react';

export default function DoctorPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, isLoggedIn, isAuthReady } = useAppContext();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn || currentUser?.role !== 'doctor') {
      router.replace('/doctor-login');
    }
  }, [isAuthReady, isLoggedIn, currentUser?.role, router]);

  if (!isAuthReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-teal-200 dark:border-teal-900/40 border-t-teal-600 dark:border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || currentUser?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <DoctorSidebar />
      <div id="doctor-panel-main-content" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}
