import type { ContaminationLevel, DangerZone } from "@/types/map_types";

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


export interface SiteData {
        id?: number;
        // required:
        sampleName: string,
        isolationSource: string,
        collectionDate: Date,
        geoLocName: string,
        latitude: number;
        longitude: number;
        amrResGenes: string,
        predictedSir: string,
        sampleAnalysisType: string,

        // optional
        isolateId?: string,
        orgamism?: string,
        sampleId?: string,
        collectedBy?: string,
        sequenceName?: string,
        elementType?: string,
        class?: string,
        subclass?: string,
        targetLength?: number,
        referenceLength?: number,
        coverage?: number,
        identity?: number,
        alignmentLength?: number,
        accession?: string,
        virtulenceGenes?: string,
        plasmidReplicons?: string,
        temperature?: number;
        ph?: number;
        tds?: number;
        ec?: number;
        dissolvedO2?: number;
        
        // extra
        dangerZone?: DangerZone;
        imageBase64?: string;
}