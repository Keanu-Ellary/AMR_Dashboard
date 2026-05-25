"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, AlertTriangle, ArrowLeft, FlaskConical, Calendar, Settings } from "lucide-react";
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
          <p className="text-red-500 font-semibold">{error || "Sample not found"}</p>
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

  const getDangerZoneColor = (zone?: string) => {
    switch (zone?.toLowerCase()) {
      case "red":
        return "text-red-600 bg-red-50 border-red-200";
      case "yellow":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "green":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
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
  const latestImage = latestBatchImage || sampleData.images?.[sampleData.images.length - 1]?.url;

  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
      {/* Header and Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-indigo-600" />
            Isolate Detail Viewer
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Detailed sample readings, WQI formula metrics, and AMR resistance profile
          </p>
        </div>
      </div>

      {/* Algae Alert Banner */}
      {sampleData.imageBatches && sampleData.imageBatches.length > 0 && sampleData.imageBatches[0].algaeDetected && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-black">AI Algae Alert Detected</p>
            <p className="text-xs text-red-600 mt-0.5">
              The neural vision model flagged potential algae presence in the latest photo batch taken for this sample.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
        {/* Left Card: Info & Image */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
            {/* Sample Image */}
            <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 border border-slate-100">
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
                  <span className="text-xs font-bold uppercase tracking-wider">No Image Available</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold w-fit ${getDangerZoneColor(sampleData.dangerZone)}`}>
                <span className={`h-2 w-2 rounded-full ${getDangerDotColor(sampleData.dangerZone)}`} />
                <span className="capitalize">{sampleData.dangerZone || "unknown"} Risk</span>
              </span>
              <h2 className="text-xl font-extrabold text-indigo-950 mt-1">{sampleData.sampleName}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <MapPin className="h-3.5 w-3.5" />
                {sampleData.geoLocName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                <Calendar className="h-3.5 w-3.5" />
                Sampled: {new Date(sampleData.collectionDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Isolate Details */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest">Isolate Profile</h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Organism</span>
                  <span className="text-slate-800 font-bold italic">{sampleData.orgamism || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Isolate ID</span>
                  <span className="text-slate-800 font-mono font-bold">{sampleData.isolateId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">SIR Prediction</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 ${
                    sampleData.predictedSir?.startsWith("R")
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : sampleData.predictedSir?.startsWith("I")
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {sampleData.predictedSir || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Analysis Type</span>
                  <span className="text-slate-800 font-bold">{sampleData.sampleAnalysisType}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">AMR Resistance Genes</span>
                <span className="text-xs text-slate-800 font-mono font-bold bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg block mt-1 break-all">
                  {sampleData.amrResGenes || "No resistance genes detected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Metrics & Formula */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Water Quality Metric Card Grid */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-indigo-950 text-base">Diagnostic Water Quality Parameters</h3>
                <p className="text-xs text-gray-500 font-medium">Individual physical-chemical measurements taken at site</p>
              </div>

              {/* Water Quality Score Indicator */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Water Quality Score</span>
                <span className={`px-3 py-1 rounded-2xl text-base font-black shadow-sm ${
                  waterQualityPercent >= 76
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : waterQualityPercent >= 51
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {waterQualityPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 transition-all hover:shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">pH Level</span>
                <span className="text-2xl font-black text-blue-600 block mt-1">
                  {sampleData.ph?.toFixed(1) || "N/A"}
                </span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 transition-all hover:shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Temperature</span>
                <span className="text-2xl font-black text-emerald-600 block mt-1">
                  {sampleData.temperature?.toFixed(1) || "N/A"}°C
                </span>
              </div>
              <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 transition-all hover:shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dissolved O₂</span>
                <span className="text-2xl font-black text-orange-600 block mt-1">
                  {sampleData.dissolvedO2?.toFixed(2) || "N/A"} mg/L
                </span>
              </div>
              <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 transition-all hover:shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TDS</span>
                <span className="text-2xl font-black text-purple-600 block mt-1">
                  {sampleData.tds?.toFixed(1) || "N/A"} mg/L
                </span>
              </div>
            </div>
          </div>

          {/* Formula Breakdown Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-extrabold text-indigo-950 text-base mb-4">Water Quality Index Formula Breakdown</h3>
            <WaterQualityFormula
              mode="site"
              ph={sampleData.ph}
              temperature={sampleData.temperature}
              dissolvedO2={sampleData.dissolvedO2}
              tds={sampleData.tds}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SampleViewer() {
  return (
    <Suspense fallback={
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading sample details...</p>
        </div>
      </main>
    }>
      <SampleViewerContent />
    </Suspense>
  );
}
