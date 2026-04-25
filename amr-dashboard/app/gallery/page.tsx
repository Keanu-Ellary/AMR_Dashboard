"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle, Calendar, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

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

  if (!siteId) return <EmptyState message="No site ID provided." />;
  if (loading) return <LoadingState />;
  if (error || !siteData) return <ErrorState message={error || "Site not found"} />;

  const { imageBatches, images } = siteData;
  const hasBatches = imageBatches && imageBatches.length > 0;

  return (
    <main className="flex-1 bg-background p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex items-center gap-6">
          <button onClick={() => window.history.back()} className="p-2 bg-white border border-border rounded-full hover:bg-gray-50 shadow-subtle transition-all">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">{siteData.sampleName} - Photo Gallery</h1>
            <p className="text-gray-400 mt-1 font-bold text-[10px] uppercase tracking-widest">Temporal Image Documentation</p>
          </div>
        </header>

        {hasBatches ? (
          <div className="space-y-12">
            {imageBatches.map((batch: any) => (
              <section key={batch.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-subtle">
                <header className="bg-gray-50/50 px-8 py-4 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Batch Date: {new Date(batch.dateTaken).toLocaleDateString()}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{batch.images?.length || 0} Assets</span>
                    {batch.algaeDetected && (
                      <span className="flex items-center gap-1.5 bg-red-50 text-risk-high px-3 py-1 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-widest">
                        <AlertTriangle size={12} /> Algae Presence
                      </span>
                    )}
                  </div>
                </header>
                <div className="p-8">
                  <ImageGrid images={batch.images} />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="bg-white rounded-2xl border border-border p-8 shadow-subtle">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">Archive Repository</h2>
            <ImageGrid images={images} />
          </section>
        )}
      </div>
    </main>
  );
}

function ImageGrid({ images }: { images: any[] }) {
  if (!images || images.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-300">
        <ImageIcon size={48} className="mb-4 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">No visual data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((img: any, idx: number) => (
        <div key={img.id || idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border/50 shadow-subtle hover:shadow-soft transition-all group">
          <img
            src={`/api/image?url=${encodeURIComponent(img.url)}`}
            alt="Site Evidence"
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return <div className="p-20 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 animate-pulse">Retrieving Image Matrix...</div>;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-20 text-center flex flex-col items-center">
      <AlertTriangle size={48} className="text-risk-high mb-4 opacity-20" />
      <p className="text-xs font-bold uppercase tracking-widest text-risk-high">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-20 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
      {message}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <GalleryContent />
    </Suspense>
  );
}
