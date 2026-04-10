"use client";

import dynamic from "next/dynamic";

export const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", height: "100%", alignItems: "center",
      justifyContent: "center", background: "#f8f6f6", color: "#121111",
      fontFamily: "opensans, sans-serif", fontSize: "20px" }}>
      Loading map...
    </div>
  ),
});