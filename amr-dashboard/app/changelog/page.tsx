"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Undo2, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
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

function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const ACTION_STYLES: Record<string, { badge: string; badgeText: string }> = {
  CREATE: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    badgeText: "CREATE",
  },
  UPDATE: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    badgeText: "UPDATE",
  },
  DELETE: {
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    badgeText: "DELETE",
  },
  BULK_CREATE: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold",
    badgeText: "BULK CREATE",
  },
  BULK_DELETE: {
    badge: "bg-rose-50 text-rose-700 border-rose-100 font-bold",
    badgeText: "BULK DELETE",
  },
  UNDO_CREATE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    badgeText: "UNDO CREATE",
  },
  UNDO_UPDATE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    badgeText: "UNDO UPDATE",
  },
  UNDO_DELETE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    badgeText: "UNDO DELETE",
  },
  UNDO_BULK_CREATE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200 font-bold",
    badgeText: "UNDO BULK CREATE",
  },
  UNDO_BULK_DELETE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200 font-bold",
    badgeText: "UNDO BULK DELETE",
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
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {entry.action.includes("DELETE") ? "Deleted Water Samples" : "Created Water Samples"} ({list.length} records)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50/70 text-left">
                <tr>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase">Sample Name</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase">Organism</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase">Date Collected</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase">AMR Genes</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase text-center">SIR</th>
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

                  const badgeColors: Record<string, string> = {
                    red: "bg-slate-50 text-indigo-950 border-slate-200",
                    yellow: "bg-slate-50 text-indigo-950 border-slate-200",
                    green: "bg-slate-50 text-indigo-950 border-slate-200",
                  };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-black text-indigo-950">{sampleName}</td>
                      <td className="px-4 py-2 text-slate-600 italic">{organism}</td>
                      <td className="px-4 py-2 text-slate-600">{geoLocName}</td>
                      <td className="px-4 py-2 text-slate-600">{collectionDate}</td>
                      <td className="px-4 py-2 text-slate-600 font-mono">{amrResGenes}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[9px] font-black uppercase ${badgeColors[dangerZone] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
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
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">New Data</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50/70 text-left">
              <tr>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase w-1/3">Field</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(next).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-mono text-slate-400">{key}</td>
                  <td className="px-4 py-2 text-indigo-950 font-bold">{String(value ?? "—")}</td>
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
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deleted Data</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50/70 text-left">
              <tr>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase w-1/3">Field</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(prev).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-mono text-slate-400">{key}</td>
                  <td className="px-4 py-2 text-indigo-950 font-bold">{String(value ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (entry.action === "UPDATE") {
    const allKeys = Array.from(new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})]));

    return (
      <div className="mt-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Changes</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50/70 text-left">
              <tr>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase w-1/4">Field</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase w-[37.5%]">Previous</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase w-[37.5%]">New</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allKeys.map((key) => {
                const prevVal = prev ? (prev as Record<string, unknown>)[key] : undefined;
                const nextVal = next ? (next as Record<string, unknown>)[key] : undefined;
                const changed = JSON.stringify(prevVal) !== JSON.stringify(nextVal);

                return (
                  <tr key={key} className={changed ? "bg-amber-50/30 hover:bg-amber-50/50" : "hover:bg-slate-50/50"}>
                    <td className="px-4 py-2 font-mono text-slate-400">{key}</td>
                    <td className="px-4 py-2 text-slate-600">{String(prevVal ?? "—")}</td>
                    <td className="px-4 py-2 text-indigo-950 font-bold">{String(nextVal ?? "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <p className="mt-4 text-[11px] text-slate-400 italic">No data available for this entry.</p>;
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

  useEffect(() => {
    setPage(1);
  }, [actionFilter]);

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

  return (
    <main className="h-screen flex flex-col bg-slate-50/50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Change Log</h1>
            <p className="text-sm text-slate-500 font-medium">Track and undo data modifications</p>
          </div>
          <button
            onClick={fetchChangelog}
            disabled={loading}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Type</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="BULK_CREATE">BULK CREATE</option>
              <option value="BULK_DELETE">BULK DELETE</option>
            </select>
          </div>
          <div className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {total} total records
          </div>
        </div>

        {loading && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No changes recorded yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => {
              const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.UPDATE;
              const isExpanded = expandedIds.has(entry.id);
              const isUndoing = undoingIds.has(entry.id);

              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-950">
                            {entry.action.includes("BULK") ? (
                              `${entry.action.replace("_", " ")} (${getBulkCount(entry)} records)`
                            ) : (
                              `SiteData #${entry.entityId}`
                            )}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${style.badge}`}>
                            {style.badgeText}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400">{formatAbsoluteDate(entry.createdAt)}</span>
                          {entry.admin?.name && (
                            <span className="text-[10px] font-bold text-indigo-600/70 uppercase">By {entry.admin.name}</span>
                          )}
                          {entry.undone && (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter bg-rose-50 px-1 rounded">Undone</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUndo(entry.id)}
                        disabled={entry.undone || isUndoing}
                        className={`p-1.5 rounded-lg transition-all ${
                          entry.undone
                            ? "text-slate-200 cursor-not-allowed"
                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title="Undo Change"
                      >
                        <Undo2 className={`h-4 w-4 ${isUndoing ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && <DiffView entry={entry} />}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8 pb-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[32px] h-8 rounded-xl text-[10px] font-black transition-all ${
                      p === page
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
