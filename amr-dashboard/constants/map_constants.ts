import type { ContaminationLevel, MapFilters, RiverColourData, RiverSegment } from "@/types/map_types";

export const RISK_COLOUR: Record<ContaminationLevel, RiverColourData> = {
  low: { fill: "#09ff00", stroke: "#000000", glow: "#74ff6f" ,  label: "Low AMR Levels" },
  moderate: { fill: "#ffea00", stroke: "#000000", glow: "#fff7a7",  label: "Moderate AMR Levels" },
  high: { fill: "#fc0606", stroke: "#110000", glow: "#ff9797",   label: "High AMR Levels" },
  filtered: { fill: "#0c0c0e", stroke: "#0a0b0c", glow: "#ffffff",   label: "Filtered Out" },
};

export const DEFAULT_FILTERS: MapFilters = {
  contaminationLevels: ["low", "moderate", "high", "filtered"],
  sites:               [],
  startDate:           "",
  endDate:             "",
};

export const CONTAMINATION_LEVEL_ORDER: Record<ContaminationLevel, number> = {
    high: 0,
    moderate: 1,
    low: 2,
    filtered: 3,
  };
