"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      Loading Map...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">OpenStreetMap</h1>
      <div className="h-[500px] w-full max-w-4xl border-2 border-gray-200 rounded-lg overflow-hidden relative z-0">
        <Map />
      </div>
    </main>
  );
}
