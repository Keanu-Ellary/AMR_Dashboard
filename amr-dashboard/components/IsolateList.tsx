"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown, FlaskConical } from "lucide-react";
import type { SiteData } from "@/types/site_types";
import type { DangerZone } from "@/types/map_types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface IsolateListProps {
  isolates: SiteData[];
  locationName: string;
  onSelectIsolate?: (isolate: SiteData) => void;
  compact?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Sorting helpers                                                    */
/* ------------------------------------------------------------------ */
type SortKey = "organism" | "date" | "dangerZone" | "sampleName" | "sir";
type SortDir = "asc" | "desc";

const DANGER_ORDER: Record<string, number> = {
  red: 3,
  yellow: 2,
  green: 1,
  blue: 0,
  grey: -1,
};

const SIR_ORDER: Record<string, number> = {
  R: 3,
  I: 2,
  S: 1,
};

function compareSiteData(a: SiteData, b: SiteData, key: SortKey): number {
  switch (key) {
    case "organism": {
      const aVal = (a.orgamism ?? "").toLowerCase();
      const bVal = (b.orgamism ?? "").toLowerCase();
      return aVal.localeCompare(bVal);
    }
    case "date": {
      const aTime = new Date(a.collectionDate).getTime();
      const bTime = new Date(b.collectionDate).getTime();
      return aTime - bTime;
    }
    case "dangerZone": {
      const aVal = DANGER_ORDER[(a.dangerZone ?? "grey") as string] ?? -1;
      const bVal = DANGER_ORDER[(b.dangerZone ?? "grey") as string] ?? -1;
      return aVal - bVal;
    }
    case "sampleName": {
      return a.sampleName.localeCompare(b.sampleName);
    }
    case "sir": {
      const aVal = SIR_ORDER[a.predictedSir?.charAt(0)?.toUpperCase()] ?? 0;
      const bVal = SIR_ORDER[b.predictedSir?.charAt(0)?.toUpperCase()] ?? 0;
      return aVal - bVal;
    }
    default:
      return 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Small utility components                                           */
/* ------------------------------------------------------------------ */

/** Coloured dot for danger zone */
function DangerDot({ zone }: { zone?: DangerZone | string }) {
  const colours: Record<string, string> = {
    red: "bg-red-500",
    yellow: "bg-yellow-400",
    green: "bg-emerald-500",
    blue: "bg-blue-400",
    grey: "bg-gray-400",
  };
  const label: Record<string, string> = {
    red: "High",
    yellow: "Moderate",
    green: "Low",
    blue: "Unknown",
    grey: "N/A",
  };
  const key = zone ?? "grey";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${colours[key] ?? "bg-gray-400"} ring-2 ring-white shadow-sm`}
      />
      <span className="text-xs text-gray-500">{label[key] ?? "N/A"}</span>
    </span>
  );
}

/** Coloured pill badge for predicted SIR */
function SirBadge({ sir }: { sir?: string }) {
  const first = sir?.charAt(0)?.toUpperCase();
  let classes = "px-2 py-0.5 rounded-full text-xs font-semibold inline-block";

  switch (first) {
    case "R":
      classes += " bg-red-100 text-red-700 ring-1 ring-red-300";
      break;
    case "I":
      classes += " bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300";
      break;
    case "S":
      classes += " bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300";
      break;
    default:
      classes += " bg-gray-100 text-gray-500 ring-1 ring-gray-200";
      break;
  }

  const labels: Record<string, string> = {
    R: "Resistant",
    I: "Intermediate",
    S: "Susceptible",
  };

  return <span className={classes}>{first ? labels[first] ?? sir : "—"}</span>;
}

/** Truncated text with native title tooltip */
function TruncatedText({ text, max = 28 }: { text: string; max?: number }) {
  if (!text) return <span className="text-gray-400 italic">—</span>;
  if (text.length <= max) return <span>{text}</span>;
  return (
    <span title={text} className="cursor-help">
      {text.slice(0, max)}
      <span className="text-gray-400">…</span>
    </span>
  );
}

/** Sort indicator icon in column headers */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="inline h-3.5 w-3.5 text-gray-400 ml-1" />;
  return dir === "asc" ? (
    <ChevronUp className="inline h-3.5 w-3.5 text-blue-600 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 text-blue-600 ml-1" />
  );
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */
function formatDate(d: Date | string | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ================================================================== */
/*  IsolateList component                                              */
/* ================================================================== */
export default function IsolateList({
  isolates,
  locationName,
  onSelectIsolate,
  compact = false,
}: IsolateListProps) {
  /* ---- sorting state ---- */
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...isolates];
    copy.sort((a, b) => {
      const cmp = compareSiteData(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [isolates, sortKey, sortDir]);

  /* ---- empty state ---- */
  if (isolates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FlaskConical className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">No isolates found at this location</p>
        <p className="text-xs mt-1">Try adjusting your filters or selecting a different site.</p>
      </div>
    );
  }

  /* ================================================================ */
  /*  Compact mode                                                     */
  /* ================================================================ */
  if (compact) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
          {isolates.length} isolate{isolates.length !== 1 && "s"}
        </p>

        {sorted.map((iso, idx) => {
          const href = `/statistics?site=${iso.id ?? idx}`;
          return (
            <Link
              key={iso.id ?? `${iso.sampleName}-${idx}`}
              href={href}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm
                         hover:bg-blue-50 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                  {iso.orgamism ?? <span className="italic text-gray-400">Unknown organism</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(iso.collectionDate)}</p>
              </div>
              <DangerDot zone={iso.dangerZone} />
            </Link>
          );
        })}
      </div>
    );
  }

  /* ================================================================ */
  /*  Full mode                                                        */
  /* ================================================================ */
  const thBase =
    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none";
  const thSortable = `${thBase} cursor-pointer hover:text-blue-600 transition-colors`;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-500" />
          Isolates at{" "}
          <span className="text-blue-600">{locationName}</span>
        </h3>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
          {isolates.length}
        </span>
      </div>

      {/* Table wrapper */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ---- Head ---- */}
          <thead className="bg-gray-50">
            <tr>
              <th className={thSortable} onClick={() => toggleSort("organism")}>
                Organism
                <SortIcon active={sortKey === "organism"} dir={sortDir} />
              </th>
              <th className={thBase}>Isolate&nbsp;ID</th>
              <th className={thSortable} onClick={() => toggleSort("sampleName")}>
                Sample Name
                <SortIcon active={sortKey === "sampleName"} dir={sortDir} />
              </th>
              <th className={thSortable} onClick={() => toggleSort("date")}>
                Collection Date
                <SortIcon active={sortKey === "date"} dir={sortDir} />
              </th>
              <th className={thBase}>AMR Genes</th>
              <th className={thSortable} onClick={() => toggleSort("sir")}>
                Predicted SIR
                <SortIcon active={sortKey === "sir"} dir={sortDir} />
              </th>
              <th className={thSortable} onClick={() => toggleSort("dangerZone")}>
                Danger Zone
                <SortIcon active={sortKey === "dangerZone"} dir={sortDir} />
              </th>
            </tr>
          </thead>

          {/* ---- Body ---- */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((iso, idx) => (
              <tr
                key={iso.id ?? `${iso.sampleName}-${idx}`}
                onClick={() => onSelectIsolate?.(iso)}
                className={`transition-colors ${
                  onSelectIsolate ? "cursor-pointer hover:bg-blue-50" : ""
                }`}
              >
                {/* Organism */}
                <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                  {iso.orgamism ?? <span className="italic text-gray-400">Unknown</span>}
                </td>

                {/* Isolate ID */}
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap font-mono">
                  {iso.isolateId ?? <span className="text-gray-300">-</span>}
                </td>

                {/* Sample Name */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <TruncatedText text={iso.sampleName} max={24} />
                </td>

                {/* Collection Date */}
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(iso.collectionDate)}
                </td>

                {/* AMR Genes */}
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                  <TruncatedText text={iso.amrResGenes} max={32} />
                </td>

                {/* Predicted SIR */}
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <SirBadge sir={iso.predictedSir} />
                </td>

                {/* Danger Zone */}
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <DangerDot zone={iso.dangerZone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
