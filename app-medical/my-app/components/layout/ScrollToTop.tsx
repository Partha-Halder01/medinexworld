"use client";

import { useEffect, Suspense, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ScrollRestorerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resetAllScrolls = useCallback(() => {
    // 1. Reset standard browser window / html / body
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }

    // 2. Reset the main app content container
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    // 3. Reset panel-specific main scroll containers
    const adminContent = document.getElementById('admin-main-content');
    if (adminContent) {
      adminContent.scrollTop = 0;
    }

    const doctorContent = document.getElementById('doctor-panel-main-content');
    if (doctorContent) {
      doctorContent.scrollTop = 0;
    }

    // 4. Reset all page-level scroll containers (excluding sidebars and navigation menus)
    const scrollContainers = document.querySelectorAll<HTMLElement>(
      'main, #main-content, #admin-main-content, #doctor-panel-main-content, .overflow-y-auto, [data-page-scroll]'
    );
    scrollContainers.forEach((el) => {
      const isNavOrAside = el.tagName.toLowerCase() === 'nav' || Boolean(el.closest('aside')) || Boolean(el.closest('nav'));
      if (!isNavOrAside) {
        el.scrollTop = 0;
      }
    });
  }, []);

  // Configure browser scroll restoration on mount and handle history navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {
        // Ignore if unsupported in environment
      }
    }

    const handlePopState = () => {
      resetAllScrolls();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [resetAllScrolls]);

  // Execute scroll reset on every route / query parameter change
  useEffect(() => {
    // 1. Immediate execution
    resetAllScrolls();

    // 2. Next animation frame (after React commit and DOM paint)
    const rafId = requestAnimationFrame(() => {
      resetAllScrolls();
    });

    // 3. Deferred timers to handle asynchronous chunk loads, hydration, and layout shifts
    const t1 = setTimeout(resetAllScrolls, 50);
    const t2 = setTimeout(resetAllScrolls, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, searchParams, resetAllScrolls]);

  return null;
}

export function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorerInner />
    </Suspense>
  );
}
