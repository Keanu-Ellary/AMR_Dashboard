'use client';

import { usePathname } from 'next/navigation';
import SideNavBar from '@/components/SideNavBar';
import { useEffect, useState } from 'react';
import { getMe } from '@/app/services/authService';

export default function NavBars({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routesWithoutNavBars = ['/login', '/forgot-password'];
  const displayNavbars = !routesWithoutNavBars.includes(pathname);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    if (displayNavbars) {
      getMe().then((user) => {
        setIsAdmin(user?.isAdmin || false);
        if (user) {
          setIsLoggedIn(true);
        }
      }).catch(() => {
        setIsAdmin(false);
        setIsLoggedIn(false);
      });
    }
  }, [displayNavbars]);

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-brand-100 selection:text-brand-700">
        {displayNavbars ? (
          <>
            <SideNavBar isLoggedIn={isLoggedIn} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto">{children}</div>
        )}
      </div>
  );
}
