"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useMapContext } from "./MapContext";
import Site from "./Site";
import River from "./River";
import addLegend from "./Legend";
import addFilterPanel from "./FilterPanel";
import { getDangerZoneLabel, type MapProps } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";

export default function Map({ points, selectedSite, onSelectSite, filters, onFiltersChange, satelliteView }: MapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null); // Leaflet owns this
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { setMap } = useMapContext();

  const activeFilters = filters ?? DEFAULT_FILTERS;

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [-25.735, 28.28],
      zoom:   11,
    });

    if (satelliteView)
    {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);
    }

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

  useEffect(() => {
    if (!mapRef.current) return;


    if (satelliteView)
    {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(mapRef.current);
    }else{
      if (tileLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
    }

  }, [satelliteView]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* Inner div for Leaflet */}
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", background: satelliteView? "transparent" : "#eeffe3" }} />

      {mapReady && mapRef.current && (
        <>
          <River
            map={mapRef.current}
            activeRisks={filters?.contaminationLevels}
            points={points}
          />
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