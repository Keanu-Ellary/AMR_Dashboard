
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navbar_constants";


export default function TopNavBar({isAdmin}: { isAdmin: boolean }) {

    const pathname = usePathname();
    const [isExportOpen, setIsExportOpen] = useState(false);

    return (
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="text-gray-500 text-sm flex gap-2">
                <span>Dashboards</span> / <span className="text-gray-900 font-medium">{NAV_ITEMS.find((item) => item.href === pathname)?.label}</span>
            </div>
            <div className="relative">
                {pathname === "/home" && (
                <div className="flex gap-2" >
                    {isAdmin && (
                        <button 
                            onClick={() => window.location.href = "/add-data"}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                    Upload Data
                    </button>
                     )}

                    <button 
                        onClick={() => window.location.href = "/analyze"}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                    Analyse Image for Algae
                    </button>
                </div>
                )}
                

                {pathname === "/statistics" && (
                <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                >
                <Download size={16} /> Export
                </button>
                )}
                
                {isExportOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                    <button 
                        onClick={() => { setIsExportOpen(false); alert("Exporting as CSV..."); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Export as CSV
                    </button>
                    <button 
                        onClick={() => { setIsExportOpen(false); alert("Exporting as TSV..."); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Export as TSV
                    </button>
                    <button 
                        onClick={() => { setIsExportOpen(false); alert("Exporting as JSON..."); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Export as JSON
                    </button>
                    </div>
                </div>
                )}
            </div>
        </header>
    );
}