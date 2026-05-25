import type { SiteData } from "@/types/site_types";

/**
 * Parses a location name to remove "Apies River" prefix or suffix.
 * Handles cases where both prefix and suffix might be present.
 * 
 * @param geoLocName The raw geographic location name.
 * @returns The parsed location name.
 */
export function parseLocationName(geoLocName: string): string {
  if (!geoLocName) return "";

  let name = geoLocName;

  if (name.includes("Apies River - ")) {
    name = name.split("Apies River - ")[1]?.trim() ?? name;
  }
  
  if (name.includes(" - Apies River")) {
    name = name.split(" - Apies River")[0]?.trim() ?? name;
  }
  
  return name;
}

/**
 * Extracts unique parsed location names from an array of sites.
 * 
 * @param sites Array of SiteData objects.
 * @returns A sorted array of unique parsed location names.
 */
export function getUniqueLocations(sites: SiteData[]): string[] {
  if (!sites) return [];
  const locations = sites.map((site) => parseLocationName(site.geoLocName));
  return Array.from(new Set(locations)).sort();
}

/**
 * Groups sites by their parsed location name.
 * 
 * @param sites Array of SiteData objects.
 * @returns A record where keys are parsed location names and values are arrays of SiteData.
 */
export function groupSitesByLocation(sites: SiteData[]): Record<string, SiteData[]> {
  if (!sites) return {};
  return sites.reduce((groups, site) => {
    const location = parseLocationName(site.geoLocName);
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(site);
    return groups;
  }, {} as Record<string, SiteData[]>);
}

function normalizePH(ph: number): number {
  if (ph >= 7 && ph <= 7.5) return 100;
  if (ph < 4 || ph > 11) return 0;
  if (ph < 7) return ((ph - 4) / 3) * 100;
  return ((11 - ph) / 3.5) * 100;
}

function normalizeDO(dissolvedO2: number): number {
  if (dissolvedO2 >= 8) return 100;
  if (dissolvedO2 <= 2) return 0;
  return ((dissolvedO2 - 2) / 6) * 100;
}

function normalizeTemp(temp: number): number {
  if (temp >= 15 && temp <= 25) return 100;
  if (temp < 5 || temp > 35) return 0;
  if (temp < 15) return ((temp - 5) / 10) * 100;
  return ((35 - temp) / 10) * 100;
}

function normalizeTDS(tds: number): number {
  if (tds <= 50) return 100;
  if (tds >= 1000) return 0;
  return 100 - ((tds - 50) / 950) * 100;
}

export function calculateWQI(
  dissolvedO2: number | null | undefined,
  ph: number | null | undefined,
  temp: number | null | undefined,
  tds: number | null | undefined
): number | null {
  if (
    dissolvedO2 === null || dissolvedO2 === undefined ||
    ph === null || ph === undefined ||
    temp === null || temp === undefined ||
    tds === null || tds === undefined
  ) {
    return null;
  }

  return (
    0.35 * normalizeDO(dissolvedO2) +
    0.25 * normalizePH(ph) +
    0.20 * normalizeTemp(temp) +
    0.20 * normalizeTDS(tds)
  );
}

export function getWqiBracket(wqi: number | null): string {
  if (wqi === null) return "N/A";
  if (wqi <= 25) return "0-25";
  if (wqi <= 50) return "26-50";
  if (wqi <= 75) return "51-75";
  return "76-100";
}

