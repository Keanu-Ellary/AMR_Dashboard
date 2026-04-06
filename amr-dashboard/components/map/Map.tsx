"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useMapContext } from "./MapContext";
import Site from "./Site";
import River from "./River";
import addLegend from "./Legend";
import type { ContaminationLevel } from "@/types/map_types";
import type { SamplingPoint } from "@/types/site_types";

interface MapProps {
  points:       SamplingPoint[];
  selectedSite: SamplingPoint | null;
  onSelectSite: (site: SamplingPoint) => void;
  filters?:     ContaminationLevel[];
}

export default function Map({ points, selectedSite, onSelectSite, filters }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { setMap } = useMapContext();

  //Child components render when map is ready
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-25.735, 28.28],
      zoom: 11,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    map.whenReady(() => {
      addLegend(map);
    });

    mapRef.current = map;
    setMap(map);
    setMapReady(true);//re-render children once map is initialized

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {mapReady && mapRef.current && (
        <>
          <River map={mapRef.current} activeRisks={filters} />
          <Site
            map={mapRef.current}
            points={points}
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
          />
        </>
      )}
    </div>
  );
}