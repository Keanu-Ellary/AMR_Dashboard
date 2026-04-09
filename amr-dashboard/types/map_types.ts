import type { SamplingPoint } from "./site_types";

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
  points:        SamplingPoint[];
  selectedSite:  SamplingPoint | null;
  onSelectSite:  (site: SamplingPoint) => void;
  filters?: MapFilters;
  onFiltersChange: (f: MapFilters) => void;
}

export type ContaminationLevel = "low" | "moderate" | "high" | "unknown" | "filtered";

export interface MapFilters {

  contaminationLevels?: ContaminationLevel[];

  sites?: string[];

  regions?: string[];

  startDate?: string;

  endDate?: string;
}
