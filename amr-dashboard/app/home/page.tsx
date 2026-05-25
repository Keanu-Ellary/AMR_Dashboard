"use client";

import { useState, useEffect, useMemo } from "react";
import { MapProvider } from "@/components/map/MapContext";
import type { SiteData } from "@/types/site_types";
import SitesSidebar from "@/components/map/SitesSidebar";
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
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";
import { FilterX, Map as MapIcon, Layers, Table, RefreshCw } from "lucide-react";

function DashboardHome() {
  const {
    filters,
    selectedWqiBrackets,
    setFilters,
    clearAllFilters,
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

  // Compute unique sites for map pins (taking the latest sample per coordinate)
  const uniqueSites = useMemo(() => {
    return Object.values(
      sites.reduce<Record<string, SiteData>>((uniquePoints, point) => {
        const coords = `${point.latitude},${point.longitude}`;
        const existing = uniquePoints[coords];
        if (!existing || new Date(point.collectionDate) > new Date(existing.collectionDate)) {
          uniquePoints[coords] = point;
        }
        return uniquePoints;
      }, {})
    );
  }, [sites]);

  // Apply bidirectional filters to map points
  const filteredPoints = useMemo(() => {
    return uniqueSites.filter((point) => {
      // Danger zone
      if (filters.contaminationLevels && filters.contaminationLevels.length > 0) {
        if (!filters.contaminationLevels.includes(getDangerZoneLabel(point.dangerZone as any))) {
          return false;
        }
      }

      // Selected sites / locations
      if (filters.sites && filters.sites.length > 0) {
        const siteName = parseLocationName(point.geoLocName);
        if (!filters.sites.includes(siteName)) {
          return false;
        }
      }

      // WQI brackets
      if (selectedWqiBrackets && selectedWqiBrackets.length > 0) {
        const score = calculateWQI(point.dissolvedO2, point.ph, point.temperature, point.tds);
        const bracket = getWqiBracket(score);
        if (!selectedWqiBrackets.includes(bracket)) {
          return false;
        }
      }

      // Date ranges
      const sampleDate = new Date(point.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && sampleDate > new Date(filters.endDate)) return false;

      return true;
    });
  }, [uniqueSites, filters, selectedWqiBrackets]);

  // Filter lists for chart aggregations
  const sitesFilteredForWqi = useMemo(() => {
    return sites.filter((s) => {
      if (filters.contaminationLevels && filters.contaminationLevels.length > 0) {
        if (!filters.contaminationLevels.includes(getDangerZoneLabel(s.dangerZone as any))) return false;
      }
      if (filters.sites && filters.sites.length > 0) {
        const loc = parseLocationName(s.geoLocName);
        if (!filters.sites.includes(loc)) return false;
      }
      const sampleDate = new Date(s.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && sampleDate > new Date(filters.endDate)) return false;
      return true;
    });
  }, [sites, filters]);

  const sitesFilteredForRisk = useMemo(() => {
    return sites.filter((s) => {
      if (filters.sites && filters.sites.length > 0) {
        const loc = parseLocationName(s.geoLocName);
        if (!filters.sites.includes(loc)) return false;
      }
      if (selectedWqiBrackets && selectedWqiBrackets.length > 0) {
        const score = calculateWQI(s.dissolvedO2, s.ph, s.temperature, s.tds);
        const bracket = getWqiBracket(score);
        if (!selectedWqiBrackets.includes(bracket)) return false;
      }
      const sampleDate = new Date(s.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && sampleDate > new Date(filters.endDate)) return false;
      return true;
    });
  }, [sites, filters, selectedWqiBrackets]);

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

  // Dynamic Risk Zone Breakdown
  const dynamicZoneBreakdown = useMemo(() => {
    const breakdown = { red: 0, yellow: 0, green: 0 };
    sitesFilteredForRisk.forEach((s) => {
      const zone = s.dangerZone?.toLowerCase();
      if (zone === "red") breakdown.red++;
      else if (zone === "yellow") breakdown.yellow++;
      else if (zone === "green") breakdown.green++;
    });
    return breakdown;
  }, [sitesFilteredForRisk]);

  // KPIs
  const totalHighRiskSites = useMemo(() => {
    return filteredPoints.filter((p) => p.dangerZone === "red").length;
  }, [filteredPoints]);

  const totalModerateRiskSites = useMemo(() => {
    return filteredPoints.filter((p) => p.dangerZone === "yellow").length;
  }, [filteredPoints]);

  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
      {/* Overview Page Title Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight">System Overview</h1>
          <p className="text-sm text-gray-500 font-medium">
            Contamination risk mapping and diagnostic indicators across all research sites
          </p>
        </div>

        {/* Global Filter Controls */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear Active Filters
            </button>
          )}
          <button
            onClick={handleGetAllSites}
            disabled={loading}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-1 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Active Sites</span>
          <span className="text-3xl font-black text-indigo-950 mt-1">{filteredPoints.length}</span>
          <span className="text-xs text-indigo-500 font-semibold mt-1">Based on current filter parameters</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-1 border-l-red-500 border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">High Risk Zones</span>
          <span className="text-3xl font-black text-red-600 mt-1">{totalHighRiskSites}</span>
          <span className="text-xs text-red-500 font-semibold mt-1">High-risk warning status</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-1 border-l-yellow-400 border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Moderate Risk Zones</span>
          <span className="text-3xl font-black text-yellow-600 mt-1">{totalModerateRiskSites}</span>
          <span className="text-xs text-yellow-500 font-semibold mt-1">Watchlist warning status</span>
        </div>
      </div>

      {/* Charts Section */}
      <OverviewCharts
        wqiDistribution={dynamicWqiDistribution}
        zoneBreakdown={dynamicZoneBreakdown}
      />

      {/* Tabbed Menu Container */}
      <div className="flex flex-col gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/50 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
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
        <div className="transition-all duration-300">
          {activeTab === "map" && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-base">Interactive Spatial Mapping</h3>
                  <p className="text-xs text-gray-500">Filter and analyze site contamination zones geographically</p>
                </div>
              </div>

              <MapProvider>
                <div className="flex flex-col lg:flex-row h-[600px] w-full bg-white relative">
                  <div className="flex-1 relative h-full">
                    <Map
                      points={filteredPoints}
                      selectedSite={selectedSite}
                      onSelectSite={setSelectedSite}
                      filters={filters}
                      onFiltersChange={setFilters}
                      allPoints={sites}
                    />
                  </div>
                  <SitesSidebar
                    points={filteredPoints}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    onRefresh={handleGetAllSites}
                  />
                </div>
              </MapProvider>
            </div>
          )}

          {activeTab === "location" && <GeoLocationList sites={sites} />}

          {activeTab === "sample" && <SampleList sites={sites} />}
        </div>
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