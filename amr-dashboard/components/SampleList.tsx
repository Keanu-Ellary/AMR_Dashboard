"use client";

import React, { useState, useMemo } from "react";
import type { SiteData } from "@/types/site_types";
import { useDashboard } from "./DashboardContext";
import {
  parseLocationName,
  calculateWQI,
  getWqiBracket,
} from "@/utils/siteUtils";
import { getDangerZoneLabel } from "@/types/map_types";
import Link from "next/link";
import {
  Search,
  FlaskConical,
  ArrowUpDown,
  FilterX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SampleListProps {
  sites: SiteData[];
}

type SortKey = "sampleName" | "organism" | "location" | "date" | "wqi" | "risk";
type SortDir = "asc" | "desc";

export default function SampleList({ sites }: SampleListProps) {
  const { filters, selectedWqiBrackets } = useDashboard();

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Filter raw sites based on global DashboardContext
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      // Risk levels filter
      if (filters.contaminationLevels && filters.contaminationLevels.length > 0) {
        const level = getDangerZoneLabel(s.dangerZone as any);
        if (!filters.contaminationLevels.includes(level)) return false;
      }

      // Geo locations filter
      if (filters.sites && filters.sites.length > 0) {
        const loc = parseLocationName(s.geoLocName);
        if (!filters.sites.includes(loc)) return false;
      }

      // Date range filters
      if (filters.startDate && new Date(s.collectionDate) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(s.collectionDate) > new Date(filters.endDate)) {
        return false;
      }

      // WQI score bracket filters
      if (selectedWqiBrackets && selectedWqiBrackets.length > 0) {
        const score = calculateWQI(s.dissolvedO2, s.ph, s.temperature, s.tds);
        const bracket = getWqiBracket(score);
        if (!selectedWqiBrackets.includes(bracket)) return false;
      }

      // Text search filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesName = s.sampleName.toLowerCase().includes(lowerSearch);
        const matchesOrg = (s.orgamism ?? "").toLowerCase().includes(lowerSearch);
        const matchesLoc = s.geoLocName.toLowerCase().includes(lowerSearch);
        const matchesId = (s.isolateId ?? "").toLowerCase().includes(lowerSearch);
        if (!matchesName && !matchesOrg && !matchesLoc && !matchesId) return false;
      }

      return true;
    });
  }, [sites, filters, selectedWqiBrackets, searchTerm]);

  // 2. Sort filtered sites
  const sortedSites = useMemo(() => {
    const copy = [...filteredSites];
    copy.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortKey) {
        case "sampleName":
          valA = a.sampleName;
          valB = b.sampleName;
          break;
        case "organism":
          valA = a.orgamism ?? "";
          valB = b.orgamism ?? "";
          break;
        case "location":
          valA = parseLocationName(a.geoLocName);
          valB = parseLocationName(b.geoLocName);
          break;
        case "date":
          valA = new Date(a.collectionDate).getTime();
          valB = new Date(b.collectionDate).getTime();
          break;
        case "wqi":
          valA = calculateWQI(a.dissolvedO2, a.ph, a.temperature, a.tds) ?? -1;
          valB = calculateWQI(b.dissolvedO2, b.ph, b.temperature, b.tds) ?? -1;
          break;
        case "risk":
          valA = a.dangerZone ?? "";
          valB = b.dangerZone ?? "";
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredSites, sortKey, sortDir]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedSites.length / itemsPerPage) || 1;
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSites.slice(start, start + itemsPerPage);
  }, [sortedSites, currentPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1); // reset to page 1 on sort change
  };

  const getDangerPillStyle = (zone?: string) => {
    switch (zone?.toLowerCase()) {
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "green":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      {/* Table Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-indigo-950 text-lg">Individual Sample Records</h3>
          <p className="text-xs text-gray-500">Comprehensive list of all generated and imported isolates</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by organism, sample name, site..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/70 select-none">
            <tr>
              <th
                onClick={() => handleSort("sampleName")}
                className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Sample Name
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                onClick={() => handleSort("organism")}
                className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Organism
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                onClick={() => handleSort("location")}
                className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Site / Location
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                onClick={() => handleSort("date")}
                className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Collection Date
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                onClick={() => handleSort("wqi")}
                className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  WQI Score
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                onClick={() => handleSort("risk")}
                className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Risk Status
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">AMR Genes</th>
              <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedSites.map((iso, idx) => {
              const wqi = calculateWQI(iso.dissolvedO2, iso.ph, iso.temperature, iso.tds);
              return (
                <tr key={iso.id ?? `${iso.sampleName}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  {/* Sample Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                    {iso.sampleName}
                  </td>

                  {/* Organism */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 italic font-medium">
                    {iso.orgamism ?? <span className="text-gray-400 not-italic">—</span>}
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {parseLocationName(iso.geoLocName)}
                  </td>

                  {/* Collection Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {new Date(iso.collectionDate).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* WQI */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {wqi !== null ? (
                      <span className="text-sm font-extrabold text-slate-700">{wqi.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">—</span>
                    )}
                  </td>

                  {/* Danger Zone */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-block px-2 py-0.5 border rounded-full text-xs font-bold shadow-sm capitalize ${getDangerPillStyle(
                        iso.dangerZone
                      )}`}
                    >
                      {iso.dangerZone || "unknown"}
                    </span>
                  </td>

                  {/* AMR Genes */}
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono truncate max-w-[150px]" title={iso.amrResGenes}>
                    {iso.amrResGenes || <span className="text-gray-300">—</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <Link
                      href={`/samples?id=${iso.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}

            {sortedSites.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <FilterX className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
                  No sample records match active filters or search terms.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedSites.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 select-none">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, sortedSites.length)}
            </strong>{" "}
            of <strong className="text-slate-800">{sortedSites.length}</strong> records
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((page, index, arr) => {
                const isGap = index > 0 && page - arr[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {isGap && <span className="px-2 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        currentPage === page
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
