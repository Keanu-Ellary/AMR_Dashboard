"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useMapContext } from "./MapContext";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: typeof markerIcon === "object" ? markerIcon.src : markerIcon,
  iconRetinaUrl:
    typeof markerIcon2x === "object" ? markerIcon2x.src : markerIcon2x,
  shadowUrl: typeof markerShadow === "object" ? markerShadow.src : markerShadow,
});

// Helper component to connect the Leaflet map instance to our Context
function MapController() {
  const map = useMap();
  const { setMap } = useMapContext();

  useEffect(() => {
    setMap(map);
    return () => setMap(null); // Clean up on unmount
  }, [map, setMap]);

  return null;
}

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function Map({
  initialCenter = [-25.7479, 28.2293],
  initialZoom = 13,
}: MapProps) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <MapController />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={initialCenter}>
        <Popup>
          Selected Location! <br /> We are somewhere here.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
