"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Check,
  Calendar,
  Layers,
  Table,
  TrendingUp,
  Activity,
  AlertCircle,
  X,
} from "lucide-react";

// --- Color palette for sites ---
const SITE_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
];

// --- Metric configuration ---
interface MetricOption {
  key: string;
  name: string;
  unit: string;
  color: string;
  dashStyle?: string;
}

const METRIC_OPTIONS: MetricOption[] = [
  { key: "ph", name: "pH Level", unit: "", color: "#3b82f6", dashStyle: "" },
  { key: "temperature", name: "Temperature", unit: "°C", color: "#f59e0b", dashStyle: "5 5" },
  { key: "dissolvedO2", name: "Dissolved O₂", unit: "mg/L", color: "#06b6d4", dashStyle: "3 3" },
  { key: "tds", name: "TDS", unit: "mg/L", color: "#8b5cf6", dashStyle: "10 5" },
  { key: "ec", name: "EC", unit: "µS/cm", color: "#ec4899", dashStyle: "5 2 2 2" },
  { key: "wqi", name: "WQI", unit: "", color: "#10b981", dashStyle: "1 1" },
  { key: "amrGeneCount", name: "AMR Genes", unit: " count", color: "#ef4444", dashStyle: "8 3 2 3" },
];

// --- Component Props ---
interface SiteComparisonDashboardProps {
  preSelectedSite?: string;
}

// --- Value Quality Checkers ---
function isGoodRange(metricKey: string, val: number | null): boolean | "moderate" | null {
  if (val == null) return null;
  switch (metricKey) {
    case "ph":
      return val >= 6.5 && val <= 8.5;
    case "temperature":
      return val >= 10 && val <= 28;
    case "dissolvedO2":
      return val >= 6.0;
    case "tds":
      return val <= 200 ? true : val <= 500 ? "moderate" : false;
    case "ec":
      return val <= 300 ? true : val <= 800 ? "moderate" : false;
    case "wqi":
      return val >= 70 ? true : val >= 50 ? "moderate" : false;
    case "amrGeneCount":
      return val === 0 ? true : val <= 2 ? "moderate" : false;
    default:
      return null;
  }
}

function getQualityStyle(metricKey: string, val: number | null): string {
  const quality = isGoodRange(metricKey, val);
  if (quality === true) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (quality === "moderate") return "bg-yellow-50 text-yellow-700 border-yellow-100";
  if (quality === false) return "bg-red-50 text-red-700 border-red-100";
  return "text-gray-500 bg-gray-50 border-gray-100";
}

