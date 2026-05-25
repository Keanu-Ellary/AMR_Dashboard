"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { useStatistics } from "@/components/StatisticsContext";
import { METRIC_OPTIONS } from "@/constants/statistics_constants";

export default function StatisticsFilterPanel() {
  const { graphs, activeGraphId, updateGraph } = useStatistics();
  const [allSiteNames, setAllSiteNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const activeGraph = useMemo(
    () => graphs.find((g) => g.id === activeGraphId),
    [graphs, activeGraphId]
  );

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/site");
        if (res.ok) {
          const json = await res.json();
          const names = Array.from(
            new Set((json.sites || []).map((s: { geoLocName: string }) => s.geoLocName).filter(Boolean))
          ) as string[];
          setAllSiteNames(names.sort((a, b) => a.localeCompare(b)));
        }
      } catch (err) {
        console.error("Failed to fetch sites:", err);
      }
    };
    fetchSites();
  }, []);

  const filteredSiteNames = useMemo(() => {
    return allSiteNames.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSiteNames, searchQuery]);

  const handleToggleSite = (site: string) => {
    if (!activeGraph) return;
    const current = activeGraph.selectedSites;
    const next = current.includes(site)
      ? current.filter((s) => s !== site)
      : [...current, site];
    updateGraph(activeGraph.id, { selectedSites: next });
  };

  const handleToggleMetric = (metricKey: string) => {
    if (!activeGraph) return;
    const current = activeGraph.selectedMetrics;
    const next = current.includes(metricKey)
      ? current.filter((m) => m !== metricKey)
      : [...current, metricKey];
    updateGraph(activeGraph.id, { selectedMetrics: next });
  };

  return (
    <aside className="w-[340px] bg-white border-l border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto flex-shrink-0">
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Configuration</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refine active visualization</p>
      </div>

      {!activeGraph ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
            Select a visualization <br/> to modify its parameters
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Temporal Scope */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Scope</span>
            <select
              value={activeGraph.dateRange}
              onChange={(e) => updateGraph(activeGraph.id, { dateRange: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
            >
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
              <option value="90days">Past 90 Days</option>
              <option value="1year">Past Year</option>
              <option value="all">All-time Data</option>
            </select>
          </div>

          {/* Parameters */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Measured Metrics</span>
            <div className="grid grid-cols-1 gap-1.5">
              {METRIC_OPTIONS.map((m) => {
                const isSelected = activeGraph.selectedMetrics.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => handleToggleMetric(m.key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-white border-slate-900 text-slate-900 shadow-sm"
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Site Selector */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Research Locations</span>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredSiteNames.map((site) => {
                const isSelected = activeGraph.selectedSites.includes(site);
                return (
                  <button
                    key={site}
                    onClick={() => handleToggleSite(site)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-slate-50 text-slate-900 font-bold"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs truncate">{site}</span>
                    {isSelected && <Check className="h-3 w-3 text-slate-900 stroke-[3px]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
