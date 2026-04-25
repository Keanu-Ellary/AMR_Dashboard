"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useMapContext } from "./MapContext";
import Site from "./Site";
import River from "./River";
import addLegend from "./Legend";
import addFilterPanel from "./FilterPanel";
import { type MapProps } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";

export default function Map({
  points,
  selectedSite,
  onSelectSite,
  filters,
  onFiltersChange,
  allPoints,
}: MapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null); // Leaflet owns this
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { setMap } = useMapContext();
  const [satelliteView, setMapView] = useState<boolean>(false);

  const activeFilters = filters ?? DEFAULT_FILTERS;

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [-25.735, 28.28],
      zoom: 11,
    });

    const tileUrl = satelliteView
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 18,
    }).addTo(map);

    map.whenReady(() => {
      addLegend(map);
      addFilterPanel(map, points, activeFilters, onFiltersChange);
      mapDivRef.current?.focus();
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

    if (tileLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = satelliteView
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 18,
    }).addTo(mapRef.current);
  }, [satelliteView]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const filterPanel = mapRef.current
      .getContainer()
      .querySelector(".leaflet-top.leaflet-right");
    if (filterPanel) {
      const panelExists = filterPanel.querySelector(".amr-filter");
      if (panelExists) {
        panelExists.remove();
      }
    }

    addFilterPanel(mapRef.current, allPoints, activeFilters, onFiltersChange);
  }, [allPoints, mapReady]);

  const handleSwitchToSatelliteView = () => {
    setMapView(true);
  };
  const handleSwitchToStandardView = () => {
    setMapView(false);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", border: "1px solid rgba(80,140,255,0.12)" }}>
      {/* Inner div for Leaflet */}
      <div
        ref={mapDivRef}
        style={{
          width: "100%",
          height: "100%",
          background: satelliteView ? "transparent" : "#eeffe3",
        }}
        className="outline-none"
      />

      {mapReady && mapRef.current && (
        <div>
          <div
            className="flex gap-2 self-start"
            style={{
              position: "absolute",
              top: "12px",
              left: "50px",
              zIndex: 1000,
            }}
          >
            <button
              onClick={handleSwitchToStandardView}
              className={`px-4 py-0 rounded-full bg-blue-200 text-slate-800 font-medium ${!satelliteView ? "bg-blue-300 transition-colors" : "bg-blue-200 transition-colors"}`}
            >
              Standard
            </button>
            <button
              onClick={handleSwitchToSatelliteView}
              className={`px-4 py-0 rounded-full bg-blue-200 text-slate-800 font-medium ${satelliteView ? "bg-blue-300 transition-colors" : "bg-blue-200 transition-colors"}`}
            >
              Satellite
            </button>
          </div>
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
        </div>
      )}
    </div>
  );
}
