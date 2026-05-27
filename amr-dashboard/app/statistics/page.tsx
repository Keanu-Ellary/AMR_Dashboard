"use client";

import React, { useState, useEffect, Suspense } from "react";
import TimeSeriesDashboard from "@/components/TimeSeriesDashboard";
import { useSearchParams } from "next/navigation";
import { MapPin, Download } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import {
  exportStatistics,
  ExportFormat,
} from "@/functions/statistics/exportData";
import { toast } from "react-toastify";
import { parseLocationName } from "@/utils/siteUtils";
import GeoLocationList from "@/components/GeoLocationList";
import SampleList from "@/components/SampleList";
import { DashboardProvider } from "@/components/DashboardContext";

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
  const [averageMetrics, setAverageMetrics] = useState<AverageMetrics | null>(
    null,
  );
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
        value: siteData?.collectionDate
          ? new Date(siteData.collectionDate).toLocaleDateString()
          : "N/A",
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

    const res = exportStatistics(
      exportData,
      format,
      `site_${siteData?.sampleName || "statistics"}`,
    );
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
        const [averageRes, trendRes, anomalyRes, wqiRes, allSitesRes] =
          await Promise.all([
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
          const [siteRes, waterQualityRes, timeInUnsafeRes, siteAnomalyRes] =
            await Promise.all([
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
          <p className="text-gray-500">Loading samples...</p>
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
    return "/login-bg.jpg";
  };

  const ExportDropdown = ({
    onExport,
  }: {
    onExport: (format: ExportFormat) => void;
  }) => (
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
              Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // LOCATION-SPECIFIC VIEW
  if (siteId && siteData) {
    const locName = locationName || parseLocationName(siteData.geoLocName);

    const latestBatchImage = siteData.imageBatches?.[0]?.images?.[0]?.url;
    const latestImage =
      latestBatchImage || siteData.images?.[siteData.images.length - 1]?.url;
    const locationImageSrc = latestImage
      ? `/api/image?url=${encodeURIComponent(latestImage)}`
      : siteData.imageBase64 || getDefaultImage();

    const coordinatesLabel =
      siteData.latitude !== null &&
      siteData.latitude !== undefined &&
      siteData.longitude !== null &&
      siteData.longitude !== undefined
        ? `${siteData.latitude.toFixed(5)}, ${siteData.longitude.toFixed(5)}`
        : "—";
    const zoneLabel = siteData.dangerZone || "—";
    const regionLabel = siteData.geoLocName || "—";

    const locationIsolates = allSites.filter(
      (s) => parseLocationName(s.geoLocName) === parseLocationName(locName),
    );

    const totalSamples = locationIsolates.length;
    let phSum = 0,
      phCount = 0;
    let tempSum = 0,
      tempCount = 0;
    let doSum = 0,
      doCount = 0;
    let tdsSum = 0,
      tdsCount = 0;

    locationIsolates.forEach((s) => {
      if (s.ph !== null && s.ph !== undefined) {
        phSum += s.ph;
        phCount++;
      }
      if (s.temperature !== null && s.temperature !== undefined) {
        tempSum += s.temperature;
        tempCount++;
      }
      if (s.dissolvedO2 !== null && s.dissolvedO2 !== undefined) {
        doSum += s.dissolvedO2;
        doCount++;
      }
      if (s.tds !== null && s.tds !== undefined) {
        tdsSum += s.tds;
        tdsCount++;
      }
    });

    const locAverages = {
      ph: phCount > 0 ? phSum / phCount : null,
      temp: tempCount > 0 ? tempSum / tempCount : null,
      do: doCount > 0 ? doSum / doCount : null,
      tds: tdsCount > 0 ? tdsSum / tdsCount : null,
    };

    const phValue = locAverages.ph;
    const tempValue = locAverages.temp;
    const doValue = locAverages.do;

    const phOutOfRange = phValue !== null && (phValue < 7 || phValue > 7.5);
    const tempOutOfRange =
      tempValue !== null && (tempValue < 15 || tempValue > 25);
    const doOutOfRange = doValue !== null && doValue < 8;

    return (
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 flex flex-col gap-6">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-500" />
                {locName} - Samples & Geolocations
              </h1>
              <p className="text-sm text-slate-500">
                Geographic details and sample inventory for this location
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportDropdown onExport={handleExportSiteSpecific} />
            </div>
          </div>

          {/* Location + Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6">
            {/* Location Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-col gap-4">
                <div className="rounded-xl overflow-hidden h-44 bg-slate-100 border border-slate-100">
                  <img
                    src={locationImageSrc}
                    alt={locName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {locName}
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 text-sm mt-3">
                    <div>
                      <dt className="text-slate-500">Zone</dt>
                      <dd className="font-semibold text-slate-800 capitalize">
                        {zoneLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">GPS Coordinates</dt>
                      <dd className="font-semibold text-slate-800">
                        {coordinatesLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Region</dt>
                      <dd className="font-semibold text-slate-800">
                        {regionLabel}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Dynamic Aggregates Card Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Total Samples Taken
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {totalSamples}
                </span>
                <span className="text-xs text-slate-500">
                  Across all historical dates
                </span>
              </div>
              <div
                className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-1 ${
                  phOutOfRange ? "border-red-400" : "border-slate-200"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">
                  Avg pH Level
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {phValue !== null ? phValue.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-slate-500">
                  Ideal range: 7.0 - 7.5
                </span>
              </div>
              <div
                className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-1 ${
                  tempOutOfRange ? "border-red-400" : "border-slate-200"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">
                  Avg Temperature
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {tempValue !== null ? `${tempValue.toFixed(1)}°C` : "—"}
                </span>
                <span className="text-xs text-slate-500">
                  Ideal range: 15°C - 25°C
                </span>
              </div>
              <div
                className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-1 ${
                  doOutOfRange ? "border-red-400" : "border-slate-200"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">
                  Avg Dissolved O₂
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {doValue !== null ? `${doValue.toFixed(2)} mg/L` : "—"}
                </span>
                <span className="text-xs text-slate-500">Ideal: ≥ 8 mg/L</span>
              </div>
            </div>
          </div>

          {/* Historical analysis + anomalies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Parameter Averages */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Historical Parameter Analysis
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Average pH:</span>
                  <span className="font-semibold text-slate-800">
                    {locAverages.ph ? locAverages.ph.toFixed(2) : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Average Temp:</span>
                  <span className="font-semibold text-slate-800">
                    {locAverages.temp
                      ? `${locAverages.temp.toFixed(2)}°C`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Average Dissolved O₂:</span>
                  <span className="font-semibold text-slate-800">
                    {locAverages.do ? `${locAverages.do.toFixed(2)} mg/L` : "—"}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Average TDS:</span>
                  <span className="font-semibold text-slate-800">
                    {locAverages.tds
                      ? `${locAverages.tds.toFixed(1)} mg/L`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Location-specific anomalies */}
            {siteAnomalies.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">
                  Detected Anomalies
                </h3>
                <div className="space-y-3">
                  {siteAnomalies.map((anomaly, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-xl border border-amber-500 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {anomaly.issues}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-700">
                          {anomaly.changes.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Change magnitude
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TimeSeriesDashboard siteId={siteId} />

          <SampleList sites={locationIsolates} />
        </div>
      </main>
    );
  }

  // SYSTEM-WIDE VIEW
  return (
    <main className="flex-1 overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <GeoLocationList sites={allSites} />
      </div>
    </main>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Loading samples...</p>
          </div>
        </main>
      }
    >
      <DashboardProvider>
        <StatisticsContent />
      </DashboardProvider>
    </Suspense>
  );
}
