'use client';

import { usePathname } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';

export default function NavBars({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routesWithoutNavBars = ['/login', '/forgot-password'];
  const displayNavbars = !routesWithoutNavBars.includes(pathname);

  return (
    <div>
        {displayNavbars ? (
          <div className="flex h-screen bg-gray-100">
            <SideNavBar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopNavBar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
  );
}