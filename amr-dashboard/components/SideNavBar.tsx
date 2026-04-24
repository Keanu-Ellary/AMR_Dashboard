
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/constants/navbar_constants";
import { NavItem } from "@/types/navbar_types";
import { LogOutIcon, UserIcon } from "lucide-react";
import { logout } from "@/app/services/authService";

function NavLink({ href, icon: Icon, label, isActive }: NavItem & { isActive: boolean }) {
  return (
    <a
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
    </a>
  );
}

export default function SideNavBar({isLoggedIn}: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r flex flex-col p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <UserIcon size={18}></UserIcon>
          <Link
            href="/login"
            className="font-semibold text-gray-700 hover:text-green-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      <div className="text-xs text-gray-500 uppercase font-semibold mb-4">
        Dashboards
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.filter(item => item.href !== "/add-data" && item.href !== "/analyze")
          .map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
          {isLoggedIn && (
            <NavLink
              key={NAV_ITEMS[1].href}
              {...NAV_ITEMS[1]}
              isActive={pathname === NAV_ITEMS[1].href}
            />
          )}
      </nav>

      {isLoggedIn && (
          <button
            onClick={async () => { await logout();
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 w-full"
        >
          <LogOutIcon size={18} /> Logout
        </button>
      )}
    </div>
  );
}