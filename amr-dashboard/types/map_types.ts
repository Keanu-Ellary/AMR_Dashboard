import type { SiteData } from "./site_types";

export interface RiverColourData {
  fill:   string;
  stroke: string;
  glow:   string;
  label:  string;
}

export interface RiverSegment {
  id:   string;
  from: string;
  to:   string;
  risk: ContaminationLevel;
  path: [number, number][];
}

export interface MapProps {
  points:        SiteData[];
  selectedSite:  SiteData | null;
  onSelectSite:  (site: SiteData) => void;
  filters?: MapFilters;
  onFiltersChange: (f: MapFilters) => void;
}

export type ContaminationLevel = "low" | "moderate" | "high" | "unknown" | "filtered";

export interface DangerZonesLabels {
  low: "green";
  moderate: "yellow";
  high: "red";
  unknown: "blue";
  filtered: "grey";
}

export type DangerZone = keyof DangerZonesLabels;

export interface MapFilters {

  contaminationLevels?: ContaminationLevel[];

  sites?: string[];

  regions?: string[];

  startDate?: string;

  endDate?: string;
}
