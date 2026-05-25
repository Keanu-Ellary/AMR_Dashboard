"use client";

import React, { useState, useEffect, Suspense } from "react";
import TimeSeriesDashboard from "@/components/TimeSeriesDashboard";
import TimeSeriesDashboardOverall from "@/components/TimeSeriesDashboardOverall";
import { useSearchParams } from "next/navigation";
import { MapPin, TrendingUp, TrendingDown, Download, AlertTriangle } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import { exportStatistics, ExportFormat } from "@/functions/statistics/exportData";
import { toast } from "react-toastify";
import WaterQualityFormula from "@/components/WaterQualityFormula";
import SiteComparisonDashboard from "@/components/SiteComparisonDashboard";
import Link from "next/link";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";

export const dynamic = "force-dynamic";



interface AverageMetrics {
  avgpH: number;
  avgTemp: number;
  avgDiss: number;
  avgTDS: number;
}

interface TrendData {
  currScore: number;
  prevScore: number;
  trend: string;
}

interface Anomaly {
  id: number;
  sampleName: string;
  issues: string;
  changes: number;
}

interface WQIData {
  id: number;
  WQI: number;
}

function StatisticsContent() {
  const searchParams = useSearchParams();
  const siteIdParam = searchParams.get("site");
  const siteId = siteIdParam ? parseInt(siteIdParam) : null;
  const locationName = searchParams.get("location");

  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [allSites, setAllSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterQualityPercent, setWaterQualityPercent] = useState(0);
  const [averageMetrics, setAverageMetrics] = useState<AverageMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [siteAnomalies, setSiteAnomalies] = useState<Anomaly[]>([]);
  const [wqiData, setWqiData] = useState<WQIData[]>([]);
  const [timeInUnsafe, setTimeInUnsafe] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);


  const handleExportSiteSpecific = (format: ExportFormat) => {
    const exportData = [
      {
        field: "Sample Name",
        value: siteData?.sampleName || "N/A",
      },
      {
        field: "Location",
        value: siteData?.geoLocName || "N/A",
      },
      {
        field: "Collection Date",
        value: siteData?.collectionDate ? new Date(siteData.collectionDate).toLocaleDateString() : "N/A",
      },
      {
        field: "Latitude",
        value: siteData?.latitude?.toFixed(5) || "N/A",
      },
      {
        field: "Longitude",
        value: siteData?.longitude?.toFixed(5) || "N/A",
      },
      {
        field: "Water Temperature (°C)",
        value: siteData?.temperature?.toFixed(1) || "N/A",
      },
      {
        field: "pH Level",
        value: siteData?.ph?.toFixed(1) || "N/A",
      },
      {
        field: "TDS (mg/L)",
        value: siteData?.tds?.toFixed(1) || "N/A",
      },
      {
        field: "Dissolved O₂ (mg/L)",
        value: siteData?.dissolvedO2?.toFixed(2) || "N/A",
      },
      {
        field: "EC (µS/cm)",
        value: siteData?.ec?.toFixed(1) || "N/A",
      },
      {
        field: "Water Quality %",
        value: waterQualityPercent.toFixed(1),
      },
      {
        field: "Time in Unsafe Zone (hours)",
        value: timeInUnsafe?.toFixed(1) || "N/A",
      },
      {
        field: "Isolation Source",
        value: siteData?.isolationSource || "N/A",
      },
      {
        field: "AMR Resistance Genes",
        value: siteData?.amrResGenes || "N/A",
      },
      {
        field: "Predicted SIR",
        value: siteData?.predictedSir || "N/A",
      },
      {
        field: "Sample Analysis Type",
        value: siteData?.sampleAnalysisType || "N/A",
      },
    ];


    if (siteAnomalies.length > 0) {
      exportData.push({ field: "---Anomalies---", value: "" });
      siteAnomalies.forEach((anomaly) => {
        exportData.push({
          field: anomaly.issues,
          value: anomaly.changes.toFixed(2),
        });
      });
    }

    const res = exportStatistics(exportData, format, `site_${siteData?.sampleName || "statistics"}`);
    if (res && res.status == 200) {
      toast.success("Statistics exported successfully")
    } else {
      toast.error("Could not export statistics")
    }
    setShowExportMenu(false);
  };

  const handleExportSystemWide = (format: ExportFormat) => {
    const exportData: any[] = [];


    if (averageMetrics) {
      exportData.push({
        section: "System Averages",
        metric: "Average pH",
        value: averageMetrics.avgpH.toFixed(1),
      },
        {
          section: "System Averages",
          metric: "Average Temperature (°C)",
          value: averageMetrics.avgTemp.toFixed(1),
        },
        {
          section: "System Averages",
          metric: "Average Dissolved O₂ (mg/L)",
          value: averageMetrics.avgDiss.toFixed(2),
        },
        {
          section: "System Averages",
          metric: "Average TDS (mg/L)",
          value: averageMetrics.avgTDS.toFixed(1),
        });
    }


    if (trendData) {
      exportData.push(
        {
          section: "Water Quality Trend (Last 7 Days)",
          metric: "Current Score (%)",
          value: (trendData.currScore * 100).toFixed(1),
        },
        {
          section: "Water Quality Trend (Last 7 Days)",
          metric: "Previous Score (%)",
          value: (trendData.prevScore * 100).toFixed(1),
        },
        {
          section: "Water Quality Trend (Last 7 Days)",
          metric: "Overall Trend",
          value: trendData.trend,
        },
        {
          section: "Water Quality Trend (Last 7 Days)",
          metric: "Change (%)",
          value: ((trendData.currScore - trendData.prevScore) * 100).toFixed(1),
        }
      );
    }


    if (anomalies.length > 0) {
      anomalies.forEach((anomaly) => {
        exportData.push({
          section: "Detected Anomalies",
          metric: anomaly.sampleName,
          submetric: anomaly.issues,
          value: anomaly.changes.toFixed(2),
        });
      });
    }


    if (wqiData.length > 0) {
      wqiData.forEach((site) => {
        exportData.push({
          section: "Water Quality Index (All Sites)",
          metric: `Site ${site.id}`,
          value: site.WQI.toFixed(1),
        });
      });
    }

    const res = exportStatistics(exportData, format, "system_statistics");
    if (res && res.status == 200) {
      toast.success("Statistics exported successfully")
    } else {
      toast.error("Could not export statistics")
    }
    setShowExportMenu(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {

        const [averageRes, trendRes, anomalyRes, wqiRes, allSitesRes] = await Promise.all([
          fetch(`/api/statistics/averageMetrics`),
          fetch(`/api/statistics/trendOverTime`),
          fetch(`/api/statistics/anomalyPerSite`),
          fetch(`/api/statistics/waterQualityIndex`),
          fetch(`/api/site`),
        ]);

        if (allSitesRes.ok) {
          const allSitesData = await allSitesRes.json();
          setAllSites(allSitesData.sites || []);
        }

        if (averageRes.ok) {
          const avgData = await averageRes.json();
          setAverageMetrics(avgData);
        }

        if (trendRes.ok) {
          const trendDataRes = await trendRes.json();
          setTrendData(trendDataRes);
        }

        if (anomalyRes.ok) {
          const anomalyDataRes = await anomalyRes.json();
          setAnomalies(anomalyDataRes.anomalies || []);
        }

        if (wqiRes.ok) {
          const wqiDataRes = await wqiRes.json();
          setWqiData(wqiDataRes);
        }

        // If site ID provided, fetch site-specific data
        if (siteId) {
          const [siteRes, waterQualityRes, timeInUnsafeRes, siteAnomalyRes] = await Promise.all([
            fetch(`/api/site/${siteId}`),
            fetch(`/api/statistics/waterQuality?siteId=${siteId}`),
            fetch(`/api/statistics/timeInUnsafe?siteId=${siteId}`),
            fetch(`/api/statistics/anomalyForSite?siteId=${siteId}`),
          ]);

          if (!siteRes.ok) {
            throw new Error("Failed to fetch site data");
          }

          const siteDataRes = await siteRes.json();
          setSiteData(siteDataRes.site);
          
          if (waterQualityRes.ok) {
            const waterRes = await waterQualityRes.json();
            setWaterQualityPercent(waterRes.results?.[0]?.WQI || 0);
          }
          if (timeInUnsafeRes.ok) {
            const timeRes = await timeInUnsafeRes.json();
            setTimeInUnsafe(timeRes.totalRedTime || 0);
          }

          if (siteAnomalyRes.ok) {
            const siteAnomalyDataRes = await siteAnomalyRes.json();
            setSiteAnomalies(siteAnomalyDataRes);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
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
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      </main>
    );
  }

  const getDefaultImage = () => {
    // Use the login background image as default placeholder
    return "/login-bg.jpg";
  };

 
  const ExportDropdown = ({ onExport }: { onExport: (format: ExportFormat) => void }) => (
    <div className="relative inline-block">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
      >
        <Download size={18} />
        Export
      </button>

      {showExportMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
          <div className="py-2">
            <button
              onClick={() => onExport("csv")}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              Export as CSV
            </button>
            <button
              onClick={() => onExport("tsv")}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              Export as TSV
            </button>
            <button
              onClick={() => onExport("json")}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              { } Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // LOCATION-SPECIFIC DASHBOARD
  if (siteId && siteData) {
    const locName = locationName || parseLocationName(siteData.geoLocName);
    
    // Filter isolates belonging to this location name
    const locationIsolates = allSites.filter(
      (s) => parseLocationName(s.geoLocName) === parseLocationName(locName)
    );

    // Compute dynamic averages for this location
    const totalSamples = locationIsolates.length;
    let phSum = 0, phCount = 0;
    let tempSum = 0, tempCount = 0;
    let doSum = 0, doCount = 0;
    let tdsSum = 0, tdsCount = 0;

    locationIsolates.forEach((s) => {
      if (s.ph !== null && s.ph !== undefined) { phSum += s.ph; phCount++; }
      if (s.temperature !== null && s.temperature !== undefined) { tempSum += s.temperature; tempCount++; }
      if (s.dissolvedO2 !== null && s.dissolvedO2 !== undefined) { doSum += s.dissolvedO2; doCount++; }
      if (s.tds !== null && s.tds !== undefined) { tdsSum += s.tds; tdsCount++; }
    });

    const locAverages = {
      ph: phCount > 0 ? phSum / phCount : null,
      temp: tempCount > 0 ? tempSum / tempCount : null,
      do: doCount > 0 ? doSum / doCount : null,
      tds: tdsCount > 0 ? tdsSum / tdsCount : null,
    };

    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
              <MapPin className="h-6 w-6 text-indigo-600" />
              {locName} - Location Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Historical trends, water diagnostics, and sample inventory for this location
            </p>
          </div>
          <ExportDropdown onExport={handleExportSiteSpecific} />
        </div>

        {/* Dynamic Aggregates Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 transition-all hover:shadow-md">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Samples Taken</span>
            <span className="text-3xl font-black text-indigo-950 mt-1">{totalSamples}</span>
            <span className="text-xs text-indigo-500 font-semibold mt-1">Across all historical dates</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 transition-all hover:shadow-md">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg pH Level</span>
            <span className="text-3xl font-black text-blue-600 mt-1">{locAverages.ph ? locAverages.ph.toFixed(1) : "—"}</span>
            <span className="text-xs text-blue-500 font-semibold mt-1">Ideal range: 7.0 - 7.5</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 transition-all hover:shadow-md">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Temperature</span>
            <span className="text-3xl font-black text-emerald-600 mt-1">{locAverages.temp ? `${locAverages.temp.toFixed(1)}°C` : "—"}</span>
            <span className="text-xs text-emerald-500 font-semibold mt-1">Ideal range: 15°C - 25°C</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 transition-all hover:shadow-md">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Dissolved O₂</span>
            <span className="text-3xl font-black text-orange-600 mt-1">{locAverages.do ? `${locAverages.do.toFixed(2)} mg/L` : "—"}</span>
            <span className="text-xs text-orange-500 font-semibold mt-1">Ideal: ≥ 8 mg/L</span>
          </div>
        </div>

        {/* Detailed Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
          {/* Time Series Dashboard (Takes 2 columns) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-extrabold text-indigo-950 text-base mb-4">Location Time-Series Trends</h3>
              <TimeSeriesDashboard siteId={siteId} />
            </div>
          </div>

          {/* Right Column: Location Averages & Anomalies */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Average Parameters summary */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
              <h3 className="font-extrabold text-indigo-950 text-base">Historical Parameter Averages</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Average pH:</span>
                  <span className="font-bold text-slate-800">{locAverages.ph ? locAverages.ph.toFixed(2) : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Average Temp:</span>
                  <span className="font-bold text-slate-800">{locAverages.temp ? `${locAverages.temp.toFixed(2)}°C` : "—"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Average Dissolved O₂:</span>
                  <span className="font-bold text-slate-800">{locAverages.do ? `${locAverages.do.toFixed(2)} mg/L` : "—"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-medium">Average TDS:</span>
                  <span className="font-bold text-slate-800">{locAverages.tds ? `${locAverages.tds.toFixed(1)} mg/L` : "—"}</span>
                </div>
              </div>
            </div>

            {/* Location-specific anomalies */}
            {siteAnomalies.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-extrabold text-indigo-950 text-base mb-4">Location Anomalies</h3>
                <div className="space-y-3">
                  {siteAnomalies.map((anomaly, index) => (
                    <div key={index} className="bg-yellow-50/60 p-4 rounded-2xl border border-yellow-200/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{anomaly.issues}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-yellow-600">{anomaly.changes.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500">Change magnitude</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Isolate Inventory for this Location */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 max-w-[1400px]">
          <div className="mb-4">
            <h3 className="font-extrabold text-indigo-950 text-base">Isolates & Samples Inventory</h3>
            <p className="text-xs text-gray-500">All recorded water sample collections taken at this geographic coordinate</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Sample Name</th>
                  <th className="px-6 py-3.5 text-left">Organism</th>
                  <th className="px-6 py-3.5 text-left">Collection Date</th>
                  <th className="px-6 py-3.5 text-center">WQI Score</th>
                  <th className="px-6 py-3.5 text-center">Risk Zone</th>
                  <th className="px-6 py-3.5 text-left">AMR Genes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-sm text-slate-600 font-medium">
                {locationIsolates.map((iso) => {
                  const wqi = calculateWQI(iso.dissolvedO2, iso.ph, iso.temperature, iso.tds);
                  return (
                    <tr key={iso.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{iso.sampleName}</td>
                      <td className="px-6 py-4 italic">{iso.orgamism || "—"}</td>
                      <td className="px-6 py-4">
                        {new Date(iso.collectionDate).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center font-black">
                        {wqi !== null ? wqi.toFixed(1) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize shadow-sm border ${
                          iso.dangerZone === "red"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : iso.dangerZone === "yellow"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {iso.dangerZone}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs truncate max-w-[150px]" title={iso.amrResGenes}>
                        {iso.amrResGenes || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/samples?id=${iso.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    );
  }

  // SYSTEM-WIDE VIEW (no site selected)
  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto w-full">
        <SiteComparisonDashboard />
      </div>
    </main>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </main>
    }>
      <StatisticsContent />
    </Suspense>
  );
}