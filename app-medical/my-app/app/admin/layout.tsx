"use client";
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoggedIn, isAuthReady } = useAppContext();
  const isLoginPage = pathname === '/admin';

  useEffect(() => {
    // Wait until the saved session has been read, otherwise a page refresh looks like "logged out".
    if (!isAuthReady) return;
    if (!isLoginPage && (!isLoggedIn || currentUser?.role !== 'admin')) {
      router.replace('/admin');
    }
  }, [isAuthReady, isLoginPage, isLoggedIn, currentUser?.role, router]);

  return (
    <div className={`flex flex-col md:flex-row h-full w-full ${isLoginPage ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
      {!isLoginPage && <AdminSidebar />}
      <div id="admin-main-content" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}
