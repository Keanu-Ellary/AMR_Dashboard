"use client";

import React, { useState, useMemo } from "react";
import type { SiteData } from "@/types/site_types";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";
import { Search, FilterX, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface GeoLocationListProps {
  sites: SiteData[];
}

type SortKey = "name" | "totalSamples" | "avgWqi" | "red" | "yellow" | "green" | "latestCollectionDate";
type SortDir = "asc" | "desc";

export default function GeoLocationList({ sites }: GeoLocationListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Group sites by location
  const locationGroups = useMemo(() => {
    const groups: Record<string, SiteData[]> = {};
    sites.forEach((site) => {
      const loc = parseLocationName(site.geoLocName);
      if (!groups[loc]) {
        groups[loc] = [];
      }
      groups[loc].push(site);
    });
    return groups;
  }, [sites]);

  // Aggregate stats per location
  const locationStats = useMemo(() => {
    return Object.entries(locationGroups).map(([name, groupSites]) => {
      // Find latest site data for coordinates and collection date
      const latestSite = [...groupSites].sort(
        (a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()
      )[0];

      // Calculate average WQI
      let wqiSum = 0;
      let wqiCount = 0;
      groupSites.forEach((s) => {
        const wqi = calculateWQI(s.dissolvedO2, s.ph, s.temperature, s.tds);
        if (wqi !== null) {
          wqiSum += wqi;
          wqiCount++;
        }
      });
      const avgWqi = wqiCount > 0 ? wqiSum / wqiCount : null;

      // Risk zone breakdown
      const risks = { red: 0, yellow: 0, green: 0 };
      groupSites.forEach((s) => {
        const zone = s.dangerZone?.toLowerCase();
        if (zone === "red") risks.red++;
        else if (zone === "yellow") risks.yellow++;
        else if (zone === "green") risks.green++;
      });

      return {
        name,
        latestSiteId: latestSite.id,
        latitude: latestSite.latitude,
        longitude: latestSite.longitude,
        totalSamples: groupSites.length,
        avgWqi,
        risks,
        latestCollectionDate: latestSite.collectionDate,
      };
    });
  }, [locationGroups]);

  // Sort aggregated stats
  const sortedLocations = useMemo(() => {
    const copy = [...locationStats];
    copy.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortKey) {
        case "name":
          valA = a.name;
          valB = b.name;
          break;
        case "totalSamples":
          valA = a.totalSamples;
          valB = b.totalSamples;
          break;
        case "avgWqi":
          valA = a.avgWqi ?? -1;
          valB = b.avgWqi ?? -1;
          break;
        case "red":
          valA = a.risks.red;
          valB = b.risks.red;
          break;
        case "yellow":
          valA = a.risks.yellow;
          valB = b.risks.yellow;
          break;
        case "green":
          valA = a.risks.green;
          valB = b.risks.green;
          break;
        case "latestCollectionDate":
          valA = new Date(a.latestCollectionDate).getTime();
          valB = new Date(b.latestCollectionDate).getTime();
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [locationStats, sortKey, sortDir]);

  // Filter based on search term
  const filteredLocations = useMemo(() => {
    return sortedLocations.filter((loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedLocations, searchTerm]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      {/* List Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-indigo-950 text-lg">Geo-Location Summary</h3>
          <p className="text-xs text-gray-500">Grouped diagnostic summary per unique sampling site (Click row to view statistics)</p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Locations Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/70 select-none">
            <tr>
              <th 
                onClick={() => handleSort("name")}
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Location
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
              <th 
                onClick={() => handleSort("totalSamples")}
                className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Samples
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th 
                onClick={() => handleSort("avgWqi")}
                className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Avg WQI
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th 
                onClick={() => handleSort("red")}
                className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  High
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th 
                onClick={() => handleSort("yellow")}
                className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Mod
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th 
                onClick={() => handleSort("green")}
                className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Low
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th 
                onClick={() => handleSort("latestCollectionDate")}
                className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-end gap-1">
                  Latest
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredLocations.map((loc) => {
              return (
                <tr
                  key={loc.name}
                  onClick={() => router.push(`/statistics?location=${encodeURIComponent(loc.name)}&site=${loc.latestSiteId}`)}
                  className="cursor-pointer transition-all duration-150 hover:bg-slate-50/50"
                >
                  {/* Location Name */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-800">
                      {loc.name}
                    </span>
                  </td>

                  {/* Coordinates */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono font-medium">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </td>

                  {/* Samples Count */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-600">
                    {loc.totalSamples}
                  </td>

                  {/* WQI */}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {loc.avgWqi !== null ? (
                      <span
                        className={`text-sm font-extrabold ${
                          loc.avgWqi >= 75
                            ? "text-slate-800"
                            : loc.avgWqi >= 50
                            ? "text-yellow-600"
                            : loc.avgWqi >= 25
                            ? "text-orange-500"
                            : "text-red-600"
                        }`}
                      >
                        {loc.avgWqi.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium italic">N/A</span>
                    )}
                  </td>

                  {/* High Risk */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-600">
                    {loc.risks.red}
                  </td>

                  {/* Mod Risk */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-600">
                    {loc.risks.yellow}
                  </td>

                  {/* Low Risk */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-600">
                    {loc.risks.green}
                  </td>

                  {/* Latest Sample */}
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-slate-500">
                    {new Date(loc.latestCollectionDate).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}

            {filteredLocations.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <FilterX className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
                  No sites found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
