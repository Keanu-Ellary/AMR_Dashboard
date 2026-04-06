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
}

export type ContaminationLevel = "low" | "moderate" | "high" | "unknown";
