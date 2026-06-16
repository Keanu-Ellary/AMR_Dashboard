"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, AlertTriangle, ArrowLeft, Calendar, Info } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import WaterQualityFormula from "@/components/WaterQualityFormula";

export const dynamic = "force-dynamic";

function SampleViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sampleIdParam = searchParams.get("id");
  const sampleId = sampleIdParam ? parseInt(sampleIdParam) : null;

  const [sampleData, setSampleData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterQualityPercent, setWaterQualityPercent] = useState(0);

  useEffect(() => {
    if (!sampleId) {
      setError("No sample ID provided");
      setLoading(false);
      return;
    }

    const fetchSample = async () => {
      try {
        const [siteRes, waterQualityRes] = await Promise.all([
          fetch(`/api/site/${sampleId}`),
          fetch(`/api/statistics/waterQuality?siteId=${sampleId}`),
        ]);

        if (!siteRes.ok) {
          throw new Error("Failed to fetch sample data");
        }

        const siteDataRes = await siteRes.json();
        setSampleData(siteDataRes.site);

        if (waterQualityRes.ok) {
          const waterRes = await waterQualityRes.json();
          setWaterQualityPercent(waterRes.results?.[0]?.WQI || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sample");
      } finally {
        setLoading(false);
      }
    };

    fetchSample();
  }, [sampleId]);

  if (loading) {
    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading sample details...</p>
        </div>
      </main>
    );
  }

  if (error || !sampleData) {
    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-red-500 font-semibold">
            {error || "Sample not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const getDangerZoneTextColor = (zone?: string) => {
    switch (zone?.toLowerCase()) {
      case "red":
        return "text-red-600";
      case "yellow":
        return "text-yellow-600";
      case "green":
        return "text-emerald-600";
      default:
        return "text-slate-600";
    }
  };

  const getSIRTextColor = (sir?: string) => {
    if (sir?.startsWith("R")) return "text-red-600";
    if (sir?.startsWith("I")) return "text-yellow-600";
    if (sir?.startsWith("S")) return "text-emerald-600";
    return "text-slate-800";
  };

  const getDangerDotColor = (zone?: string) => {
    switch (zone?.toLowerCase()) {
      case "red":
        return "bg-red-500";
      case "yellow":
        return "bg-yellow-400";
      case "green":
        return "bg-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  const latestBatchImage = sampleData.imageBatches?.[0]?.images?.[0]?.url;
  const latestImage =
    latestBatchImage || sampleData.images?.[sampleData.images.length - 1]?.url;

  const phValue = sampleData.ph;
  const tempValue = sampleData.temperature;
  const doValue = sampleData.dissolvedO2;
  const tdsValue = sampleData.tds;

  const phOutOfRange =
    phValue !== null && phValue !== undefined && (phValue < 7 || phValue > 7.5);
  const tempOutOfRange =
    tempValue !== null &&
    tempValue !== undefined &&
    (tempValue < 15 || tempValue > 25);
  const doOutOfRange = doValue !== null && doValue !== undefined && doValue < 8;
  const tdsOutOfRange =
    tdsValue !== null && tdsValue !== undefined && tdsValue > 50;

  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
      {/* Header and Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Sample details
          </h1>
          <p className="text-sm text-slate-500">
            Site readings, WQI breakdown, and resistance profile
          </p>
        </div>
      </div>

      {/* Algae Alert Banner */}
      {sampleData.imageBatches &&
        sampleData.imageBatches.length > 0 &&
        sampleData.imageBatches[0].algaeDetected && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-semibold">
                Algae alert
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Potential algae presence detected in the latest image batch.
              </p>
            </div>
          </div>
        )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
        {/* Left Card: Info & Image */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
            {/* Sample Image */}
            <div className="rounded-xl overflow-hidden h-48 bg-slate-100">
              {latestImage ? (
                <img
                  src={`/api/image?url=${encodeURIComponent(latestImage)}`}
                  alt={sampleData.sampleName}
                  className="w-full h-full object-cover"
                />
              ) : sampleData.imageBase64 ? (
                <img
                  src={sampleData.imageBase64}
                  alt={sampleData.sampleName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <MapPin className="h-8 w-8" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    No Image Available
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-xl font-semibold text-slate-900">
                  {sampleData.sampleName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${getDangerZoneTextColor(sampleData.dangerZone)}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${getDangerDotColor(sampleData.dangerZone)}`}
                  />
                  {sampleData.dangerZone || "unknown"} risk
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {sampleData.geoLocName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Sampled:{" "}
                {new Date(sampleData.collectionDate).toLocaleDateString(
                  "en-ZA",
                  { year: "numeric", month: "short", day: "numeric" },
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Isolate Details */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Isolate profile
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">
                    Organism
                  </span>
                  <span className="text-slate-800 font-semibold italic">
                    {sampleData.orgamism || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    Isolate ID
                  </span>
                  <span className="text-slate-800 font-mono font-semibold">
                    {sampleData.isolateId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    SIR Prediction
                  </span>
                  <span
                    className={`inline-block font-bold mt-1 ${getSIRTextColor(sampleData.predictedSir)}`}
                  >
                    {sampleData.predictedSir || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    Analysis Type
                  </span>
                  <span className="text-slate-800 font-semibold">
                    {sampleData.sampleAnalysisType}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  AMR Resistance Genes
                </span>
                <span className="text-xs text-slate-800 font-mono font-semibold bg-slate-50 border border-slate-200 p-2.5 rounded-lg block mt-1 break-all">
                  {sampleData.amrResGenes || "No resistance genes detected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Metrics & Formula */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Water Quality Metric Card Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Water quality parameters
                </h3>
                <p className="text-xs text-slate-500">
                  Physical and chemical measurements at the site
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-1 ${
                  phOutOfRange ? "border-red-400" : "border-slate-200"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">
                  pH Level
                </span>
                <span
                  className={`text-2xl font-semibold ${
                    phOutOfRange ? "text-red-700" : "text-slate-900"
                  }`}
                >
                  {sampleData.ph?.toFixed(1) || "N/A"}
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
                  Temperature
                </span>
                <span
                  className={`text-2xl font-semibold ${
                    tempOutOfRange ? "text-red-700" : "text-slate-900"
                  }`}
                >
                  {sampleData.temperature?.toFixed(1) || "N/A"}°C
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
                  Dissolved O₂
                </span>
                <span
                  className={`text-2xl font-semibold ${
                    doOutOfRange ? "text-red-700" : "text-slate-900"
                  }`}
                >
                  {sampleData.dissolvedO2?.toFixed(2) || "N/A"} mg/L
                </span>
                <span className="text-xs text-slate-500">Ideal: ≥ 8 mg/L</span>
              </div>
              <div
                className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-1 ${
                  tdsOutOfRange ? "border-red-400" : "border-slate-200"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">TDS</span>
                <span
                  className={`text-2xl font-semibold ${
                    tdsOutOfRange ? "text-red-700" : "text-slate-900"
                  }`}
                >
                  {sampleData.tds?.toFixed(1) || "N/A"} mg/L
                </span>
                <span className="text-xs text-slate-500">Ideal: ≤ 50 mg/L</span>
              </div>
            </div>
          </div>

          {/* Formula Breakdown Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-base">
                  Water Quality Index
                </h3>
                <div className="relative group">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                    aria-label="Water Quality Index calculation details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 z-10">
                    <p className="text-slate-800 font-mono">
                      WQI = 0.35×q(DO) + 0.25×q(pH) + 0.20×q(Temp) + 0.20×q(TDS)
                    </p>
                    <p className="mt-2">
                      q(X) is the normalized sub-index (0–100). Weights reflect
                      each parameter&apos;s importance; DO carries the highest
                      weight.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={`text-2xl font-semibold ${
                    waterQualityPercent >= 70
                      ? "text-emerald-700"
                      : waterQualityPercent >= 50
                        ? "text-orange-600"
                        : "text-red-600"
                  }`}
                >
                  {waterQualityPercent.toFixed(1)}%
                </p>
                <div className="relative group">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                    aria-label="Water Quality Index thresholds"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 z-10">
                    <ul className="space-y-1.5">
                      <li className="flex justify-between items-center">
                        <span className="font-semibold text-emerald-700">Good</span>
                        <span className="text-[10px] font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">≥ 70</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="font-semibold text-orange-600">Moderate</span>
                        <span className="text-[10px] font-mono bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">≥ 50</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="font-semibold text-red-600">Not good</span>
                        <span className="text-[10px] font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-100">&lt; 50</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <WaterQualityFormula
              mode="site"
              variant="compact"
              ph={sampleData.ph}
              temperature={sampleData.temperature}
              dissolvedO2={sampleData.dissolvedO2}
              tds={sampleData.tds}
              wqi={waterQualityPercent}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SampleViewer() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Loading sample details...</p>
          </div>
        </main>
      }
    >
      <SampleViewerContent />
    </Suspense>
  );
}
