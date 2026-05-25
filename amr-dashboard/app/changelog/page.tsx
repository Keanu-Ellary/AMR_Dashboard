"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, Undo2, ChevronDown, ChevronUp, Clock, User, Filter, ChevronLeft, ChevronRight, AlertCircle, FileText } from "lucide-react";
import { toast } from "react-toastify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminInfo {
  id?: number;
  name?: string;
  email?: string;
}

interface ChangeLogEntry {
  id: number;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "BULK_CREATE"
    | "BULK_DELETE"
    | "UNDO_CREATE"
    | "UNDO_UPDATE"
    | "UNDO_DELETE"
    | "UNDO_BULK_CREATE"
    | "UNDO_BULK_DELETE";
  entityType?: string;
  entityId: number;
  previousData: string | null;
  newData: string | null;
  undone: boolean;
  createdAt: string;
  admin?: AdminInfo;
}

interface ChangeLogResponse {
  data: ChangeLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

function relativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  if (diffWeek < 5) return `${diffWeek} week${diffWeek !== 1 ? "s" : ""} ago`;
  return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
}

function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function safeParse(json: string | null): Record<string, unknown> | Record<string, unknown>[] | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Record<string, unknown> | Record<string, unknown>[] | null;
  } catch {
    return null;
  }
}