export default function SiteComparisonDashboard({
  preSelectedSite,
}: SiteComparisonDashboardProps) {
  // --- States ---
  const [allSiteNames, setAllSiteNames] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "ph",
    "temperature",
    "wqi",
  ]);
  const [dateRange, setDateRange] = useState<string>("30days");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // API fetched states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesRaw, setTimeSeriesRaw] = useState<Record<string, any>>({});
  const [correlations, setCorrelations] = useState<Record<string, Record<string, number>>>({});
  const [siteLatest, setSiteLatest] = useState<Record<string, any>>({});
  
  // Current correlation site selection
  const [activeCorrSite, setActiveCorrSite] = useState<string>("");

  // --- Fetch All Sites for Checklist ---
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/site");
        if (!res.ok) throw new Error("Failed to fetch site list");
        const json = await res.json();
        
        const names = Array.from(
          new Set(
            (json.sites || [])
              .map((s: any) => s.geoLocName)
              .filter(Boolean)
          )
        ) as string[];
        
        const sortedNames = names.sort((a, b) => a.localeCompare(b));
        setAllSiteNames(sortedNames);

        // Pre-select logic
        if (preSelectedSite && sortedNames.includes(preSelectedSite)) {
          setSelectedSites([preSelectedSite]);
          setActiveCorrSite(preSelectedSite);
        } else if (sortedNames.length > 0) {
          // Default: select up to first 2 sites
          const defaultSites = sortedNames.slice(0, 2);
          setSelectedSites(defaultSites);
          setActiveCorrSite(defaultSites[0]);
        }
      } catch (err: any) {
        console.error("Failed to load initial site metadata:", err);
      }
    };
    fetchSites();
  }, [preSelectedSite]);

  // --- Fetch Dynamic Site Comparison Data ---
  useEffect(() => {
    if (selectedSites.length === 0 || selectedMetrics.length === 0) {
      setTimeSeriesRaw({});
      setCorrelations({});
      setSiteLatest({});
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sitesParam = encodeURIComponent(selectedSites.join(","));
        const metricsParam = encodeURIComponent(selectedMetrics.join(","));
        const url = `/api/statistics/comparison?sites=${sitesParam}&dateRange=${dateRange}&metrics=${metricsParam}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load site comparison metrics");
        const json = await res.json();

        setTimeSeriesRaw(json.timeSeries || {});
        setCorrelations(json.correlations || {});
        setSiteLatest(json.siteLatest || {});

        // Keep active correlation tab in sync with selected sites
        if (!selectedSites.includes(activeCorrSite)) {
          setActiveCorrSite(selectedSites[0] || "");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching comparison data");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [selectedSites, selectedMetrics, dateRange, activeCorrSite]);

  // --- Search & Filter Sites ---
  const filteredSiteNames = useMemo(() => {
    return allSiteNames.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSiteNames, searchQuery]);

  // --- Recharts Data Preparation ---
  // We need to merge site-specific timelines into a single list sorted by date
  const chartData = useMemo(() => {
    const datesSet = new Set<string>();
    
    // Gather all unique dates
    Object.values(timeSeriesRaw).forEach((series: any[]) => {
      if (Array.isArray(series)) {
        series.forEach((pt) => {
          if (pt.date) datesSet.add(pt.date);
        });
      }
    });

    const sortedDates = Array.from(datesSet).sort();

    return sortedDates.map((dateStr) => {
      const row: Record<string, any> = { date: dateStr };
      selectedSites.forEach((site) => {
        const siteSeries = timeSeriesRaw[site] || [];
        const pt = siteSeries.find((p: any) => p.date === dateStr);
        if (pt) {
          selectedMetrics.forEach((m) => {
            if (pt[m] !== undefined) {
              row[`${site}_${m}`] = pt[m];
            }
          });
        }
      });
      return row;
    });
  }, [timeSeriesRaw, selectedSites, selectedMetrics]);

  // --- Check if dual Y-axis is needed ---
  // High range metrics: TDS, EC. Low range: pH, Temp, DO, WQI, AMR.
  const hasHighRange = selectedMetrics.some((m) => m === "tds" || m === "ec");
  const hasLowRange = selectedMetrics.some((m) => m !== "tds" && m !== "ec");
  const isDualAxis = hasHighRange && hasLowRange;

  // --- Checklist Toggle Handlers ---
  const handleToggleSite = (site: string) => {
    setSelectedSites((prev) => {
      if (prev.includes(site)) {
        const updated = prev.filter((s) => s !== site);
        if (activeCorrSite === site && updated.length > 0) {
          setActiveCorrSite(updated[0]);
        }
        return updated;
      } else {
        const updated = [...prev, site];
        if (!activeCorrSite) {
          setActiveCorrSite(site);
        }
        return updated;
      }
    });
  };

  const handleToggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key)
        ? prev.filter((m) => m !== key)
        : [...prev, key]
    );
  };

  const handleSelectAllSites = () => {
    setSelectedSites([...allSiteNames]);
  };

  const handleDeselectAllSites = () => {
    setSelectedSites([]);
  };

  // --- Custom Tooltip for Combined Chart ---
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Group tooltip payload by site for cleaner rendering
    const siteDataMap: Record<string, { metricName: string; value: number; unit: string; color: string }[]> = {};

    payload.forEach((item: any) => {
      const dataKey = item.dataKey; // e.g. "SiteA_ph"
      const separatorIdx = dataKey.lastIndexOf("_");
      if (separatorIdx === -1) return;

      const site = dataKey.substring(0, separatorIdx);
      const metricKey = dataKey.substring(separatorIdx + 1);

      const metricConfig = METRIC_OPTIONS.find((m) => m.key === metricKey);
      if (!metricConfig) return;

      if (!siteDataMap[site]) {
        siteDataMap[site] = [];
      }

      siteDataMap[site].push({
        metricName: metricConfig.name,
        value: item.value,
        unit: metricConfig.unit,
        color: item.stroke || metricConfig.color,
      });
    });

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl p-4 max-w-sm max-h-[400px] overflow-y-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {new Date(label).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <div className="space-y-3">
          {Object.entries(siteDataMap).map(([siteName, metrics], siteIdx) => {
            const siteColor = SITE_COLORS[selectedSites.indexOf(siteName) % SITE_COLORS.length];
            return (
              <div key={siteName} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                <p className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: siteColor }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: siteColor }} />
                  {siteName}
                </p>
                <div className="mt-1 space-y-1 pl-4">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-gray-600">
                      <span>{m.metricName}:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {m.value}
                        <span className="text-[10px] text-gray-400 font-normal ml-0.5">{m.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 tracking-tight">
            Site Comparison Dashboard
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Dynamically overlay and correlate data across different research sites
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-gray-600 font-semibold mr-1">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm cursor-pointer"
          >
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
            <option value="90days">Past 90 Days</option>
            <option value="1year">Past Year</option>
            <option value="all">All-time Data</option>
          </select>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ========================================== */}
        {/* 1. COLLAPSIBLE SITE SELECTOR SIDEBAR (LEFT) */}
        {/* ========================================== */}
        <div
          className={`shrink-0 transition-all duration-300 ${
            isSidebarOpen ? "w-full lg:w-[280px]" : "w-0 lg:w-0 overflow-hidden opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col max-h-[580px]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-800 text-base">Select Sites</span>
                <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-800 text-xs font-bold w-5.5 h-5.5 rounded-full">
                  {selectedSites.length}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 lg:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick bulk action */}
            <div className="px-4 pt-3 flex justify-between gap-2 text-xs">
              <button
                onClick={handleSelectAllSites}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAllSites}
                className="text-gray-500 hover:text-gray-700 font-bold hover:underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter site locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {filteredSiteNames.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">No matching sites found</p>
              ) : (
                filteredSiteNames.map((name) => {
                  const isChecked = selectedSites.includes(name);
                  const siteIdx = selectedSites.indexOf(name);
                  const siteColor = isChecked ? SITE_COLORS[siteIdx % SITE_COLORS.length] : "transparent";

                  return (
                    <label
                      key={name}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                        isChecked
                          ? "bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/60"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSite(name)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
                      </div>

                      {isChecked && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: siteColor }}
                        />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. ANALYTICS & DASHBOARD (RIGHT CONTENT) */}
        {/* ========================================== */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Controls Bar for Toggle Panels */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              {/* Toggle checklist sidebar */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer shadow-sm ${
                  isSidebarOpen ? "bg-indigo-50/50 border-indigo-100 text-indigo-700" : "bg-white"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                  {isSidebarOpen ? "Hide Sites" : "Show Sites"}
                </span>
              </button>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                Select Metrics
              </div>
            </div>

            {/* Metric pill toggles */}
            <div className="flex flex-wrap gap-2">
              {METRIC_OPTIONS.map((m) => {
                const isActive = selectedMetrics.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => handleToggleMetric(m.key)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                      isActive
                        ? "text-white shadow-md hover:brightness-105"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                    style={{
                      backgroundColor: isActive ? m.color : undefined,
                      borderColor: isActive ? m.color : undefined,
                    }}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading / Error overlay placeholders */}
          {loading && selectedSites.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Recalculating overlay charts and correlations...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 shadow-sm rounded-3xl p-8 flex items-center gap-4 text-red-700">
              <AlertCircle className="w-8 h-8 shrink-0 text-red-500" />
              <div>
                <p className="font-bold">Retrieval Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Zero site selection placeholder */}
          {selectedSites.length === 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">No Sites Selected</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                  Select one or more site locations in the checklist panel on the left to begin dynamic data overlays.
                </p>
              </div>
              <button
                onClick={handleSelectAllSites}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                Select All Sites
              </button>
            </div>
          )}

          {/* Zero metric selection placeholder */}
          {selectedSites.length > 0 && selectedMetrics.length === 0 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">No Metrics Selected</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                  Toggle at least one metric from the controls panel (pH, WQI, Temperature, TDS, etc.) to construct the time-series comparison chart.
                </p>
              </div>
              <button
                onClick={() => setSelectedMetrics(["ph", "temperature", "wqi"])}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                Load Default Metrics
              </button>
            </div>
          )}

          {/* ========================================== */}
          {/* 3. TIME SERIES CHART (OVERLAY) */}
          {/* ========================================== */}
          {!loading && selectedSites.length > 0 && selectedMetrics.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-gray-800 text-lg">
                  Multi-site Timeline Overlay
                </h3>
              </div>

              {chartData.length === 0 ? (
                <div className="h-[360px] flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl p-6">
                  <p className="text-sm font-bold text-gray-400">No overlapping date logs found</p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    The chosen sites have no sample entries recorded within the &quot;{dateRange}&quot; date filter. Try a broader date range.
                  </p>
                </div>
              ) : (
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 20, right: isDualAxis ? 20 : 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) =>
                          new Date(d).toLocaleDateString("en-ZA", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        tick={{ fontSize: 11, fontWeight: "600", fill: "#64748b" }}
                        tickMargin={8}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      
                      {/* Left Y-Axis */}
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fontWeight: "600", fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        label={{
                          value: isDualAxis ? "Low Range (pH, Temp, DO, WQI)" : "Value",
                          angle: -90,
                          position: "insideLeft",
                          offset: 15,
                          style: { fontSize: 11, fontWeight: "bold", fill: "#64748b" },
                        }}
                      />

                      {/* Right Y-Axis (Dual mode) */}
                      {isDualAxis && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11, fontWeight: "600", fill: "#64748b" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          label={{
                            value: "High Range (TDS, EC)",
                            angle: 90,
                            position: "insideRight",
                            offset: 15,
                            style: { fontSize: 11, fontWeight: "bold", fill: "#64748b" },
                          }}
                        />
                      )}

                      <Tooltip content={<CustomChartTooltip />} />
                      
                      {/* Draw lines dynamically for selectedSites * selectedMetrics */}
                      {selectedSites.flatMap((site, siteIdx) => {
                        const siteColor = SITE_COLORS[siteIdx % SITE_COLORS.length];
                        return selectedMetrics.map((metricKey) => {
                          const metricConfig = METRIC_OPTIONS.find((m) => m.key === metricKey);
                          if (!metricConfig) return null;

                          // Assign high range to right axis, low range to left
                          const isHigh = metricKey === "tds" || metricKey === "ec";
                          const yAxisId = isDualAxis ? (isHigh ? "right" : "left") : "left";

                          return (
                            <Line
                              key={`${site}_${metricKey}`}
                              yAxisId={yAxisId}
                              type="monotone"
                              dataKey={`${site}_${metricKey}`}
                              name={`${site} - ${metricConfig.name}`}
                              stroke={siteColor}
                              strokeDasharray={metricConfig.dashStyle}
                              strokeWidth={2}
                              dot={{ r: 2, fill: siteColor }}
                              activeDot={{ r: 5, strokeWidth: 1 }}
                              connectNulls
                            />
                          );
                        });
                      })}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 4. COMPARISON TABLE */}
          {/* ========================================== */}
          {!loading && selectedSites.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Table className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-gray-800 text-lg">
                  Latest Value Comparison Table
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-[160px]">
                        Site Location
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">
                        Risk Zone
                      </th>
                      {selectedMetrics.map((mKey) => {
                        const opt = METRIC_OPTIONS.find((o) => o.key === mKey);
                        return (
                          <th key={mKey} className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                            {opt?.name} {opt?.unit && `(${opt.unit})`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSites.map((site, siteIdx) => {
                      const latest = siteLatest[site];
                      const siteColor = SITE_COLORS[siteIdx % SITE_COLORS.length];

                      if (!latest) {
                        return (
                          <tr key={site}>
                            <td className="px-4 py-3.5 font-bold text-gray-700 whitespace-nowrap flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: siteColor }} />
                              {site}
                            </td>
                            <td colSpan={selectedMetrics.length + 1} className="px-4 py-3.5 text-xs text-gray-400 italic">
                              No data recorded for this site.
                            </td>
                          </tr>
                        );
                      }

                      // Color mapping for danger zone
                      const zoneBadgeColor: Record<string, string> = {
                        red: "bg-red-100 text-red-800 border-red-200",
                        yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
                        green: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        blue: "bg-blue-100 text-blue-800 border-blue-200",
                        grey: "bg-gray-100 text-gray-800 border-gray-200",
                      };

                      const zoneLabels: Record<string, string> = {
                        red: "High Risk",
                        yellow: "Moderate",
                        green: "Low Risk",
                        blue: "Unknown",
                      };

                      return (
                        <tr key={site} className="hover:bg-gray-50/50">
                          {/* Site info */}
                          <td className="px-4 py-3.5 font-extrabold text-gray-800 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: siteColor }} />
                              {site}
                            </div>
                            <span className="text-[10px] font-normal text-gray-400 block ml-4 mt-0.5">
                              Latest: {latest.sampleName}
                            </span>
                          </td>

                          {/* Risk Zone */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              zoneBadgeColor[latest.dangerZone] || zoneBadgeColor.grey
                            }`}>
                              {zoneLabels[latest.dangerZone] || "N/A"}
                            </span>
                          </td>

                          {/* Metric values */}
                          {selectedMetrics.map((mKey) => {
                            let rawVal = latest[mKey];
                            if (mKey === "amrGeneCount" && latest.amrResGenes) {
                              rawVal = latest.amrResGenes
                                .split(",")
                                .map((g: string) => g.trim())
                                .filter((g: string) => g.length > 0).length;
                            }
                            
                            const formattedVal = rawVal != null ? Number(rawVal).toFixed(1) : "—";
                            const qualityClass = getQualityStyle(mKey, rawVal);

                            return (
                              <td key={mKey} className="px-4 py-3.5 whitespace-nowrap font-semibold">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${qualityClass}`}>
                                  {formattedVal}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 5. PEARSON CORRELATION MATRIX */}
          {/* ========================================== */}
          {!loading && selectedSites.length > 0 && selectedMetrics.length >= 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-gray-800 text-lg">
                    Metric Correlations
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-xl">
                  Pearson r correlation coefficient ranges from -1.00 (strong negative, red) to +1.00 (strong positive, green). A value of 0.00 (white) indicates no correlation.
                </p>
              </div>

              {/* Site Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
                {selectedSites.map((site, siteIdx) => {
                  const siteColor = SITE_COLORS[siteIdx % SITE_COLORS.length];
                  const isActive = activeCorrSite === site;
                  return (
                    <button
                      key={site}
                      onClick={() => setActiveCorrSite(site)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-indigo-50 text-indigo-800 border-indigo-200 shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: siteColor }} />
                      {site}
                    </button>
                  );
                })}
              </div>

              {/* Active Site Heatmap */}
              {activeCorrSite && correlations[activeCorrSite] ? (
                <div className="max-w-xl">
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-center border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-3.5 font-bold text-gray-500 text-xs w-[120px] text-left pl-4 uppercase">
                            Metric
                          </th>
                          {selectedMetrics.map((mKey) => (
                            <th key={mKey} className="px-3 py-3.5 font-bold text-gray-600 text-xs uppercase">
                              {METRIC_OPTIONS.find((o) => o.key === mKey)?.name.replace(" Level", "")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMetrics.map((rowMetric) => (
                          <tr key={rowMetric} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/20">
                            {/* Row metric title */}
                            <td className="px-3 py-3.5 font-bold text-gray-700 text-xs text-left pl-4 uppercase bg-gray-50/30">
                              {METRIC_OPTIONS.find((o) => o.key === rowMetric)?.name.replace(" Level", "")}
                            </td>

                            {/* Correlation cells */}
                            {selectedMetrics.map((colMetric) => {
                              let r = 1.0;
                              if (rowMetric !== colMetric) {
                                // Lookup both row_vs_col and col_vs_row keys
                                const key1 = `${rowMetric}_vs_${colMetric}`;
                                const key2 = `${colMetric}_vs_${rowMetric}`;
                                r = correlations[activeCorrSite][key1] !== undefined
                                  ? correlations[activeCorrSite][key1]
                                  : correlations[activeCorrSite][key2] !== undefined
                                  ? correlations[activeCorrSite][key2]
                                  : 0;
                              }

                              // Color cell based on Pearson coefficient (-1 to 1)
                              let cellStyle = "bg-white text-gray-800 border-gray-100";
                              if (rowMetric === colMetric) {
                                cellStyle = "bg-gray-100 text-gray-400 border-gray-200/50 font-medium";
                              } else if (r > 0.6) {
                                cellStyle = "bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold";
                              } else if (r > 0.2) {
                                cellStyle = "bg-emerald-50 text-emerald-700 border-emerald-100/50 font-bold";
                              } else if (r < -0.6) {
                                cellStyle = "bg-red-100 text-red-800 border-red-200 font-extrabold";
                              } else if (r < -0.2) {
                                cellStyle = "bg-red-50 text-red-700 border-red-100/50 font-bold";
                              }

                              return (
                                <td key={colMetric} className="p-1">
                                  <div className={`py-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-center ${cellStyle}`}>
                                    {rowMetric === colMetric ? "—" : r.toFixed(2)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-2">
                  No correlation matrix available for this site. Ensure at least two metrics are active and have corresponding logged timeline entries.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
