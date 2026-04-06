"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import type { ContaminationLevel } from "@/types/map_types";
import type { SamplingPoint } from "@/types/site_types";
import { RISK_COLOUR } from "@/constants/map_constants";
import siteImage from "../../assets/site.png";

interface SiteProps {
  map: L.Map;
  points: SamplingPoint[];
  selectedSite: SamplingPoint | null;
  onSelectSite: (site: SamplingPoint) => void;
  activeRisks?: ContaminationLevel[];
}

const TOOLTIP_STYLES = {
  wrapper: `
    font-family: opensans, sans-serif;
    font-size: 12px;
    color: #0e0e0f;
    min-width: 250px;
  `,
  siteImage: `
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 8px;
  `,
  badge: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  `,
  riskBadge: (glow: string, fill: string) => `
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 3px;
    background: ${glow};
    color: #0e0e0f;
  `,
  name: `
    font-weight: 700;
    color: #0e0e0f;
    margin-bottom: 3px;
  `,
  grid: `
    border-top: 1px solid rgba(80,140,255,0.12);
    padding-top: 7px;
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 14px;
    row-gap: 2px;
  `,
  gridLabel: `
    color: #64748b;
  `,
  gridValue: `
    color: #94a3b8;
  `,
  link: `
    margin-top: 8px;
    font-size: 9px;
    color: #3b82f6;
    text-align: center;
    opacity: 0.8;
  `,
  divider: `
    border-top: 1px solid rgba(80,140,255,0.12);
    margin: 8px 0;
  `,
  sectionTitle: `
    font-size: 12px;
    letter-spacing: 1.2px;
    color: #0c0c0c;
    margin-bottom: 6px;
  `,
  waterGrid: `
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 14px;
    row-gap: 3px;
  `,
  waterLabel: `
    color: #64748b;
    font-size: 12px;
  `,
  waterValue: `
    color: #94a3b8;
    font-size: 12px;
  `,
} as const;

function createMarkerIcon(
  riskLevel: ContaminationLevel,
  isSelected: boolean
): L.DivIcon {

  const c = RISK_COLOUR[riskLevel] ?? RISK_COLOUR.moderate;
  const core = isSelected ? 20 : 14;
  const box  = core + 12;

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
        <circle
          cx="${box / 2}" cy="${box / 2}" r="${box / 2 - 1}"
          fill="${c.glow}"/>
        <circle
          cx="${box / 2}" cy="${box / 2}" r="${core / 2}"
          fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5"/>
        ${isSelected ? `
          <circle
            cx="${box / 2}" cy="${box / 2}" r="${core / 4}"
            fill="white" opacity="0.9"/>
        ` : ""}
      </svg>`,
    className: "",
    iconSize: [box, box],
    iconAnchor: [box / 2, box / 2],
  });
}

function siteTooltipHTML(point: SamplingPoint): string {
  const c = RISK_COLOUR[point.contaminationLevel] ?? RISK_COLOUR.moderate;
  const waterquality = point.metadata;

  return `
    <div style="${TOOLTIP_STYLES.wrapper}">

      <img src="/site.png" alt="${point.name}" style="${TOOLTIP_STYLES.siteImage}" />
      <div style="${TOOLTIP_STYLES.name}">${point.name}</div>
      <div style="${TOOLTIP_STYLES.badge}">
        <span style="${TOOLTIP_STYLES.riskBadge(c.glow, c.fill)}">${c.label}</span>
      </div>

      <div style="${TOOLTIP_STYLES.grid}">
        <span style="${TOOLTIP_STYLES.gridLabel}">Latitude</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.coordinates[0].toFixed(5)}°</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Longitude</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.coordinates[1].toFixed(5)}°</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Region</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.region}</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Sampled</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.lastSampled}</span>
      </div>

      <div style="${TOOLTIP_STYLES.divider}"></div>

      <div style="${TOOLTIP_STYLES.sectionTitle}">Water Quality</div>
      <div style="${TOOLTIP_STYLES.waterGrid}">
        <span style="${TOOLTIP_STYLES.waterLabel}">pH</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${waterquality.pH.toFixed(1)}</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Temperature</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${waterquality.temperature.toFixed(1)} °C</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Dissolved O₂</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${waterquality.disolvedOxygen.toFixed(2)} mg/L</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Conductivity</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${waterquality.electricalConductivity.toFixed(1)} µS/cm</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">TDS</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${waterquality.totalDisolvedSolids.toFixed(1)} mg/L</span>
      </div>

      <div style="${TOOLTIP_STYLES.link}">View More</div>

    </div>`;
}

export default function Site({
  map,
  points,
  selectedSite,
  onSelectSite,
  activeRisks,
}: SiteProps) {

  const layerRef   = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  //add site markers
  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.clearLayers();
      map.removeLayer(layerRef.current);
    }

    const layer = L.layerGroup().addTo(map);
    layerRef.current  = layer;
    markersRef.current = {};

    const visiblePoints = activeRisks && activeRisks.length > 0
        ? points.filter((p) => activeRisks.includes(p.contaminationLevel))
        : points;

    visiblePoints.forEach((point) => {
      const marker = L.marker(point.coordinates, {
        icon:         createMarkerIcon(point.contaminationLevel, false),
        zIndexOffset: 500,
      });

      marker.bindTooltip(siteTooltipHTML(point), {
        sticky:    false,
        direction: "right",
        opacity:   1,
        className: "amr-tooltip",
        offset:    [10, 0],
      });

      marker.on("click", () => onSelectSite(point));
      marker.addTo(layer);
      markersRef.current[point.id] = marker;
    });

    return () => {
      layer.clearLayers();
      map.removeLayer(layer);
    };

  }, [map, points, activeRisks]);

  useEffect(() => {
    if (!map) return;

    points.forEach((pt) => {
      const m = markersRef.current[pt.id];
      if (m) m.setIcon(
        createMarkerIcon(pt.contaminationLevel, selectedSite?.id === pt.id)
      );
    });

    if (selectedSite) {
      map.flyTo(selectedSite.coordinates, 13, { animate: true, duration: 0.85 });
    }

  }, [selectedSite]);

  return null;
}
