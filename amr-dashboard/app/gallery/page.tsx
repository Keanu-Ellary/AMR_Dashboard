/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

function GalleryContent() {
  const searchParams = useSearchParams();
  const siteIdParam = searchParams.get("site");
  const siteId = siteIdParam ? parseInt(siteIdParam) : null;

  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSite = async () => {
      if (!siteId) return;
      try {
        const res = await fetch(`/api/site/${siteId}`);
        if (!res.ok) throw new Error("Failed to fetch site data");
        const data = await res.json();
        setSiteData(data.site);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [siteId]);

  if (!siteId) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No site ID provided.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading gallery...</p>
        </div>
      </main>
    );
  }

  if (error || !siteData) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">{error || "Site not found"}</p>
        </div>
      </main>
    );
  }

  const { imageBatches, images } = siteData;

  // Group images by batch if available, otherwise just show images
  const hasBatches = imageBatches && imageBatches.length > 0;

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{siteData.sampleName} - Photo Gallery</h1>
              <p className="text-gray-600 mt-1">Images grouped by batch date</p>
            </div>
          </div>
        </div>

        {hasBatches ? (
          <div className="space-y-8">
            {imageBatches.map((batch: any) => (
              <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Date Taken: {new Date(batch.dateTaken).toLocaleDateString()}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{batch.images?.length || 0} Photos</span>
                    {batch.algaeDetected && (
                      <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        <AlertTriangle size={14} />
                        Algae Detected
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {batch.images && batch.images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {batch.images.map((img: any) => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-200 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={`/api/image?url=${encodeURIComponent(img.url)}`}
                            alt="Site Image"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No images in this batch.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">All Photos</h2>
            {images && images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img: any, idx: number) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-200 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={`/api/image?url=${encodeURIComponent(img.url)}`}
                      alt="Site Image"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No photos available for this site.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading gallery...</p>
        </div>
      </main>
    }>
      <GalleryContent />
    </Suspense>
  );
}
