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
    height: 5px;
    border-radius: 3px;
    background: ${fill};
    flex-shrink: 0;
  `,
  label: `
    color: #0f0f0f;
  `,
} as const;

export default function addLegend(map: L.Map) {
  const div = L.DomUtil.create("div", "amr-legend");
  const riskEntries = Object.entries(RISK_COLOUR).filter(([key]) => key !== "filtered");

  div.innerHTML = `
    <div style="${LEGEND_STYLES.wrapper}">
      <div style="${LEGEND_STYLES.title}">Danger Zone</div>
      ${riskEntries.map(([, v]) => `
        <div style="${LEGEND_STYLES.row}">
          <div style="${LEGEND_STYLES.swatch(v.fill)}"></div>
          <span style="${LEGEND_STYLES.label}">${v.label}</span>
        </div>
      `).join("")}
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