"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/constants/navbar_constants";
import { NavItem } from "@/types/navbar_types";
import { LogOutIcon, UserIcon } from "lucide-react";
import { logout } from "@/app/services/authService";
import { useUI } from "@/context/UIContext";

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: NavItem & { isActive: boolean; onClick?: (e: React.MouseEvent) => void }) {
  const content = (
    <div
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
        isActive
          ? "bg-sidebar-active text-sidebar-foreground-active font-semibold shadow-subtle"
          : "text-sidebar-foreground hover:bg-sidebar-active hover:text-sidebar-foreground-active",
      )}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="w-full">
      {content}
    </Link>
  );
}

export default function SideNavBar({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAddDataOpen,
    setIsAddDataOpen,
    isAddImagesOpen,
    setIsAddImagesOpen,
  } = useUI();
  const isHome = pathname === "/home";

  return (
    <div className="w-64 bg-sidebar border-r border-border flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-10">
        <div className="font-bold text-lg tracking-tight text-foreground uppercase">
          AMR Dashboard
        </div>
      </div>

      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">
        Main Menu
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.filter(
          (item) => item.href !== "/add-data" && item.href !== "/add-images",
        ).map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={pathname === item.href}
          />
        ))}

        {isAdmin && (
          <>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-6 mb-4">
              Data Management
            </div>
            <NavLink
              key="/add-data"
              {...NAV_ITEMS.find((i) => i.href === "/add-data")!}
              isActive={isHome ? isAddDataOpen : pathname === "/add-data"}
              onClick={(e) => {
                e.preventDefault();
                setIsAddDataOpen(true);
                if (!isHome) router.push("/home");
              }}
            />
            <NavLink
              key="/add-images"
              {...NAV_ITEMS.find((i) => i.href === "/add-images")!}
              isActive={isHome ? isAddImagesOpen : pathname === "/add-images"}
              onClick={(e) => {
                e.preventDefault();
                setIsAddImagesOpen(true);
                if (!isHome) router.push("/home");
              }}
            />
          </>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        {!isLoggedIn && (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:text-brand-600 transition-colors font-medium"
          >
            <UserIcon size={18} />
            <span>Login</span>
          </Link>
        )}
        {isLoggedIn && (
          <button
            onClick={async () => {
              await logout();
              window.location.href = "/home";
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:text-risk-high transition-colors font-medium w-full text-left"
          >
            <LogOutIcon size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
