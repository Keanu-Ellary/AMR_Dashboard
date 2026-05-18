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
