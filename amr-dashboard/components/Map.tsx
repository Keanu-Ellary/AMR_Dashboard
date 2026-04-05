"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: typeof markerIcon === "object" ? markerIcon.src : markerIcon,
  iconRetinaUrl:
    typeof markerIcon2x === "object" ? markerIcon2x.src : markerIcon2x,
  shadowUrl: typeof markerShadow === "object" ? markerShadow.src : markerShadow,
});

export default function Map() {
  const position: [number, number] = [-25.7479, 28.2293];

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Pretoria! <br /> We are somewhere here.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
