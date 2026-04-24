"use client";

import { useState, useEffect } from "react";
import { MapProvider } from "@/components/map/MapContext";
import type { SiteData } from "@/types/site_types";
import SitesSidebar from "@/components/map/SitesSidebar";
import { getDangerZoneLabel, MapFilters } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";
import { Map } from "@/components/map/LoadMap";
import { getAllSites } from "@/app/services/siteService";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [sites, setSites] = useState<SiteData[]>([]);

  const handleGetAllSites = async () => {
    const allSitesResponse = await getAllSites();

    if (allSitesResponse.ok) {
      const allSiteData = await allSitesResponse.json();
      setSites(allSiteData.sites);

    }
  }

  useEffect(() => {
    handleGetAllSites();
    filteredPoints;
  }, []);

  const filteredPoints = sites.filter((point) => {
      if (!filters) return true;
  
      if (filters.contaminationLevels) {
        if (filters.contaminationLevels?.length > 0 &&
          !filters.contaminationLevels.includes(getDangerZoneLabel(point.dangerZone as any)))
        return false;
      }
  
      if (filters.sites) {
        const site= point.geoLocName;
        let siteName = site;
        if (point.sampleName) {
          if (site.includes("Apies River - ")) {
            const parts = site.split("Apies River - ");
            if (parts.length > 1) {
              siteName = parts[1].trim();
            }
          }
          if (site.includes(" - Apies River")) {
            const parts = site.split(" - Apies River");
            if (parts.length > 1) {
              siteName = parts[0].trim();
            }
          }
        }
        if (filters.sites?.length > 0 &&
          !filters.sites.includes(siteName))
        return false;
      }
  
      const sampleDate = new Date(point.collectionDate);
      if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
      if (filters.endDate   && sampleDate > new Date(filters.endDate))   return false;
  
      return true;
    });

  
  const totalHighRiskSites = sites.filter(p => p.dangerZone === "red").length;
  const totalModerateRiskSites = sites.filter(p => p.dangerZone === "yellow").length;
  return (
    
          <main className="flex-1 overflow-auto">
            <div className="flex flex-direction-column justify-between pt-4 px-4">
              <div style={styles.grid}>
                <span style={styles.card}>
                  <span style={styles.cardTitle}>Total Samples:</span>
                  <span style={styles.cardDesc}> {sites.length} </span>
                </span>
                <span style={styles.card}>
                  <span style={styles.cardTitle}>High Risk Zones:</span>
                  <span style={styles.cardDesc}> {totalHighRiskSites} </span>
                </span>
                <span style={styles.card}>
                  <span style={styles.cardTitle}>Moderate Risk Zones:</span>
                  <span style={styles.cardDesc}> {totalModerateRiskSites} </span>
                </span>

              </div>
            </div>
            <MapProvider>
              <div style={{ display: "flex", height: "100vh", background: "#ffffff" }}>

                <div style={{ flex: 1, position: "relative" }}>
                  <Map
                    points={filteredPoints}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    filters={filters}
                    onFiltersChange={setFilters}
                    allPoints={sites}
                  />
                </div>
                <SitesSidebar
                  points={filteredPoints}
                  selectedSite={selectedSite}
                  onSelectSite={setSelectedSite}
                />
              </div>
            </MapProvider>
          </main>
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
    marginBottom:"16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px",
    background: "#badbff",
    borderRadius:"8px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#060606",
  },
  cardDesc: {
    fontSize: "24px",
    color: "#141415",
    lineHeight: 1.6,
  },
};