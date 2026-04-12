"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { getDangerZoneLabel, type ContaminationLevel, type DangerZone } from "@/types/map_types";
import type { SiteData } from "@/types/site_types";
import { RISK_COLOUR } from "@/constants/map_constants";
import siteImage from "../../assets/site.png";

interface SiteProps {
  map: L.Map;
  points: SiteData[];
  selectedSite: SiteData | null;
  onSelectSite: (site: SiteData) => void;
  activeDangerZones?: DangerZone[];
}

function createMarkerIcon(
  riskLevel: ContaminationLevel,
  isSelected: boolean
): L.DivIcon {

  const markerColour = RISK_COLOUR[riskLevel] ?? RISK_COLOUR.moderate;
  const markerInner = isSelected ? 20 : 14;
  const markerBox  = markerInner + 12;

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="${markerBox}" height="${markerBox}" viewBox="0 0 ${markerBox} ${markerBox}">
        <circle
          cx="${markerBox / 2}" cy="${markerBox / 2}" r="${markerBox / 2 - 1}"
          fill="${markerColour.glow}"/>
        <circle
          cx="${markerBox / 2}" cy="${markerBox / 2}" r="${markerInner / 2}"
          fill="${markerColour.fill}" stroke="${markerColour.stroke}" stroke-width="2.5"/>
        ${isSelected ? `
          <circle
            cx="${markerBox / 2}" cy="${markerBox / 2}" r="${markerInner / 4}"
            fill="white" opacity="0.9"/>
        ` : ""}
      </svg>`,
    className: "",
    iconSize: [markerBox, markerBox],
    iconAnchor: [markerBox / 2, markerBox / 2],
  });
}

function siteTooltipHTML(point: SiteData): string {
  let riskColor = RISK_COLOUR.unknown;
  if (point.dangerZone) {
    const dangerZoneLabel = getDangerZoneLabel(point.dangerZone);
    riskColor  = RISK_COLOUR[dangerZoneLabel];
 }

  return `
    <div style="${TOOLTIP_STYLES.wrapper}">

      <img src="/site.png" alt="${point.sampleName}" style="${TOOLTIP_STYLES.siteImage}" />
      <div style="${TOOLTIP_STYLES.name}">${point.sampleName}</div>
      <div style="${TOOLTIP_STYLES.badge}">
        <span style="${TOOLTIP_STYLES.riskBadge(riskColor.glow, riskColor.fill)}">${riskColor.label}</span>
      </div>

      <div style="${TOOLTIP_STYLES.grid}">
        <span style="${TOOLTIP_STYLES.gridLabel}">Latitude</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.latitude.toFixed(5)}°</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Longitude</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.longitude.toFixed(5)}°</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Region</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.geoLocName}</span>

        <span style="${TOOLTIP_STYLES.gridLabel}">Sampled</span>
        <span style="${TOOLTIP_STYLES.gridValue}">${point.collectionDate}</span>
      </div>

      <div style="${TOOLTIP_STYLES.divider}"></div>

      <div style="${TOOLTIP_STYLES.sectionTitle}">Water Quality</div>
      <div style="${TOOLTIP_STYLES.waterGrid}">
        <span style="${TOOLTIP_STYLES.waterLabel}">pH</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${point.ph?.toFixed(1)}</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Temperature</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${point.temperature?.toFixed(1)} °C</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Dissolved O₂</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${point.dissolvedO2?.toFixed(2)} mg/L</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">Conductivity</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${point.ec?.toFixed(1)} µS/cm</span>

        <span style="${TOOLTIP_STYLES.waterLabel}">TDS</span>
        <span style="${TOOLTIP_STYLES.waterValue}">${point.tds?.toFixed(1)} mg/L</span>
      </div>

      <div style="${TOOLTIP_STYLES.link}">Click To View More</div>

    </div>`;
}

export default function Site({
  map,
  points,
  selectedSite,
  onSelectSite,
  activeDangerZones,
}: SiteProps) {

  const layerRef   = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  //add site markers
  useEffect(() => {
    if (!map) return;

    const layer = layerRef.current ?? L.layerGroup().addTo(map);
    layerRef.current = layer;

    layer.clearLayers();

    layerRef.current  = layer;
    markersRef.current = {};

    const visiblePoints = activeDangerZones && activeDangerZones.length > 0
        ? points.filter((p) => activeDangerZones.includes(p.dangerZone as DangerZone))
        : points;

    visiblePoints.forEach((point) => {
      if (!point.latitude || !point.longitude) return;

      let markerDangerZone = getDangerZoneLabel("blue");
        if (point.dangerZone) {
          markerDangerZone = getDangerZoneLabel(point.dangerZone);
        }
        const marker = L.marker([point.latitude, point.longitude], {
          icon:         createMarkerIcon(markerDangerZone, false),
          zIndexOffset: 500,
        });

      marker.bindTooltip(siteTooltipHTML(point), {
        sticky:    false,
        direction: "right",
        opacity:   1,
        className: "amr-tooltip",
        offset:    [10, 0],
        interactive: true,
        permanent: false,
      });

      const handleViewSiteStats = (point: SiteData) => {
        window.location.href = `/statistics?site=${point.id}`
      }

      marker.on("click", () => handleViewSiteStats(point));
      marker.addTo(layer);
      if (point.id)
        markersRef.current[point.id] = marker;
    });

    return () => {
      layer.clearLayers();
    };

  }, [map, points, activeDangerZones]);

  useEffect(() => {
    if (!map) return;

    points.forEach((pt) => {
      if (!pt.id) return;

      let markerDangerZone = getDangerZoneLabel("blue");
        if (pt.dangerZone) {
          markerDangerZone = getDangerZoneLabel(pt.dangerZone);
        }
      const m = markersRef.current[pt.id];
      if (m) m.setIcon(
        createMarkerIcon(markerDangerZone, selectedSite?.id === pt.id)
      );
    });

    if (selectedSite) {
      map.flyTo([selectedSite.latitude, selectedSite.longitude], 13, { animate: true, duration: 0.85 });
    }

  }, [selectedSite]);

  return null;
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
