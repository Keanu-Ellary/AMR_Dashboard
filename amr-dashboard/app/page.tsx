"use client";

import dynamic from "next/dynamic";
import { MapProvider, useMapContext } from "@/components/MapContext";

// Dynamically import the Map component with SSR disabled
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      Loading Map...
    </div>
  ),
});

// Use this as an example on manipulating the map
function MapControls() {
  const { flyTo, setZoom, map } = useMapContext();

  return (
    <div className="flex gap-2 mb-4 flex-wrap justify-center">
      <button
        onClick={() => flyTo([-25.7479, 28.2293], 13)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        Fly to Pretoria
      </button>
      <button
        onClick={() => flyTo([35.6762, 139.6503], 12)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        Fly to Tokyo
      </button>
      <button
        onClick={() => flyTo([40.7128, -74.006], 12)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        Fly to New York
      </button>

      <div className="w-px bg-gray-300 mx-2"></div>

      <button
        onClick={() => map && setZoom(map.getZoom() + 1)}
        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm"
      >
        Zoom In +
      </button>
      <button
        onClick={() => map && setZoom(map.getZoom() - 1)}
        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm"
      >
        Zoom Out -
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Interactive OpenStreetMap
      </h1>

      {/* Wrap everything that needs to talk to the map inside the Provider, or it wont work */}
      <MapProvider>
        <MapControls />

        {/* Map needs a parent with a FIXED height */}
        <div className="h-[500px] w-full max-w-4xl border-2 border-gray-300 rounded-xl overflow-hidden relative z-0 shadow-lg bg-white">
          <Map initialCenter={[-25.7479, 28.2293]} initialZoom={13} />
        </div>
      </MapProvider>
    </main>
  );
}
