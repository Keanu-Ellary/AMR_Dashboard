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

function FilterPanel({
  filters,
  uniqueSites,
  onFiltersChange,
}: FilterPanelProps) {
  const riskEntries = Object.entries(RISK_COLOUR).filter(
    ([key]) => key !== "filtered" && key !== "unknown",
  );

  const updateDangerLevelFilters = (level: ContaminationLevel) => {
    const currentLevels = filters.contaminationLevels ?? [];
    const levelExists = currentLevels.includes(level);
    onFiltersChange({
      ...filters,
      contaminationLevels: levelExists
        ? currentLevels.filter((l) => l !== level)
        : [...currentLevels, level],
    });
  };

  const updateSiteFilters = (site: string) => {
    const currentSites = filters.sites ?? [];
    const siteExists = currentSites.includes(site);
    onFiltersChange({
      ...filters,
      sites: siteExists
        ? currentSites.filter((s) => s !== site)
        : [...currentSites, site],
    });
  };

  return (
    <div className="bg-white rounded-lg p-5 text-sm w-[280px] max-h-[85vh] overflow-y-auto shadow-xl border border-gray-100 font-sans m-2">
      <div className="font-bold tracking-widest text-gray-900 mb-4 uppercase text-xs flex justify-between items-center border-b pb-2">
        <span>Map Filters</span>
        <button
          onClick={() =>
            onFiltersChange({
              contaminationLevels: [
                "low",
                "moderate",
                "high",
                "unknown",
                "filtered",
              ],
              sites: [],
              startDate: "",
              endDate: "",
            })
          }
          className="text-[10px] text-blue-600 hover:text-blue-800 normal-case font-semibold"
        >
          Reset
        </button>
      </div>

      <div className="mb-4">
        <div className="font-bold text-[10px] text-gray-400 mb-2 uppercase tracking-widest">
          Contamination Level
        </div>
        <div className="space-y-1">
          {riskEntries.map(([dangerZone, dangerColour]) => (
            <label
              key={dangerZone}
              className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={
                  filters.contaminationLevels?.includes(
                    dangerZone as ContaminationLevel,
                  ) ?? false
                }
                onChange={() =>
                  updateDangerLevelFilters(dangerZone as ContaminationLevel)
                }
              />
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  background: dangerColour.fill,
                  border: `1px solid ${dangerColour.stroke}`,
                }}
              />
              <span className="text-gray-700 font-medium">
                {dangerColour.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="font-bold text-[10px] text-gray-400 mb-2 uppercase tracking-widest">
          Sampling Sites
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {uniqueSites.sort().map((site) => (
            <label
              key={site}
              className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={filters.sites?.includes(site) ?? false}
                onChange={() => updateSiteFilters(site)}
              />
              <span className="text-gray-700 font-medium truncate" title={site}>
                {site}
              </span>
            </label>
          ))}
        </div>
      </div>


    </div>
  );
}

function getUniqueSites(points: SiteData[]): string[] {
  return [
    ...new Set(
      points.map((p) => {
        const site = p.geoLocName;
        if (site.includes("Apies River - "))
          return site.split("Apies River - ")[1]?.trim() ?? site;
        if (site.includes(" - Apies River"))
          return site.split(" - Apies River")[0]?.trim() ?? site;
        return site;
      }),
    ),
  ].filter(Boolean);
}

export default function addFilterPanel(
  map: L.Map,
  points: SiteData[],
  filters: MapFilters,
  setFilters: (f: MapFilters) => void,
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
      />,
    );
  };

  render(filters);

  map.whenReady(() => {
    const topRight = map
      .getContainer()
      .querySelector(".leaflet-top.leaflet-right");
    if (topRight) {
      (topRight as HTMLElement).style.zIndex = "1000";
      topRight.appendChild(div);
    }
  });
}