function getBulkCount(entry: ChangeLogEntry): number {
  if (entry.action === "BULK_DELETE" || entry.action === "UNDO_BULK_CREATE") {
    const list = safeParse(entry.previousData);
    return Array.isArray(list) ? list.length : 0;
  }
  if (entry.action === "BULK_CREATE" || entry.action === "UNDO_BULK_DELETE") {
    const list = safeParse(entry.newData);
    return Array.isArray(list) ? list.length : 0;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Action styling map
// ---------------------------------------------------------------------------

const ACTION_STYLES: Record<string, { dot: string; badge: string; badgeText: string; line: string }> = {
  CREATE: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    badgeText: "CREATE",
    line: "border-green-300",
  },
  UPDATE: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    badgeText: "UPDATE",
    line: "border-blue-300",
  },
  DELETE: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    badgeText: "DELETE",
    line: "border-red-300",
  },
  BULK_CREATE: {
    dot: "bg-green-600 animate-pulse border border-green-300 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    badge: "bg-green-100 text-green-800 font-bold border border-green-200 shadow-sm",
    badgeText: "BULK CREATE",
    line: "border-green-400 border-dashed",
  },
  BULK_DELETE: {
    dot: "bg-red-600 animate-pulse border border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    badge: "bg-red-100 text-red-800 font-bold border border-red-200 shadow-sm",
    badgeText: "BULK DELETE",
    line: "border-red-400 border-dashed",
  },
  UNDO_CREATE: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 font-semibold border border-purple-200",
    badgeText: "UNDO CREATE",
    line: "border-purple-300",
  },
  UNDO_UPDATE: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 font-semibold border border-purple-200",
    badgeText: "UNDO UPDATE",
    line: "border-purple-300",
  },
  UNDO_DELETE: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 font-semibold border border-purple-200",
    badgeText: "UNDO DELETE",
    line: "border-purple-300",
  },
  UNDO_BULK_CREATE: {
    dot: "bg-purple-600 animate-pulse border border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    badge: "bg-purple-100 text-purple-800 font-bold border border-purple-200 shadow-sm",
    badgeText: "UNDO BULK CREATE",
    line: "border-purple-400 border-dashed",
  },
  UNDO_BULK_DELETE: {
    dot: "bg-purple-600 animate-pulse border border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    badge: "bg-purple-100 text-purple-800 font-bold border border-purple-200 shadow-sm",
    badgeText: "UNDO BULK DELETE",
    line: "border-purple-400 border-dashed",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DiffView({ entry }: { entry: ChangeLogEntry }) {
  const prevParsed = safeParse(entry.previousData);
  const nextParsed = safeParse(entry.newData);

  const isBulk = ["BULK_CREATE", "BULK_DELETE", "UNDO_BULK_CREATE", "UNDO_BULK_DELETE"].includes(entry.action);
  if (isBulk) {
    const list = (Array.isArray(prevParsed) ? prevParsed : Array.isArray(nextParsed) ? nextParsed : null) as Record<string, unknown>[] | null;
    if (list && list.length > 0) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {entry.action.includes("DELETE") ? "Deleted Water Samples" : "Created Water Samples"} ({list.length} records)
          </h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-96 shadow-inner">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Sample Name</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Organism</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Location</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Date Collected</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">AMR Genes</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 text-center">SIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item, idx) => {
                  const sampleName = String(item.sampleName || "—");
                  const organism = String(item.organism || item.orgamism || "—");
                  const geoLocName = String(item.geoLocName || "—");
                  const collectionDate = item.collectionDate ? new Date(String(item.collectionDate)).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";
                  const amrResGenes = String(item.amrResGenes || "—");
                  const predictedSir = String(item.predictedSir || "—");
                  const dangerZone = String(item.dangerZone || "green");

                  // Danger zone color helper
                  const badgeColors: Record<string, string> = {
                    red: "bg-red-50 text-red-700 border-red-200",
                    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
                    green: "bg-green-50 text-green-700 border-green-200",
                  };

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                      <td className="px-4 py-2 font-medium text-gray-900">{sampleName}</td>
                      <td className="px-4 py-2 text-gray-600 italic">{organism}</td>
                      <td className="px-4 py-2 text-gray-600">{geoLocName}</td>
                      <td className="px-4 py-2 text-gray-600">{collectionDate}</td>
                      <td className="px-4 py-2 text-gray-600 font-mono text-xs">{amrResGenes}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeColors[dangerZone] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {predictedSir}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }

  const prev = prevParsed as Record<string, unknown> | null;
  const next = nextParsed as Record<string, unknown> | null;

  if (entry.action === "CREATE" && next) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">New Data</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 font-medium text-gray-600 w-1/3">Field</th>
                <th className="px-4 py-2 font-medium text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(next).map(([key, value], idx) => (
                <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{key}</td>
                  <td className="px-4 py-2 text-gray-800">{String(value ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (entry.action === "DELETE" && prev) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Deleted Data</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 font-medium text-gray-600 w-1/3">Field</th>
                <th className="px-4 py-2 font-medium text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prev).map(([key, value], idx) => (
                <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{key}</td>
                  <td className="px-4 py-2 text-gray-800">{String(value ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // UPDATE – side-by-side
  if (entry.action === "UPDATE") {
    const allKeys = Array.from(new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})]));

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Changes</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 font-medium text-gray-600 w-1/4">Field</th>
                <th className="px-4 py-2 font-medium text-gray-600 w-[37.5%]">Previous</th>
                <th className="px-4 py-2 font-medium text-gray-600 w-[37.5%]">New</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key, idx) => {
                const prevVal = prev ? (prev as Record<string, unknown>)[key] : undefined;
                const nextVal = next ? (next as Record<string, unknown>)[key] : undefined;
                const changed = JSON.stringify(prevVal) !== JSON.stringify(nextVal);
                const baseBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/60";
                const rowBg = changed ? "bg-yellow-50" : baseBg;

                return (
                  <tr key={key} className={rowBg}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{key}</td>
                    <td className="px-4 py-2 text-gray-800">{String(prevVal ?? "—")}</td>
                    <td className="px-4 py-2 text-gray-800">{String(nextVal ?? "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <p className="mt-4 text-sm text-gray-500 italic">No data available for this entry.</p>;
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ChangeLogPage() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [undoingIds, setUndoingIds] = useState<Set<number>>(new Set());

  // Fetch changelog data
  const fetchChangelog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = getToken();
    const params = new URLSearchParams();
    if (actionFilter !== "All") params.set("action", actionFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/changelog?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch changelog (${res.status})`);
      }

      const json: ChangeLogResponse = await res.json();
      setEntries(json.data);
      setTotal(json.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page, limit]);

  useEffect(() => {
    fetchChangelog();
  }, [fetchChangelog]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  // Toggle expand / collapse
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  // Undo handler
  const handleUndo = async (entryId: number) => {
    const token = getToken();
    setUndoingIds((prev) => new Set(prev).add(entryId));

    try {
      const res = await fetch("/api/changelog/undo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ changeLogId: entryId }),
      });

      if (!res.ok) {
        throw new Error(`Undo failed (${res.status})`);
      }

      toast.success("Change successfully undone!");
      await fetchChangelog();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to undo change";
      toast.error(message);
    } finally {
      setUndoingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(entryId);
        return copy;
      });
    }
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Change Log</h1>
        </div>
        <p className="text-gray-500 ml-14">Track and undo data modifications</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Action Type</span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
        >
          <option value="All">All</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="BULK_CREATE">BULK CREATE</option>
          <option value="BULK_DELETE">BULK DELETE</option>
        </select>

        <div className="ml-auto text-xs text-gray-400">
          {total} total change{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm">Loading changelog…</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-red-500">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchChangelog}
            className="mt-4 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500 mb-1">No changes recorded yet</p>
          <p className="text-sm text-gray-400">When data is created, updated, or deleted, changes will appear here.</p>
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && entries.length > 0 && (
        <div className="relative">
          {entries.map((entry, idx) => {
            const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.UPDATE;
            const isExpanded = expandedIds.has(entry.id);
            const isUndoing = undoingIds.has(entry.id);
            const isLast = idx === entries.length - 1;

            return (
              <div key={entry.id} className="relative flex items-start">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center mr-0">
                  {/* Dot */}
                  <div className={`w-3.5 h-3.5 rounded-full ${style.dot} ring-4 ring-white z-10 shrink-0 mt-5`} />
                  {/* Vertical line */}
                  {!isLast && (
                    <div className={`w-0 flex-1 border-l-2 ${style.line}`} />
                  )}
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 ml-6 mb-4 flex-1 transition-shadow hover:shadow-md">
                  {/* Card header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Action badge */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
                        {style.badgeText}
                      </span>

                      {/* Entity info */}
                      <span className="text-sm font-medium text-gray-800">
                        {entry.action === "BULK_DELETE" || entry.action === "UNDO_BULK_DELETE" ? (
                          `Bulk Deletion (${getBulkCount(entry)} records)`
                        ) : entry.action === "BULK_CREATE" || entry.action === "UNDO_BULK_CREATE" ? (
                          `Bulk Creation (${getBulkCount(entry)} records)`
                        ) : (
                          `SiteData #${entry.entityId}`
                        )}
                      </span>

                      {/* Undone badge */}
                      {entry.undone && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Undone
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Undo button */}
                      <button
                        onClick={() => handleUndo(entry.id)}
                        disabled={entry.undone || isUndoing}
                        className={`flex items-center gap-1 border rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          entry.undone
                            ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                            : "border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                        }`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        {isUndoing ? "Undoing…" : "Undo"}
                      </button>

                      {/* Expand / Collapse */}
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span className="hidden sm:inline">Collapse</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1" title={formatAbsoluteDate(entry.createdAt)}>
                      <Clock className="w-3.5 h-3.5" />
                      {relativeTime(entry.createdAt)}
                    </span>
                    {entry.admin?.name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {entry.admin.name}
                      </span>
                    )}
                  </div>

                  {/* Expandable diff */}
                  {isExpanded && <DiffView entry={entry} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          {/* Previous */}
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              page <= 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                  p === page
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              page >= totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
