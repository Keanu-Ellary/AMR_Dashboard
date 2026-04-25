"use client";

import { useState, useEffect, useMemo } from "react";
import { MapProvider } from "@/components/map/MapContext";
import type { SiteData } from "@/types/site_types";
import SitesSidebar from "@/components/map/SitesSidebar";
import { getDangerZoneLabel, MapFilters } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";
import { Map } from "@/components/map/LoadMap";
import { getAllSites } from "@/app/services/siteService";
import clsx from "clsx";
import { useUI } from "@/context/UIContext";
import AddDataPopup from "@/components/map/AddDataPopup";
import AddImagesPopup from "@/components/map/AddImagesPopup";

export default function Home() {
  const { isAddDataOpen, setIsAddDataOpen, isAddImagesOpen, setIsAddImagesOpen } = useUI();
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [sites, setSites] = useState<SiteData[]>([]);

  const handleGetAllSites = async () => {
    const allSitesResponse = await getAllSites();
    if (allSitesResponse.ok) {
      const allSiteData = await allSitesResponse.json();
      setSites(allSiteData.sites);
    }
  }

  useEffect(() => {
    handleGetAllSites();
  }, []);

  // Filter all samples based on current filter state
  const filteredAllSamples = useMemo(() => {
    return sites.filter((point) => {
      if (!filters) return true;
  
      if (filters.contaminationLevels && filters.contaminationLevels.length > 0) {
        if (!filters.contaminationLevels.includes(getDangerZoneLabel(point.dangerZone as any)))
          return false;
      }
  
      if (filters.sites && filters.sites.length > 0) {
        const site = point.geoLocName;
        let siteName = site;
        if (point.sampleName) {
          if (site.includes("Apies River - ")) {
            const parts = site.split("Apies River - ");
            if (parts.length > 1) siteName = parts[1].trim();
          } else if (site.includes(" - Apies River")) {
            const parts = site.split(" - Apies River");
            if (parts.length > 1) siteName = parts[0].trim();
          }
        }
        if (!filters.sites.includes(siteName)) return false;
      }
  
      const sampleDate = new Date(point.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && sampleDate > new Date(filters.endDate)) return false;
  
      return true;
    });
  }, [sites, filters]);

  // Group by location and get the LATEST sample for each unique site to display on map/sidebar
  const uniqueSitePoints = useMemo(() => {
    const grouped = filteredAllSamples.reduce<Record<string, SiteData>>((acc, point) => {
      const key = `${point.latitude},${point.longitude}`;
      if (!acc[key] || new Date(point.collectionDate) > new Date(acc[key].collectionDate)) {
        acc[key] = point;
      }
      return acc;
    }, {});
    return Object.values(grouped);
  }, [filteredAllSamples]);

  const stats = useMemo(() => {
    return {
      total: uniqueSitePoints.length,
      highRisk: uniqueSitePoints.filter(p => p.dangerZone === "red").length,
      moderateRisk: uniqueSitePoints.filter(p => p.dangerZone === "yellow").length
    };
  }, [uniqueSitePoints]);

  return (
    <main className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Stats Header */}
      <div className="p-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 max-w-4xl">
          <StatCard label="Unique Sampling Sites" value={stats.total} />
          <StatCard label="High Risk Sites" value={stats.highRisk} variant="risk-high" />
          <StatCard label="Moderate Risk Sites" value={stats.moderateRisk} variant="risk-moderate" />
        </div>
      </div>

      <MapProvider>
        <div className="flex-1 flex overflow-hidden border-t border-border">
          <div className="flex-1 relative">
            <Map
              points={uniqueSitePoints}
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              filters={filters}
              onFiltersChange={setFilters}
              allPoints={sites}
            />
          </div>
          <SitesSidebar
            points={uniqueSitePoints}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onRefresh={handleGetAllSites}
          />
        </div>
      </MapProvider>

      {/* Popups */}
      <AddDataPopup 
        isOpen={isAddDataOpen} 
        onClose={() => setIsAddDataOpen(false)} 
        selectedSite={selectedSite} 
        onRefresh={handleGetAllSites} 
      />
      <AddImagesPopup 
        isOpen={isAddImagesOpen} 
        onClose={() => setIsAddImagesOpen(false)} 
        initialSite={selectedSite} 
        onRefresh={handleGetAllSites} 
      />
    </main>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant?: "risk-high" | "risk-moderate" }) {
  return (
    <div className={clsx(
      "p-5 rounded-xl border transition-all duration-200 shadow-subtle",
      variant === "risk-high" ? "bg-red-50 border-red-100" :
      variant === "risk-moderate" ? "bg-yellow-50 border-yellow-100" :
      "bg-white border-border"
    )}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={clsx(
        "text-3xl font-bold tracking-tight",
        variant === "risk-high" ? "text-risk-high" :
        variant === "risk-moderate" ? "text-risk-moderate" :
        "text-foreground"
      )}>
        {value}
      </div>
    </div>
  );
}
