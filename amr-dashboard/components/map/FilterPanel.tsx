"use client";

import L from "leaflet";
import type { SamplingPoint } from "@/types/site_types";
import type { ContaminationLevel, MapFilters } from "@/types/map_types";
import { RISK_COLOUR } from "@/constants/map_constants";

const FILTER_STYLES = {
  wrapper: `
    font-family: 'Open Sans', sans-serif;
    background: #ffffff;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    min-width: 200px;
    max-height: 320px;
    overflow-y: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    position: relative;
    z-index: 1000;
  `,
  title: `
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #0f0f0f;
    margin-bottom: 10px;
    font-size: 12px;
  `,
  sectionTitle: `
    font-weight: 700;
    font-size: 11px;
    color: #0f0f0f;
    margin-bottom: 6px;
    margin-top: 10px;
  `,
  section: `
    margin-bottom: 8px;
  `,
  row: `
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    cursor: pointer;
  `,
  riverColour: (fill: string) => `
    width: 16px;
    height: 6px;
    border-radius: 3px;
    background: ${fill};
    flex-shrink: 0;
  `,
  dateInput: `
    width: 100%;
    margin-bottom: 4px;
    padding: 4px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 11px;
    font-family: 'Open Sans', sans-serif;
  `,
} as const;

function renderHTML(
  filters:       MapFilters,
  uniqueSites:   string[],
  uniqueRegions: string[]
): string {
  return `
    <div style="${FILTER_STYLES.wrapper}">

      <div style="${FILTER_STYLES.title}">Filters</div>

      <div style="${FILTER_STYLES.section}">
        <div style="${FILTER_STYLES.sectionTitle}">Contamination Level</div>
        ${Object.entries(RISK_COLOUR).map(([level, v]) => `
          <div style="${FILTER_STYLES.row}">
            <input type="checkbox" data-level="${level}"
              ${filters.contaminationLevels?.includes(level as ContaminationLevel) ? "checked" : ""}
            />
            <div style="${FILTER_STYLES.riverColour(v.fill)}"></div>
            <span>${v.label}</span>
          </div>
        `).join("")}
      </div>

      <div style="${FILTER_STYLES.section}">
        <div style="${FILTER_STYLES.sectionTitle}">Sites</div>
        ${uniqueSites.map(site => `
          <div style="${FILTER_STYLES.row}">
            <input type="checkbox" data-site="${site}"
              ${filters.sites?.includes(site) ? "checked" : ""}
            />
            <span>${site}</span>
          </div>
        `).join("")}
      </div>

      <div style="${FILTER_STYLES.section}">
        <div style="${FILTER_STYLES.sectionTitle}">Regions</div>
        ${uniqueRegions.map(region => `
          <div style="${FILTER_STYLES.row}">
            <input type="checkbox" data-region="${region}"
              ${filters.regions?.includes(region) ? "checked" : ""}
            />
            <span>${region}</span>
          </div>
        `).join("")}
      </div>

      <div style="${FILTER_STYLES.section}">
        <div style="${FILTER_STYLES.sectionTitle}">Date Range</div>
        <input type="date" id="startDate"
          style="${FILTER_STYLES.dateInput}"
          value="${filters.startDate || ""}"
        />
        <input type="date" id="endDate"
          style="${FILTER_STYLES.dateInput}"
          value="${filters.endDate || ""}"
        />
      </div>

    </div>
  `;
}

function attachEvents(
  div:           HTMLElement,
  filters:       MapFilters,
  uniqueSites:   string[],
  uniqueRegions: string[],
  setFilters:    (f: MapFilters) => void
) {
  div.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const level  = target.getAttribute("data-level");
      const site   = target.getAttribute("data-site");
      const region = target.getAttribute("data-region");

      let updated = { ...filters };

      if (level) {
        const exists = filters.contaminationLevels?.includes(level as ContaminationLevel);
        updated.contaminationLevels = exists
          ? filters.contaminationLevels?.filter((l) => l !== level)
          : [...(filters.contaminationLevels ?? []), level as ContaminationLevel];
      }

      if (site) {
        const exists = filters.sites?.includes(site);
        updated.sites = exists
          ? filters.sites?.filter((s) => s !== site)
          : [...(filters.sites ?? []), site];
      }

      if (region) {
        const exists = filters.regions?.includes(region);
        updated.regions = exists
          ? filters.regions?.filter((r) => r !== region)
          : [...(filters.regions ?? []), region];
      }

      if (target.id === "startDate") updated.startDate = target.value;
      if (target.id === "endDate")   updated.endDate   = target.value;

      // Re-render with new filters
      div.innerHTML = renderHTML(updated, uniqueSites, uniqueRegions);
      attachEvents(div, updated, uniqueSites, uniqueRegions, setFilters);

      setFilters(updated);
    });
  });
}

export default function addFilterPanel(
  map:        L.Map,
  points:     SamplingPoint[],
  filters:    MapFilters,
  setFilters: (f: MapFilters) => void
) {
  const div = L.DomUtil.create("div", "amr-filter");

  const uniqueSites   = [...new Set(points.map((p) => p.name))];
  const uniqueRegions = [...new Set(points.map((p) => p.region))];

  div.innerHTML = renderHTML(filters, uniqueSites, uniqueRegions);
  attachEvents(div, filters, uniqueSites, uniqueRegions, setFilters);

  div.style.zIndex        = "1000";
  div.style.pointerEvents = "auto";
  div.style.position      = "relative";

  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);

  map.whenReady(() => {
    const topRight = map.getContainer()
      .querySelector(".leaflet-top.leaflet-right");

    if (topRight) {
      (topRight as HTMLElement).style.zIndex = "1000";
      topRight.appendChild(div);
    }
  });
}