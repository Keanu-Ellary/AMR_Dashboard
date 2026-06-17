'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from "next/link";
import clsx from "clsx";
import { NAV_ITEMS } from "@/constants/navbar_constants";
import { NavItem } from "@/types/navbar_types";
import { LogOutIcon, UserIcon } from "lucide-react";
import { logout, getMe } from "@/app/services/authService";

const HIDDEN_NAVS = ['/login', '/forgot-password', '/reset-password'];

function NavLink({ href, icon: Icon, label, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive
          ? "bg-gray-200 text-gray-900 font-medium"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

export default function NavBars() {
  const pathname = usePathname();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await getMe();
        if (user) {
          setIsLoggedIn(true);
          setIsAdminUser(user.isAdmin ?? false);
        } else {
          setIsLoggedIn(false);
          setIsAdminUser(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
        setIsAdminUser(false);
      }
    };
    checkAdmin();
  }, []);

  if (HIDDEN_NAVS.includes(pathname)) return null;
  return (
    <div className="w-64 bg-white border-r flex flex-col p-4">
      <div className="flex items-center justify-between mb-8">
        {!isLoggedIn ? (
          <div className="flex items-center gap-2">
            <UserIcon size={18} />
            <Link
              href="/login"
              className="font-semibold text-gray-700 hover:text-green-600 transition-colors"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LogOutIcon size={18} />
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/home";
              }}
              className="font-semibold text-gray-700 hover:text-green-600 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 uppercase font-semibold mb-4">
        Dashboards
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.filter(item => item.href !== "/changelog" && item.href !== "/data-management" && item.href !== "/user-management")
          .map((item) => (
            <NavLink key={item.href} {...item} isActive={pathname === item.href} />
          ))}
        {isAdminUser && (
          <>
             <NavLink
              key="/user-management"
              {...NAV_ITEMS.find(i => i.href === "/user-management")!}
              isActive={pathname === "/user-management"}
            />
            <NavLink
              key="/changelog"
              {...NAV_ITEMS.find(i => i.href === "/changelog")!}
              isActive={pathname === "/changelog"}
            />
            <NavLink
              key="/data-management"
              {...NAV_ITEMS.find(i => i.href === "/data-management")!}
              isActive={pathname === "/data-management"}
            />
          </>
        )}
      </nav>
    </div>
  );
}