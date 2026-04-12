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
  allPoints: SiteData[];
}

export type ContaminationLevel = "low" | "moderate" | "high" | "unknown" | "filtered";
export type DangerZone = "green" | "yellow" | "red" | "blue" | "grey";
export type DangerZonesLabels = Record<DangerZone, ContaminationLevel>;

export function getDangerZoneLabel(zone: DangerZone): ContaminationLevel {
  const labels: DangerZonesLabels = {
    green: "low",
    yellow: "moderate",
    red: "high",
    blue: "unknown",
    grey: "filtered",
  };
  return labels[zone];
}

export interface MapFilters {

  contaminationLevels?: ContaminationLevel[];

  sites?: string[];

  regions?: string[];

  startDate?: string;

  endDate?: string;
}
