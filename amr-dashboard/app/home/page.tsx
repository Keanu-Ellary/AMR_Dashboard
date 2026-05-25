"use client";

import { useState, useEffect, useMemo } from "react";
import { MapProvider } from "@/components/map/MapContext";
import type { SiteData } from "@/types/site_types";
import { getDangerZoneLabel } from "@/types/map_types";
import { Map } from "@/components/map/LoadMap";
import { getAllSites } from "@/app/services/siteService";
import {
  parseLocationName,
  calculateWQI,
  getWqiBracket,
} from "@/utils/siteUtils";
import OverviewCharts from "@/components/OverviewCharts";
import GeoLocationList from "@/components/GeoLocationList";
import SampleList from "@/components/SampleList";
import SiteFilter from "@/components/SiteFilter";
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";
import { FilterX, Map as MapIcon, Layers, Table, RefreshCw } from "lucide-react";

function DashboardHome() {
  const {
    filters,
    selectedWqiBrackets,
    setFilters,
    clearAllFilters,
    setDateRange,
    toggleContaminationLevel,
    toggleSite,
  } = useDashboard();

  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "location" | "sample">("map");
  const [loading, setLoading] = useState(true);

  const handleGetAllSites = async () => {
    setLoading(true);
    const allSitesResponse = await getAllSites();
    if (allSitesResponse.ok) {
      const allSiteData = await allSitesResponse.json();
      setSites(allSiteData.sites || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    handleGetAllSites();
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.contaminationLevels && filters.contaminationLevels.length > 0) ||
      (filters.sites && filters.sites.length > 0) ||
      selectedWqiBrackets.length > 0 ||
      !!filters.startDate ||
      !!filters.endDate
    );
  }, [filters, selectedWqiBrackets]);

  // 1. Base filter: everything except contaminationLevels and WQI brackets (for facets)
  const baseFilteredSites = useMemo(() => {
    return sites.filter((s) => {
      // Selected sites / locations
      if (filters.sites && filters.sites.length > 0) {
        const siteName = parseLocationName(s.geoLocName);
        if (!filters.sites.includes(siteName)) return false;
      }

      // Date ranges
      const sampleDate = new Date(s.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && sampleDate > new Date(filters.endDate)) return false;

      return true;
    });
  }, [sites, filters.sites, filters.startDate, filters.endDate]);

  // 2. Compute unique sites (latest sample per coordinate) from base filtered sites
  const uniqueSitesFiltered = useMemo(() => {
    const latestPerCoord = baseFilteredSites.reduce<Record<string, SiteData>>((acc, point) => {
      const coords = `${point.latitude},${point.longitude}`;
      const existing = acc[coords];
      if (!existing || new Date(point.collectionDate) > new Date(existing.collectionDate)) {
        acc[coords] = point;
      }
      return acc;
    }, {});
    
    // Also apply WQI bracket filtering to the unique set if active
    return Object.values(latestPerCoord).filter(s => {
      if (selectedWqiBrackets && selectedWqiBrackets.length > 0) {
        const score = calculateWQI(s.dissolvedO2, s.ph, s.temperature, s.tds);
        const bracket = getWqiBracket(score);
        if (!selectedWqiBrackets.includes(bracket)) return false;
      }
      return true;
    });
  }, [baseFilteredSites, selectedWqiBrackets]);

  // 3. Final points for map (applies contaminationLevels filter)
  const filteredPoints = useMemo(() => {
    if (!filters.contaminationLevels || filters.contaminationLevels.length === 0) {
      return uniqueSitesFiltered;
    }
    return uniqueSitesFiltered.filter((s) => 
      filters.contaminationLevels.includes(getDangerZoneLabel(s.dangerZone as any))
    );
  }, [uniqueSitesFiltered, filters.contaminationLevels]);

  // Filter lists for chart aggregations
  const sitesFilteredForWqi = useMemo(() => {
    return baseFilteredSites.filter((s) => {
      if (filters.contaminationLevels && filters.contaminationLevels.length > 0) {
        if (!filters.contaminationLevels.includes(getDangerZoneLabel(s.dangerZone as any))) return false;
      }
      return true;
    });
  }, [baseFilteredSites, filters.contaminationLevels]);

  // Dynamic WQI Distribution Breakdown
  const dynamicWqiDistribution = useMemo(() => {
    const brackets = [
      { bracket: "0-25", count: 0 },
      { bracket: "26-50", count: 0 },
      { bracket: "51-75", count: 0 },
      { bracket: "76-100", count: 0 },
    ];
    sitesFilteredForWqi.forEach((s) => {
      const score = calculateWQI(s.dissolvedO2, s.ph, s.temperature, s.tds);
      if (score === null) return;
      if (score <= 25) brackets[0].count++;
      else if (score <= 50) brackets[1].count++;
      else if (score <= 75) brackets[2].count++;
      else brackets[3].count++;
    });
    return brackets;
  }, [sitesFilteredForWqi]);

  // Dynamic Risk Zone Breakdown (based on unique sites to reflect KPI counts correctly)
  const dynamicZoneBreakdown = useMemo(() => {
    const breakdown = { red: 0, yellow: 0, green: 0 };
    uniqueSitesFiltered.forEach((s) => {
      const zone = s.dangerZone?.toLowerCase();
      if (zone === "red") breakdown.red++;
      else if (zone === "yellow") breakdown.yellow++;
      else if (zone === "green") breakdown.green++;
    });
    return breakdown;
  }, [uniqueSitesFiltered]);

  // KPIs (Facet counts based on unique sites matching other filters)
  const totalHighRiskSites = dynamicZoneBreakdown.red;
  const totalModerateRiskSites = dynamicZoneBreakdown.yellow;
  const totalLowRiskSites = dynamicZoneBreakdown.green;

  return (
    <main className="h-screen flex flex-col bg-slate-50/50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area (Left 3/4) */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          {/* Tabbed Menu and Content */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Tab Buttons (Centered at top) */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/50 rounded-2xl self-center flex-shrink-0">
              <button
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  activeTab === "map"
                    ? "bg-white text-indigo-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Interactive Spatial Mapping
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  activeTab === "location"
                    ? "bg-white text-indigo-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                List by Geo Location
              </button>
              <button
                onClick={() => setActiveTab("sample")}
                className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  activeTab === "sample"
                    ? "bg-white text-indigo-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                List by Sample (All)
              </button>
            </div>

            {/* Tab Content Panels */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "map" && (
                <div className="h-full bg-white overflow-hidden flex flex-col">
                  <MapProvider>
                    <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full bg-white relative">
                      <div className="flex-1 relative h-full">
                        <Map
                          points={filteredPoints}
                          selectedSite={selectedSite}
                          onSelectSite={setSelectedSite}
                          filters={filters}
                        />
                      </div>
                    </div>
                  </MapProvider>
                </div>
              )}

              {activeTab === "location" && (
                <div className="h-full">
                  <GeoLocationList sites={baseFilteredSites} />
                </div>
              )}

              {activeTab === "sample" && (
                <div className="h-full">
                  <SampleList sites={baseFilteredSites} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Filter Panel) */}
        <aside className="w-[360px] bg-white border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto flex-shrink-0">
          {/* Filter Panel Header */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-indigo-950">Filter Panel</h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm"
                >
                  <FilterX className="h-3 w-3" />
                  Clear All
                </button>
              )}
              <button
                onClick={handleGetAllSites}
                disabled={loading}
                className="p-1.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Date Filter Section */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temporal Coverage</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setDateRange(e.target.value, filters.endDate)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setDateRange(filters.startDate, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sample Sites Filter Dropdown */}
          <SiteFilter
            sites={sites}
            selectedSites={filters.sites || []}
            onToggleSite={toggleSite}
            onSelectSite={setSelectedSite}
          />

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Risk Distribution Facets</span>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={(e) => toggleContaminationLevel("low", e.ctrlKey || e.metaKey)}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left bg-white ${
                  filters.contaminationLevels?.includes("low") 
                  ? "border-emerald-500 ring-1 ring-emerald-500 shadow-sm" 
                  : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                <span className="text-[9px] font-bold text-emerald-600 uppercase">Low Risk</span>
                <span className="text-xl font-black text-indigo-950">{totalLowRiskSites}</span>
              </button>

              <button 
                onClick={(e) => toggleContaminationLevel("moderate", e.ctrlKey || e.metaKey)}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left bg-white ${
                  filters.contaminationLevels?.includes("moderate") 
                  ? "border-yellow-400 ring-1 ring-yellow-400 shadow-sm" 
                  : "border-slate-200 hover:border-yellow-300"
                }`}
              >
                <span className="text-[9px] font-bold text-yellow-600 uppercase">Moderate</span>
                <span className="text-xl font-black text-indigo-950">{totalModerateRiskSites}</span>
              </button>

              <button 
                onClick={(e) => toggleContaminationLevel("high", e.ctrlKey || e.metaKey)}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left bg-white ${
                  filters.contaminationLevels?.includes("high") 
                  ? "border-red-500 ring-1 ring-red-500 shadow-sm" 
                  : "border-slate-200 hover:border-red-300"
                }`}
              >
                <span className="text-[9px] font-bold text-red-600 uppercase">High Risk</span>
                <span className="text-xl font-black text-indigo-950">{totalHighRiskSites}</span>
              </button>

              <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Filtered Total</span>
                <span className="text-xl font-black text-indigo-950">{filteredPoints.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <OverviewCharts
              wqiDistribution={dynamicWqiDistribution}
              zoneBreakdown={dynamicZoneBreakdown}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <DashboardProvider>
      <DashboardHome />
    </DashboardProvider>
  );
}