"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { RIVER_SEGMENTS, RISK_COLOUR } from "@/constants/map_constants";
import type { RiverSegment, ContaminationLevel } from "@/types/map_types";

interface RiverProps {
  map: L.Map;
  activeRisks?: ContaminationLevel[];
  selectedYear?: number;
}

export default function River({ map, activeRisks, selectedYear }: RiverProps) {
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

    const segmentsToRender = activeRisks && activeRisks.length > 0
        ? RIVER_SEGMENTS.filter((seg) => activeRisks.includes(seg.risk))
        : RIVER_SEGMENTS; 

    segmentsToRender.forEach((seg) => {
      const c = RISK_COLOUR[seg.risk] ?? RISK_COLOUR.moderate;

      L.polyline(seg.path, {
        color: c.fill,
        weight: 14,
        opacity: 0.13,
      }).addTo(river);

      const line = L.polyline(seg.path, {
        color: c.fill,
        weight: 5,
        opacity: 0.88,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(river);

      line.bindTooltip(segmentTooltipHTML(seg), {
        sticky: true,
        direction: "top",
        opacity: 1,
        className: "amr-tooltip",
      });
    });

    return () => {
      river.clearLayers();
      map.removeLayer(river);
    };
  }, [map, activeRisks, selectedYear]);

  return null;
}