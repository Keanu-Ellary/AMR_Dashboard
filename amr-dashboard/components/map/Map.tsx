"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useMapContext } from "./MapContext";
import Site from "./Site";
import River from "./River";
import addLegend from "./Legend";
import addFilterPanel from "./FilterPanel";
import type { ContaminationLevel, MapProps } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";

export default function Map({ points, selectedSite, onSelectSite, filters, onFiltersChange }: MapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null); // Leaflet owns this
  const mapRef    = useRef<L.Map | null>(null);
  const { setMap } = useMapContext();

  const activeFilters = filters ?? DEFAULT_FILTERS;

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [-25.735, 28.28],
      zoom:   11,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    map.whenReady(() => {
      addLegend(map);
      addFilterPanel(map, points, activeFilters, onFiltersChange);
    });

    mapRef.current = map;
    setMap(map);
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  const filteredPoints = points.filter((point) => {
    if (!filters) return true;

    if (filters.contaminationLevels) {
      if (filters.contaminationLevels?.length > 0 &&
        !filters.contaminationLevels.includes(point.dangerZone as ContaminationLevel))
      return false;
    }

    if (filters.sites) {
      if (filters.sites?.length > 0 &&
        !filters.sites.includes(point.sampleName))
      return false;
    }

    if (filters.regions) {
      if (filters.regions?.length > 0 &&
        !filters.regions.includes(point.geoLocName))
      return false;
    }

    const sampleDate = new Date(point.collectionDate);
    if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
    if (filters.endDate   && sampleDate > new Date(filters.endDate))   return false;

    return true;
  });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* Inner div for Leaflet */}
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      {mapReady && mapRef.current && (
        <>
          <River
            map={mapRef.current}
            activeRisks={filters?.contaminationLevels}
          />
          <Site
            map={mapRef.current}
            points={filteredPoints}
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
          />
        </>
      )}
    </div>
  );
}