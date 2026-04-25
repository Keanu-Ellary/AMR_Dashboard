"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { RISK_COLOUR } from "@/constants/map_constants";
import { blendHexColors } from "@/utils/colorUtils";
import {
  type RiverSegment,
  type ContaminationLevel,
  getDangerZoneLabel,
} from "@/types/map_types";
import { SiteData } from "@/types/site_types";

interface RiverProps {
  map: L.Map;
  activeRisks?: ContaminationLevel[];
  selectedYear?: number;
  points: SiteData[];
}

export default function River({
  map,
  activeRisks,
  selectedYear,
  points,
}: RiverProps) {
  const layerRef = useRef<L.LayerGroup | null>(null);

  function segmentTooltipHTML(seg: RiverSegment): string {
    const c = RISK_COLOUR[seg.risk] ?? RISK_COLOUR.moderate;
    return `
      <div style="font-family:'Open Sans', sans-serif;font-size:11px;color:#e2e8f0;">
        <div style="font-size:9px;color:#64748b;margin-bottom:4px;">RIVER SEGMENT</div>
        <div style="font-weight:700;margin-bottom:6px;">${seg.from} → ${seg.to}</div>
        <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;
          background:${c.glow};color:${c.fill};">${c.label}
        </span>
      </div>`;
  }

  useEffect(() => {
    if (!map) return;

    //clear prev. layers
    if (layerRef.current) {
      layerRef.current.clearLayers();
      map.removeLayer(layerRef.current);
    }

    const river = L.layerGroup().addTo(map);
    layerRef.current = river;

    if (points && points.length > 1) {
      const distanceBetween2Sites = (a: SiteData, b: SiteData) =>
        Math.sqrt(
          Math.pow(a.latitude - b.latitude, 2) +
            Math.pow(a.longitude - b.longitude, 2),
        );

      //used lowest lat as start point
      const remainingPoints = [...points].sort(
        (a, b) => a.latitude - b.latitude,
      );
      const orderedPoints: SiteData[] = [remainingPoints.shift()!];

      while (remainingPoints.length > 0) {
        const last = orderedPoints[orderedPoints.length - 1];

        let nearestIndex = 0;
        let nearestDist = Infinity;

        remainingPoints.forEach((point, index) => {
          const dist = distanceBetween2Sites(last, point);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIndex = index;
          }
        });

        orderedPoints.push(remainingPoints.splice(nearestIndex, 1)[0]);
      }

      const pointCoords: [number, number][] = orderedPoints.map((point) => [
        Number(point.latitude),
        Number(point.longitude),
      ]);

      L.polyline(pointCoords, {
        color: RISK_COLOUR.unknown.fill,
        weight: 4,
        opacity: 1.0,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(river);

      for (let i = 0; i < orderedPoints.length - 1; i++) {
        const p1 = orderedPoints[i];
        const p2 = orderedPoints[i + 1];

        const lat1 = Number(p1.latitude);
        const lon1 = Number(p1.longitude);
        const lat2 = Number(p2.latitude);
        const lon2 = Number(p2.longitude);

        const getPointColor = (p: SiteData) => {
          if (p.blendedColor) return p.blendedColor;
          if (p.dangerZone) {
            const label = getDangerZoneLabel(p.dangerZone);
            return RISK_COLOUR[label]?.fill || RISK_COLOUR.unknown.fill;
          }
          return RISK_COLOUR.unknown.fill;
        };

        const color1 = getPointColor(p1);
        const color2 = getPointColor(p2);

        const segments = 20;
        for (let j = 0; j < segments; j++) {
          const t1 = j / segments;
          const t2 = (j + 1) / segments;

          const latA = lat1 + (lat2 - lat1) * t1;
          const lonA = lon1 + (lon2 - lon1) * t1;
          const latB = lat1 + (lat2 - lat1) * t2;
          const lonB = lon1 + (lon2 - lon1) * t2;

          const color = blendHexColors(color1, color2, (t1 + t2) / 2);

          L.polyline(
            [
              [latA, lonA],
              [latB, lonB],
            ],
            {
              color: color,
              weight: 5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            },
          ).addTo(river);
        }
      }
    }

    return () => {
      river.clearLayers();
      map.removeLayer(river);
    };
  }, [map, activeRisks, selectedYear, points]);

  return null;
}
