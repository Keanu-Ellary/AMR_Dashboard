"use client";

import L from "leaflet";
import ReactDOM from "react-dom/client";
import type { SiteData } from "@/types/site_types";
import type { ContaminationLevel, MapFilters } from "@/types/map_types";
import { RISK_COLOUR } from "@/constants/map_constants";

interface FilterPanelProps {
  filters: MapFilters;
  uniqueSites: string[];
  onFiltersChange: (f: MapFilters) => void;
}

function FilterPanel({ filters, uniqueSites, onFiltersChange }: FilterPanelProps) {
  const riskEntries = Object.entries(RISK_COLOUR).filter(([key]) => key !== "filtered" && key !== "unknown");

  const updateDangerLevelFilters = (level:ContaminationLevel) => {
    const levelExists = filters.contaminationLevels?.includes(level);
    onFiltersChange({
      ...filters,
      contaminationLevels: levelExists ? filters.contaminationLevels?.filter((l) => l !== level) : [...(filters.contaminationLevels ?? []),level],
    });
  };

  const updateSiteFilters = (site: string) => {
    const siteExists = filters.sites?.includes(site);
    onFiltersChange({
      ...filters,
      sites: siteExists ? filters.sites?.filter((s) => s !== site) : [...(filters.sites ?? []), site],
    });
  };

  return (
    <div className="bg-white rounded-lg p-3 text-xs min-w-[200px] max-h-80 overflow-y-auto shadow-md font-sans">
      <div className="font-bold tracking-widest text-gray-900 mb-2 uppercase text-[11px]">Filters</div>

      <div className="mb-2">
        <div className="font-bold text-[11px] text-gray-900 mb-1 mt-2 uppercase tracking-wide">Danger Zone</div>
        {riskEntries.map(([dangerZone, dangerColour]) => (
          <label key={dangerZone} className="flex items-center gap-2 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.contaminationLevels?.includes(dangerZone as ContaminationLevel) ?? false}
              onChange={() => updateDangerLevelFilters(dangerZone as ContaminationLevel)}
            />
            <span
              className="w-4 h-1.5 rounded-full flex-shrink-0"
              style={{ background: dangerColour.fill }}
            />
            <span className="text-gray-700">{dangerColour.label}</span>
          </label>
        ))}
      </div>

      <div className="mb-2">
        <div className="font-bold text-[11px] text-gray-900 mb-1 mt-2 uppercase tracking-wide">Sites</div>
        {uniqueSites.map((site) => (
          <label key={site} className="flex items-center gap-2 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.sites?.includes(site) ?? false}
              onChange={() => updateSiteFilters(site)}
            />
            <span className="text-gray-700">{site}</span>
          </label>
        ))}
      </div>

      <div>
        <div className="font-bold text-[11px] text-gray-900 mb-1 mt-2 uppercase tracking-wide">Date Range</div>
        <input
          type="date"
          value={filters.startDate ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
          className="w-full mb-1 px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-blue-400"
        />
        <input
          type="date"
          value={filters.endDate ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
          className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-blue-400"
        />
      </div>
    </div>
  );
}

function getUniqueSites(points: SiteData[]): string[] {
  return [...new Set(points.map((p) => {
    const site = p.geoLocName;
    if (site.includes("Apies River - ")) return site.split("Apies River - ")[1]?.trim() ?? site;
    if (site.includes(" - Apies River")) return site.split(" - Apies River")[0]?.trim() ?? site;
    return site;
  }))];
}

export default function addFilterPanel(
  map: L.Map,
  points: SiteData[],
  filters: MapFilters,
  setFilters: (f: MapFilters) => void
) {
  const div = L.DomUtil.create("div", "amr-filter");
  div.style.zIndex = "1000";
  div.style.pointerEvents = "auto";

  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);

  const uniqueSites = getUniqueSites(points);
  const root = ReactDOM.createRoot(div);

  // Expose a re-render function so filters stay in sync
  const render = (currentFilters: MapFilters) => {
    root.render(
      <FilterPanel
        filters={currentFilters}
        uniqueSites={uniqueSites}
        onFiltersChange={(updated) => {
          render(updated);
          setFilters(updated);
        }}
      />
    );
  };

  render(filters);

  map.whenReady(() => {
    const topRight = map.getContainer().querySelector(".leaflet-top.leaflet-right");
    if (topRight) {
      (topRight as HTMLElement).style.zIndex = "1000";
      topRight.appendChild(div);
    }
  });
}