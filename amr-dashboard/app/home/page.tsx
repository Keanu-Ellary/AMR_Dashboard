"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapProvider } from "@/components/map/MapContext";
import { samplingPoints } from "@/data/sites";
import type { SamplingPoint } from "@/types/site_types";
import SitesSidebar from "@/components/map/SitesSidebar";
import { MapFilters } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";
import SideNavBar from "@/components/SideNavBar";
import TopNavBar from "@/components/TopNavBar";
import { Map } from "@/components/map/LoadMap";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<SamplingPoint | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  
  return (
    <div className="flex h-screen bg-gray-100 font-sans">  
      <SideNavBar />
        <div className="flex-1 flex flex-col overflow-hidden">  
          <TopNavBar />
    
          <main className="flex-1 overflow-auto p-6">
            <div style={styles.grid}>
              <span style={styles.card}>
                <span style={styles.cardTitle}>Total Samples:</span>
                <span style={styles.cardDesc}> 4 </span>
              </span>
              <span style={styles.card}>
                <span style={styles.cardTitle}>Total Isolates:</span>
                <span style={styles.cardDesc}> 9 </span>
              </span>
            </div>
            <MapProvider>
              <div style={{ display: "flex", height: "100vh", background: "#ffffff" }}>

                <div style={{ flex: 1, position: "relative" }}>
                  <Map
                    points={samplingPoints}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>
                <SitesSidebar
                  points={samplingPoints}
                  selectedSite={selectedSite}
                  onSelectSite={setSelectedSite}
                />
              </div>
            </MapProvider>
          </main>
        </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#060606",
    marginBottom: "16px",
  },
  grid: {
    display:"grid",
    gridTemplateColumns:"repeat(3, 200px)",
    gap:"12px",
    marginBottom:"48px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    padding: "20px",
    background: "#94c8ff",
    borderRadius:"8px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#060606",
  },
  cardDesc: {
    fontSize: "12px",
    color: "#141415",
    lineHeight: 1.6,
  },
};