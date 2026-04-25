"use client";

import L from "leaflet";
import { RISK_COLOUR } from "@/constants/map_constants";

const LEGEND_STYLES= {
  wrapper: `
    font-family: 'Open Sans', sans-serif;
    background: #ffffff;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    min-width: 160px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `,
  title: `
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #0f0f0f;
    margin-bottom: 8px;
    font-size: 12px;
  `,
  row: `
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 6px;
  `,
  swatch: (fill: string) => `
    width: 28px;
    height: 12px;
    border-radius: 3px;
    background: ${fill};
    flex-shrink: 0;
  `,
  gradientBar: `
    width: 100%;
    height: 12px;
    border-radius: 3px;
    background: linear-gradient(to right, #22c55e, #eab308, #ef4444);
    margin-bottom: 4px;
  `,
  gradientLabels: `
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #64748b;
    margin-bottom: 12px;
  `,
  label: `
    color: #0f0f0f;
  `,
} as const;

export default function addLegend(map: L.Map) {
  const div = L.DomUtil.create("div", "amr-legend");
  
  const riverColor = RISK_COLOUR.unknown.fill;

  div.innerHTML = `
    <div style="${LEGEND_STYLES.wrapper}">
      <div style="${LEGEND_STYLES.title}">Risk Level</div>
      
      <div style="${LEGEND_STYLES.gradientBar}"></div>
      <div style="${LEGEND_STYLES.gradientLabels}">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>

      <div style="${LEGEND_STYLES.title}">Map Features</div>
      <div style="${LEGEND_STYLES.row}">
        <div style="${LEGEND_STYLES.swatch(riverColor)}"></div>
        <span style="${LEGEND_STYLES.label}">River</span>
      </div>
    </div>
  `;

  div.style.zIndex = "1000";
  div.style.pointerEvents = "auto";
  div.style.position = "relative";

  map.whenReady(() => {
    const bottomLeft = map.getContainer().querySelector(".leaflet-bottom.leaflet-left");
    if (bottomLeft) {
      (bottomLeft as HTMLElement).style.zIndex = "1000";
      bottomLeft.appendChild(div);
    }
  });

  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);
}