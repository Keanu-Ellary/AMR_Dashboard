"use client";

import type { SiteData } from "@/types/site_types";
import { RISK_COLOUR, CONTAMINATION_LEVEL_ORDER } from "@/constants/map_constants";
import { getDangerZoneLabel } from "@/types/map_types";
import { Trash2Icon, MapPin, Calendar, XCircle } from "lucide-react";
import { deleteSite } from "@/app/services/siteService";
import { toast } from "react-toastify";
import ConfirmDelete from "../add-data/confirmDelete";
import { useEffect, useState } from "react";
import { getMe } from "@/app/services/authService";
import clsx from "clsx";

interface SiteListProps {
  points: SiteData[];
  selectedSite: SiteData | null;
  onSelectSite: (site: SiteData | null) => void;
  onRefresh: () => void;
}

export default function SiteList({ points, selectedSite, onSelectSite, onRefresh }: SiteListProps) {
  const [siteToDelete, setSiteToDelete] = useState<SiteData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await getMe();
        setIsAdminUser(response?.isAdmin ?? false);
      } catch (error) {
        setIsAdminUser(false);
      }
    };
    checkAdmin();
  }, []);

  const sortedPoints = [...points].sort((a, b) => {
    const labelA = getDangerZoneLabel(a.dangerZone as any);
    const labelB = getDangerZoneLabel(b.dangerZone as any);
    return (CONTAMINATION_LEVEL_ORDER[labelA] ?? 3) - (CONTAMINATION_LEVEL_ORDER[labelB] ?? 3);
  });

  const handleDeleteSite = async (site: SiteData) => {
    try {
      if (!site.id) return;
      const response = await deleteSite(site.id);
      if (response.ok) {
        toast.success('Site deleted');
        setSiteToDelete(null);
        onRefresh();
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('Delete error');
    }
  };

  return (
    <div className="flex flex-col w-72 bg-white border-l border-border h-full shadow-subtle overflow-hidden">
      <ConfirmDelete
        site={siteToDelete}
        handleConfirm={() => handleDeleteSite(siteToDelete!)}
        handleCancel={() => setSiteToDelete(null)}
      />

      <div className="p-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Sampling Sites</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{points.length} locations</p>
        </div>
        {selectedSite && (
          <button 
            onClick={() => onSelectSite(null)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-risk-high"
            title="Clear Selection"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sortedPoints.map((site) => {
          const isSelected = selectedSite?.id === site.id;
          const dangerLabel = getDangerZoneLabel(site.dangerZone as any);
          const riskColor = RISK_COLOUR[dangerLabel]?.fill ?? RISK_COLOUR.unknown.fill;
          
          return (
            <li
              key={site.id}
              onClick={() => onSelectSite(site)}
              className={clsx(
                "group flex items-stretch rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden",
                isSelected 
                  ? "bg-brand-50 border-brand-200 shadow-sm" 
                  : "bg-white border-transparent hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="w-1.5 shrink-0" style={{ background: riskColor }} />

              <div className="flex-1 p-3 min-w-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={clsx(
                    "text-xs font-bold truncate tracking-tight",
                    isSelected ? "text-brand-900" : "text-gray-700"
                  )}>
                    {site.geoLocName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={10} className="text-gray-400" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(site.collectionDate).toLocaleDateString("en-ZA", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {isAdminUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSiteToDelete(site);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-md transition-all text-gray-400 hover:text-risk-high"
                  >
                    <Trash2Icon size={14} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
