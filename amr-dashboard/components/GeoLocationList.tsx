"use client";

import React, { useState, useMemo } from "react";
import type { SiteData } from "@/types/site_types";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";
import { useDashboard } from "./DashboardContext";
import { Search, MapPin, FilterX, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import Link from "next/link";

interface GeoLocationListProps {
  sites: SiteData[];
}

export default function GeoLocationList({ sites }: GeoLocationListProps) {
  const { filters, toggleSite } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  const activeSites = filters.sites ?? [];
  const isAnySiteSelected = activeSites.length > 0;

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

  // Filter based on search term
  const filteredLocations = useMemo(() => {
    return locationStats.filter((loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locationStats, searchTerm]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      {/* List Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-indigo-950 text-lg">Geo-Location Summary</h3>
          <p className="text-xs text-gray-500">Grouped diagnostic summary per unique sampling site (Click row to filter)</p>
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
          <thead className="bg-slate-50/70">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location Name</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Samples</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Avg WQI</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Zones Breakdown</th>
              <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Latest Sample / Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredLocations.map((loc) => {
              const isSelected = activeSites.includes(loc.name);
              const opacity = !isAnySiteSelected || isSelected ? "opacity-100" : "opacity-45";
              const bgClass = isSelected
                ? "bg-indigo-50/60 hover:bg-indigo-50"
                : "hover:bg-slate-50/50";

              return (
                <tr
                  key={loc.name}
                  onClick={(e) => toggleSite(loc.name, e.ctrlKey || e.metaKey)}
                  className={`cursor-pointer transition-all duration-150 ${bgClass} ${opacity}`}
                >
                  {/* Location Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className={`h-4 w-4 ${isSelected ? "text-indigo-600" : "text-gray-400"}`} />
                      <span className={`text-sm font-bold ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                        {loc.name}
                      </span>
                    </div>
                  </td>

                  {/* Coordinates */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </td>

                  {/* Samples Count */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-700">
                    {loc.totalSamples}
                  </td>

                  {/* WQI */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {loc.avgWqi !== null ? (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-sm ${
                          loc.avgWqi >= 76
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : loc.avgWqi >= 51
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {loc.avgWqi.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">N/A</span>
                    )}
                  </td>

                  {/* Risks Breakdown */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      {/* High Risk (Red) */}
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <ShieldAlert className="h-3.5 w-3.5 fill-red-50" />
                        {loc.risks.red}
                      </span>
                      {/* Moderate Risk (Yellow) */}
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                        <Shield className="h-3.5 w-3.5 fill-yellow-50" />
                        {loc.risks.yellow}
                      </span>
                      {/* Low Risk (Green) */}
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5 fill-emerald-50" />
                        {loc.risks.green}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-slate-500 font-medium">
                        {new Date(loc.latestCollectionDate).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Link
                        href={`/statistics?location=${encodeURIComponent(loc.name)}&site=${loc.latestSiteId}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                      >
                        View Stats
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredLocations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
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
