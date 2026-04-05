"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Map as LeafletMap } from "leaflet";

interface MapContextType {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
  setZoom: (zoom: number) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const flyTo = (center: [number, number], zoom?: number) => {
    if (map) {
      map.flyTo(center, zoom || map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  };

  const setZoom = (zoom: number) => {
    if (map) {
      map.setZoom(zoom, {
        animate: true,
      });
    }
  };

  return (
    <MapContext.Provider value={{ map, setMap, flyTo, setZoom }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
