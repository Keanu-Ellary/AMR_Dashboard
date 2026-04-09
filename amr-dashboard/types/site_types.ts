import type { ContaminationLevel } from "@/types/map_types";

export interface SamplingPoint {
  id: string;
  name: string;
  coordinates: [number, number];
  region: string;
  lastSampled: string;
  contaminationLevel: ContaminationLevel;
  description: string;
  metadata: WaterMetadata;
}

export interface AntibioticResult {
  resistant: number;
  intermediate: number;
  susceptible: number;
}

export interface OrganismResult {
  name: string;
  count: number;
  mdr: number;
}

export interface ResistanceProfile {
  isolates: number;
  resistanceIndex: number;
  antibiotics: Record<string, AntibioticResult>;
  organisms: OrganismResult[];
}

export interface WaterMetadata {
  pH: number;
  temperature: number;
  disolvedOxygen: number;
  electricalConductivity: number;
  totalDisolvedSolids: number;
}