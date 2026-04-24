
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navbar_constants";


export default function TopNavBar({isAdmin}: { isAdmin: boolean }) {

    const pathname = usePathname();

    return (
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="text-gray-500 text-sm flex gap-2">
                <span>Dashboards</span> / <span className="text-gray-900 font-medium">{NAV_ITEMS.find((item) => item.href === pathname)?.label}</span>
            </div>
            <div className="relative">
                {pathname === "/home" && (
                <div className="flex gap-2" >
                    <button 
                        onClick={() => window.location.href = "/analyze"}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                    Analyse Image for Algae
                    </button>
                </div>
                )}
                
            </div>
        </header>
    );
}