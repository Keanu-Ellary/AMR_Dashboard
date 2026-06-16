"use client";

import React, { useState, useEffect, Suspense } from "react";
import TimeSeriesDashboard from "@/components/TimeSeriesDashboard";
import { useSearchParams } from "next/navigation";
import { MapPin, Download, Plus, List, TrendingUp, BarChart3 } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import { exportStatistics, ExportFormat } from "@/functions/statistics/exportData";
import { toast } from "react-toastify";
import Link from "next/link";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";
import { StatisticsProvider, useStatistics } from "@/components/StatisticsContext";
import IndependentGraph from "@/components/IndependentGraph";
import StatisticsFilterPanel from "@/components/StatisticsFilterPanel";

export const dynamic = "force-dynamic";

function VisualizationsContent() {
  const { graphs, activeGraphId, addGraph } = useStatistics();
  const searchParams = useSearchParams();
  const siteIdParam = searchParams.get("site");
  const siteId = siteIdParam ? parseInt(siteIdParam) : null;
  const locationName = searchParams.get("location");

  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [allSites, setAllSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [waterQualityPercent, setWaterQualityPercent] = useState(0);
  const [siteAnomalies, setSiteAnomalies] = useState<{ issues: string; changes: number }[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportSiteSpecific = (format: ExportFormat) => {
    const exportData = [
      { field: "Sample Name", value: siteData?.sampleName || "N/A" },
      { field: "Location", value: siteData?.geoLocName || "N/A" },
      { field: "Collection Date", value: siteData?.collectionDate ? new Date(siteData.collectionDate).toLocaleDateString() : "N/A" },
      { field: "Water Temperature (°C)", value: siteData?.temperature?.toFixed(1) || "N/A" },
      { field: "pH Level", value: siteData?.ph?.toFixed(1) || "N/A" },
      { field: "TDS (mg/L)", value: siteData?.tds?.toFixed(1) || "N/A" },
      { field: "Dissolved O₂ (mg/L)", value: siteData?.dissolvedO2?.toFixed(2) || "N/A" },
      { field: "Water Quality %", value: waterQualityPercent.toFixed(1) },
      { field: "AMR Resistance Genes", value: siteData?.amrResGenes || "N/A" },
    ];

    if (siteAnomalies.length > 0) {
      exportData.push({ field: "---Anomalies---", value: "" });
      siteAnomalies.forEach((anomaly) => {
        exportData.push({ field: anomaly.issues, value: anomaly.changes.toFixed(2) });
      });
    }

    const res = exportStatistics(exportData, format, `site_${siteData?.sampleName || "statistics"}`);
    if (res && res.status == 200) {
      toast.success("Statistics exported successfully");
    } else {
      toast.error("Could not export statistics");
    }
    setShowExportMenu(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allSitesRes] = await Promise.all([fetch(`/api/site`)]);
        if (allSitesRes.ok) {
          const allSitesData = await allSitesRes.json();
          setAllSites(allSitesData.sites || []);
        }

        if (siteId) {
          const [siteRes, waterQualityRes, siteAnomalyRes] = await Promise.all([
            fetch(`/api/site/${siteId}`),
            fetch(`/api/statistics/waterQuality?siteId=${siteId}`),
            fetch(`/api/statistics/anomalyForSite?siteId=${siteId}`),
          ]);

          if (siteRes.ok) {
            const siteDataRes = await siteRes.json();
            setSiteData(siteDataRes.site);
          }
          if (waterQualityRes.ok) {
            const waterRes = await waterQualityRes.json();
            setWaterQualityPercent(waterRes.results?.[0]?.WQI || 0);
          }
          if (siteAnomalyRes.ok) {
            const siteAnomalyDataRes = await siteAnomalyRes.json();
            setSiteAnomalies(siteAnomalyDataRes);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteId]);

  if (loading) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 animate-pulse font-bold">Initializing Visualizations Engine...</p>
        </div>
      </main>
    );
  }

  const ExportDropdown = ({ onExport }: { onExport: (format: ExportFormat) => void }) => (
    <div className="relative inline-block">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold shadow-sm"
      >
        <Download size={18} />
        Export
      </button>
      {showExportMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="py-1">
            {["csv", "tsv", "json"].map((format) => (
              <button
                key={format}
                onClick={() => onExport(format as ExportFormat)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm font-bold uppercase tracking-wide"
              >
                Export as {format}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // LOCATION-SPECIFIC DASHBOARD
  if (siteId && siteData) {
    const locName = locationName || parseLocationName(siteData.geoLocName);
    const locationIsolates = allSites.filter((s) => parseLocationName(s.geoLocName) === parseLocationName(locName));
    const totalSamples = locationIsolates.length;
    const sums = { ph: 0, temp: 0, do: 0, tds: 0 };
    const counts = { ph: 0, temp: 0, do: 0, tds: 0 };

    locationIsolates.forEach((s) => {
      if (s.ph != null) { sums.ph += s.ph; counts.ph++; }
      if (s.temperature != null) { sums.temp += s.temperature; counts.temp++; }
      if (s.dissolvedO2 != null) { sums.do += s.dissolvedO2; counts.do++; }
      if (s.tds != null) { sums.tds += s.tds; counts.tds++; }
    });

    const locAverages = {
      ph: counts.ph > 0 ? sums.ph / counts.ph : null,
      temp: counts.temp > 0 ? sums.temp / counts.temp : null,
      do: counts.do > 0 ? sums.do / counts.do : null,
      tds: counts.tds > 0 ? sums.tds / counts.tds : null,
    };

    return (
      <main className="flex-1 overflow-auto p-8 bg-slate-50/50 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-slate-600" />
              {locName} - Visualizations
            </h1>
            <p className="text-sm text-slate-500 font-medium italic">Detailed time-series analysis and historical trends for this location</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/statistics?site=${siteId}${locationName ? `&location=${encodeURIComponent(locationName)}` : ""}`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors font-medium"
            >
              <List size={18} />
              View Samples & Geolocations
            </Link>
            <ExportDropdown onExport={handleExportSiteSpecific} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Samples", value: totalSamples, color: "text-slate-900", sub: "Total recordings" },
            { label: "Avg pH", value: locAverages.ph?.toFixed(1) || "—", color: "text-slate-900", sub: "Ideal: 7.0 - 7.5" },
            { label: "Avg Temp", value: locAverages.temp ? `${locAverages.temp.toFixed(1)}°C` : "—", color: "text-slate-900", sub: "Ideal: 15°C-25°C" },
            { label: "Avg DO", value: locAverages.do ? `${locAverages.do.toFixed(2)}` : "—", color: "text-slate-900", sub: "Ideal: ≥ 8 mg/L" },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1 transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</span>
              <span className={`text-3xl font-black ${kpi.color} mt-1`}>{kpi.value}</span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{kpi.sub}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <h3 className="font-black text-slate-900 text-lg mb-6">Temporal Trends</h3>
            <TimeSeriesDashboard siteId={siteId} />
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <h3 className="font-black text-slate-900 text-lg mb-6">Parameter Averages</h3>
              <div className="space-y-4">
                {[
                  { label: "pH Level", val: locAverages.ph?.toFixed(2) },
                  { label: "Temperature", val: locAverages.temp ? `${locAverages.temp.toFixed(2)}°C` : null },
                  { label: "Dissolved O₂", val: locAverages.do ? `${locAverages.do.toFixed(2)} mg/L` : null },
                  { label: "TDS", val: locAverages.tds ? `${locAverages.tds.toFixed(1)} mg/L` : null },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-500 font-bold text-xs uppercase">{item.label}</span>
                    <span className="font-black text-slate-800 text-sm">{item.val || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {siteAnomalies.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                <h3 className="font-black text-slate-900 text-lg mb-6">Location Anomalies</h3>
                <div className="space-y-3">
                  {siteAnomalies.map((anomaly, index) => (
                    <div key={index} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center animate-pulse">
                      <p className="font-bold text-amber-900 text-xs">{anomaly.issues}</p>
                      <span className="font-black text-amber-600 text-sm">{anomaly.changes.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // SYSTEM-WIDE VIEW (Multi-graph Layout)
  return (
    <main className="h-screen flex flex-col bg-slate-50/50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
          <div className="flex flex-col gap-10 pb-20">
            {graphs.map((config) => (
              <IndependentGraph
                key={config.id}
                config={config}
                isActive={activeGraphId === config.id}
              />
            ))}
            
            <button
              onClick={addGraph}
              className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 hover:bg-white hover:border-slate-300 hover:text-slate-900 text-slate-400 transition-all group"
            >
              <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-slate-200 group-hover:text-slate-900 transition-all">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-lg font-black tracking-tight">Add New Visualization</span>
            </button>

            {graphs.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-12">
                <p className="text-sm font-bold text-slate-400">No active visualizations. Click above to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Panel */}
        <StatisticsFilterPanel />
      </div>
    </main>
  );
}

export default function VisualizationsPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-400 font-bold">Waking up visualizations engine...</p>
        </div>
      </main>
    }>
      <StatisticsProvider>
        <VisualizationsContent />
      </StatisticsProvider>
    </Suspense>
  );
}
