"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { RISK_COLOUR } from "@/constants/map_constants";
import { type RiverSegment, type ContaminationLevel, getDangerZoneLabel } from "@/types/map_types";
import { SiteData } from "@/types/site_types";

interface RiverProps {
  map: L.Map;
  activeRisks?: ContaminationLevel[];
  selectedYear?: number;
  points: SiteData[];
}

export default function River({ map, activeRisks, selectedYear, points }: RiverProps) {
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
      
      const distanceBetween2Sites = (a: SiteData, b: SiteData) => Math.sqrt(Math.pow(a.latitude - b.latitude,2) + Math.pow(a.longitude -b.longitude, 2));

      //used lowest lat as start point
      const remainingPoints = [...points].sort((a,b) => a.latitude - b.latitude);
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

      const pointCoords: [number, number][] = orderedPoints.map(point => [Number(point.latitude), Number(point.longitude)]);

      L.polyline(pointCoords, {
        color: RISK_COLOUR.unknown.fill,
        weight: 4,
        opacity: 1.0,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(river);

      const dangerZoneSegmentLength = 0.01;
      orderedPoints.forEach((point, index) => {
        if (!point.dangerZone) return;

        const dangerLabel = getDangerZoneLabel(point.dangerZone);
        const dangerColour = RISK_COLOUR[dangerLabel];
        if (!dangerColour) return;

        const pointLat = Number(point.latitude );
        const pointLong = Number(point.longitude);
        const beforePoint = orderedPoints[index-1];
        const afterPoint = orderedPoints[index+1];


        const dangerSegment: [number, number][] = [];

        if (beforePoint) {
          const latDistance = Number(beforePoint.latitude) - pointLat;
          const longDistance = Number(beforePoint.longitude) - pointLong;
          let quickMath = Math.sqrt(latDistance*latDistance + longDistance*longDistance);
          if (quickMath === 0) {
            quickMath = 1;
          }
          const newLat = latDistance/quickMath;
          const newLong = longDistance/quickMath;
          dangerSegment.push([pointLat+newLat*dangerZoneSegmentLength, pointLong+newLong*dangerZoneSegmentLength]);
        }

        dangerSegment.push([pointLat, pointLong]);

        if (afterPoint) {
          const latDistance = Number(afterPoint.latitude) - pointLat;
          const longDistance = Number(afterPoint.longitude) - pointLong;
          let quickMath = Math.sqrt(latDistance*latDistance + longDistance*longDistance);
          if (quickMath === 0) {
            quickMath = 1;
          }
          const newLat = latDistance/quickMath;
          const newLong = longDistance/quickMath;
          dangerSegment.push([pointLat+newLat*dangerZoneSegmentLength, pointLong+newLong*dangerZoneSegmentLength]);
        }

        if (dangerSegment.length < 2) return;

        // Main coloured segment
        L.polyline(dangerSegment, {
          color: dangerColour.fill,
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(river);
      })
  }

    return () => {
      river.clearLayers();
      map.removeLayer(river);
    };
  }, [map, activeRisks, selectedYear]);

  return null;
}