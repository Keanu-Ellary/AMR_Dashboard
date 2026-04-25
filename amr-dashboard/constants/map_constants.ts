import type {
  ContaminationLevel,
  MapFilters,
  RiverColourData,
  RiverSegment,
} from "@/types/map_types";

export const RISK_COLOUR: Record<ContaminationLevel, RiverColourData> = {
  unknown: {
    fill: "#1078b9",
    stroke: "#1278b8",
    glow: "#34aaf3",
    label: "Unknown Risk",
  },
  low: {
    fill: "#22c55e",
    stroke: "#16a34a",
    glow: "#86efac",
    label: "Low Risk",
  },
  moderate: {
    fill: "#eab308",
    stroke: "#ca8a04",
    glow: "#fde047",
    label: "Moderate Risk",
  },
  high: {
    fill: "#ef4444",
    stroke: "#dc2626",
    glow: "#fca5a5",
    label: "High Risk",
  },
  filtered: {
    fill: "#0c0c0e",
    stroke: "#0a0b0c",
    glow: "#ffffff",
    label: "Filtered Out",
  },
};

export const DEFAULT_FILTERS: MapFilters = {
  contaminationLevels: ["low", "moderate", "high", "unknown", "filtered"],
  sites: [],
  startDate: "",
  endDate: "",
};

export const CONTAMINATION_LEVEL_ORDER: Record<ContaminationLevel, number> = {
  high: 0,
  moderate: 1,
  low: 2,
  unknown: 3,
  filtered: 4,
};
