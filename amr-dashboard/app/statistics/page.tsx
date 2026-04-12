"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";
import type { SiteData } from "@/types/site_types";

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
  issues: string;
  changes: number;
}

interface WQIData {
  id: number;
  WQI: number;
}

function StatisticsContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");
  
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterQualityPercent, setWaterQualityPercent] = useState(0);
  const [averageMetrics, setAverageMetrics] = useState<AverageMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [siteAnomalies, setSiteAnomalies] = useState<Anomaly[]>([]);
  const [wqiData, setWqiData] = useState<WQIData[]>([]);
  const [timeInUnsafe, setTimeInUnsafe] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const [averageRes, trendRes, anomalyRes, wqiRes] = await Promise.all([
          fetch(`/api/statistics/averageMetrics`),
          fetch(`/api/statistics/trendOverTime`),
          fetch(`/api/statistics/anomalyPerSite`),
          fetch(`/api/statistics/waterQualityIndex`),
        ]);

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
            setWaterQualityPercent(waterRes.percentageClean || 0);
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

  // SITE-SPECIFIC VIEW
  if (siteId && siteData) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{siteData.sampleName} - Statistics</h1>
          <p className="text-gray-600 mt-2">Detailed metrics for this sampling site</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto w-full">
          
          {/* Left Column (Info Card & Water Quality) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            
            {/* Location Info Card */}
            <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100">
              <div className="rounded-xl overflow-hidden mb-4 h-40 bg-gray-200">
                {siteData.imageBase64 ? (
                  <img src={siteData.imageBase64} alt={siteData.sampleName} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                    No image available
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={16} className="text-gray-700"/>
                {siteData.sampleName}
              </h3>
              <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p><strong>GPS Coordinates:</strong> {siteData.latitude.toFixed(5)}° S, {siteData.longitude.toFixed(5)}° E</p>
                <p><strong>Zone:</strong> {siteData.dangerZone || "Unknown"}</p>
                <p><strong>Region:</strong> {siteData.geoLocName}</p>
                <p><strong>Collection Date:</strong> {siteData.collectionDate ? new Date(siteData.collectionDate).toLocaleDateString() : "N/A"}</p>
                <p className="mt-2 text-gray-800 font-semibold flex items-center gap-2">Water Temperature: {siteData.temperature?.toFixed(1) || "N/A"}°C</p>
                <p><strong>pH:</strong> {siteData.ph?.toFixed(1) || "N/A"}</p>
                <p><strong>TDS:</strong> {siteData.tds?.toFixed(1) || "N/A"} mg/L</p>
                <p><strong>EC:</strong> {siteData.ec?.toFixed(1) || "N/A"} µS/cm</p>
                <p><strong>DO:</strong> {siteData.dissolvedO2?.toFixed(2) || "N/A"} mg/L</p>
                <p className="font-bold mt-2">Isolation Source: <span className="font-normal">{siteData.isolationSource}</span></p>
              </div>
            </div>

            {/* Water Quality Donut */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
               <div className="relative w-32 h-32 mb-4">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      className="text-gray-100"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${Math.max(0, Math.min(100, waterQualityPercent))}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-800">
                      {waterQualityPercent >= 0 && waterQualityPercent <= 100 
                        ? waterQualityPercent.toFixed(0)
                        : "N/A"}%
                    </span>
                  </div>
              </div>
              <h3 className="font-bold text-xl text-gray-900">Water Quality</h3>
              <div className="flex gap-4 mt-4 text-sm font-medium">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Clean</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-200 rounded-sm"></span> Contaminated</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Water Quality Metrics */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-indigo-900 font-bold text-lg mb-4">Water Quality Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">pH Level</p>
                  <p className="text-2xl font-bold text-blue-600">{siteData.ph?.toFixed(1) || "N/A"}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold text-green-600">{siteData.temperature?.toFixed(1) || "N/A"}°C</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dissolved O₂</p>
                  <p className="text-2xl font-bold text-orange-600">{siteData.dissolvedO2?.toFixed(2) || "N/A"} mg/L</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">TDS</p>
                  <p className="text-2xl font-bold text-purple-600">{siteData.tds?.toFixed(1) || "N/A"} mg/L</p>
                </div>
              </div>
            </div>

            {/* Time In Unsafe */}
            {timeInUnsafe !== null && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-indigo-900 font-bold text-lg mb-4">Time in Unsafe Zone</h3>
                <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total time in unsafe conditions</p>
                  <p className="text-4xl font-bold text-red-600">{timeInUnsafe.toFixed(1)}</p>
                  <p className="text-xs text-gray-600 mt-2">Hours</p>
                </div>
              </div>
            )}

            {/* Sample Information */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-indigo-900 font-bold text-lg mb-4">Sample Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample Analysis Type:</span>
                  <span className="font-semibold text-gray-800">{siteData.sampleAnalysisType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AMR Resistance Genes:</span>
                  <span className="font-semibold text-gray-800">{siteData.amrResGenes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted SIR:</span>
                  <span className="font-semibold text-gray-800">{siteData.predictedSir}</span>
                </div>
              </div>
            </div>

            {/* Detected Anomalies for This Site */}
            {siteAnomalies.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-indigo-900 font-bold text-lg mb-4">Detected Anomalies</h3>
                <div className="space-y-3">
                  {siteAnomalies.map((anomaly, index) => (
                    <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{anomaly.issues}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600">{anomaly.changes.toFixed(2)}</p>
                        <p className="text-xs text-gray-600">Change magnitude</p>
                      </div>
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

  // SYSTEM-WIDE VIEW (no site selected)
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Statistics</h1>
        <p className="text-gray-600 mt-2">Overall metrics across all sampling sites</p>
      </div>

      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        
        {/* System-wide Averages */}
        {averageMetrics && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-indigo-900 font-bold text-lg">Water Quality Metrics - System Averages</h3>
              <p className="text-sm text-gray-600 mt-1">Average measurements across all sampling sites in the system</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">pH Level</p>
                    <p className="text-xs text-gray-600 mt-1">Acidity/Alkalinity</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600">{averageMetrics.avgpH.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-2">(Scale: 0-14)</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Temperature</p>
                    <p className="text-xs text-gray-600 mt-1">Water Warmth</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">{averageMetrics.avgTemp.toFixed(1)}<span className="text-lg">°C</span></p>
                <p className="text-xs text-gray-500 mt-2">Degrees Celsius</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Dissolved O₂</p>
                    <p className="text-xs text-gray-600 mt-1">Oxygen Content</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-600">{averageMetrics.avgDiss.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">mg/Liter</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">TDS</p>
                    <p className="text-xs text-gray-600 mt-1">Dissolved Solids</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600">{averageMetrics.avgTDS.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-2">mg/Liter</p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Trend */}
        {trendData && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-indigo-900 font-bold text-lg">Water Quality Trend (Last 7 Days)</h3>
              <p className="text-sm text-gray-600 mt-1">Comparison of water quality between current period and previous period</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Score */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Current Score (Last 7 Days)</p>
                <p className="text-4xl font-bold text-blue-600 mb-2">{(trendData.currScore * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Percentage of sites with good quality</p>
              </div>

              {/* Previous Score */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Previous Score (7 Days Prior)</p>
                <p className="text-4xl font-bold text-gray-600 mb-2">{(trendData.prevScore * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Percentage of sites with good quality</p>
              </div>

              {/* Trend Direction */}
              <div className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center ${
                trendData.trend === "Improving" ? "bg-green-50 border-green-200" :
                trendData.trend === "Worsening" ? "bg-red-50 border-red-200" :
                "bg-yellow-50 border-yellow-200"
              }`}>
                <p className="text-sm font-semibold uppercase tracking-wide mb-4" style={{
                  color: trendData.trend === "Improving" ? "#059669" :
                         trendData.trend === "Worsening" ? "#dc2626" :
                         "#d97706"
                }}>
                  Overall Trend
                </p>
                <div className="flex items-center gap-3 mb-2">
                  {trendData.trend === "Improving" && <TrendingUp className="text-green-600" size={48} />}
                  {trendData.trend === "Worsening" && <TrendingDown className="text-red-600" size={48} />}
                  {trendData.trend === "Stable" && <div className="text-yellow-600 text-5xl">→</div>}
                </div>
                <span className={`font-bold text-2xl ${
                  trendData.trend === "Improving" ? "text-green-600" : 
                  trendData.trend === "Worsening" ? "text-red-600" : 
                  "text-yellow-600"
                }`}>
                  {trendData.trend}
                </span>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  {trendData.trend === "Improving" && "Water quality is getting better"}
                  {trendData.trend === "Worsening" && "Water quality is getting worse"}
                  {trendData.trend === "Stable" && "Water quality remains unchanged"}
                </p>
              </div>
            </div>

            {/* Change indicator */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Change: </span>
                <span className={trendData.currScore >= trendData.prevScore ? "text-green-600" : "text-red-600"}>
                  {trendData.currScore >= trendData.prevScore ? "+" : ""}{((trendData.currScore - trendData.prevScore) * 100).toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Detected Anomalies */}
        {anomalies.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-indigo-900 font-bold text-lg">Detected Anomalies</h3>
              <p className="text-sm text-gray-600 mt-1">Sudden changes detected across sites in the system</p>
            </div>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">Site ID: {anomaly.id}</p>
                    <p className="text-sm text-gray-600">{anomaly.issues}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">{anomaly.changes.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Change detected</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Water Quality Index - All Sites */}
        {wqiData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-indigo-900 font-bold text-lg">Water Quality Index (WQI) - All Sites</h3>
              <p className="text-sm text-gray-600 mt-1">Calculated quality score for each sampling site (0-100)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wqiData.map((site) => (
                <div key={site.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">Site {site.id}</p>
                      <p className="text-xs text-gray-600">Water Quality Index</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-600">{site.WQI.toFixed(1)}</p>
                      <p className="text-xs text-gray-600">Score</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-300 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{width: `${Math.min(100, (site.WQI / 100) * 100)}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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