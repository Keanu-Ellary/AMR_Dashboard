"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import { parseLocationName } from "@/utils/siteUtils";

interface SiteFilterProps {
  sites: SiteData[];
  selectedSites: string[];
  onToggleSite: (site: string, ctrlKey?: boolean) => void;
  onSelectSite: (site: SiteData) => void;
}

export default function SiteFilter({
  sites,
  selectedSites,
  onToggleSite,
  onSelectSite,
}: SiteFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uniqueSiteNames = useMemo(() => {
    const names = new Set<string>();
    sites.forEach((s) => names.add(parseLocationName(s.geoLocName)));
    return Array.from(names).sort();
  }, [sites]);

  const filteredNames = useMemo(() => {
    return uniqueSiteNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueSiteNames, searchTerm]);

  const label = useMemo(() => {
    if (selectedSites.length === 0) return "None";
    if (selectedSites.length === uniqueSiteNames.length) return "All";
    if (selectedSites.length === 1) return selectedSites[0];
    return `${selectedSites.length} Selected`;
  }, [selectedSites, uniqueSiteNames]);

  const handleToggle = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSite(name, true);
  };

  const handleSelectSite = (name: string) => {
    const site = sites.find((s) => parseLocationName(s.geoLocName) === name);
    if (site) {
      onSelectSite(site);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sample Sites Filter</span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-950 shadow-sm hover:border-indigo-300 transition-all"
      >
        <span className="truncate mr-2">{label}</span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search sites..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredNames.length > 0 ? (
              filteredNames.map((name) => {
                const isChecked = selectedSites.includes(name);
                return (
                  <div
                    key={name}
                    className="flex items-center px-2 py-1.5 hover:bg-slate-50 cursor-pointer group"
                    onClick={() => handleSelectSite(name)}
                  >
                    <div 
                      onClick={(e) => handleToggle(name, e)}
                      className="flex items-center justify-center w-4 h-4 rounded border border-slate-200 mr-2 transition-all group-hover:border-indigo-400"
                    >
                      {isChecked && <Check className="h-3 w-3 text-indigo-600 stroke-[3px]" />}
                    </div>
                    <span 
                      className={`flex-1 text-[11px] font-medium transition-colors ${isChecked ? 'text-indigo-950 font-bold' : 'text-slate-600'}`}
                    >
                      {name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center text-slate-400 text-[10px]">
                No sites match search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
