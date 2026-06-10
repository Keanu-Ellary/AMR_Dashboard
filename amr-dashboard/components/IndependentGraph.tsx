"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Trash2 } from "lucide-react";
import { useStatistics, GraphConfig } from "@/components/StatisticsContext";
import { SITE_COLORS, METRIC_OPTIONS } from "@/constants/statistics_constants";

interface IndependentGraphProps {
  config: GraphConfig;
  isActive: boolean;
}

interface TimeSeriesPoint {
  date: string;
  [key: string]: number | string;
}

interface ComparisonResponse {
  timeSeries: Record<string, TimeSeriesPoint[]>;
  correlations: Record<string, Record<string, number>>;
}

export default function IndependentGraph({ config, isActive }: IndependentGraphProps) {
  const { setActiveGraph, removeGraph } = useStatistics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesRaw, setTimeSeriesRaw] = useState<Record<string, TimeSeriesPoint[]>>({});
  const [correlations, setCorrelations] = useState<Record<string, Record<string, number>>>({});
  const [activeCorrSite, setActiveCorrSite] = useState<string>("");

  useEffect(() => {
    if (config.selectedSites.length === 0 || config.selectedMetrics.length === 0) {
      setTimeSeriesRaw({});
      setCorrelations({});
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sitesParam = encodeURIComponent(config.selectedSites.join(","));
        const metricsParam = encodeURIComponent(config.selectedMetrics.join(","));
        const url = `/api/statistics/comparison?sites=${sitesParam}&dateRange=${config.dateRange}&metrics=${metricsParam}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load graph data");
        const json: ComparisonResponse = await res.json();

        setTimeSeriesRaw(json.timeSeries || {});
        setCorrelations(json.correlations || {});

        if (!config.selectedSites.includes(activeCorrSite)) {
          setActiveCorrSite(config.selectedSites[0] || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [config.selectedSites, config.selectedMetrics, config.dateRange, activeCorrSite]);

  const chartData = useMemo(() => {
    const datesSet = new Set<string>();
    Object.values(timeSeriesRaw).forEach((series: TimeSeriesPoint[]) => {
      if (Array.isArray(series)) {
        series.forEach((pt) => {
          if (pt.date) datesSet.add(pt.date);
        });
      }
    });

    const sortedDates = Array.from(datesSet).sort();

    return sortedDates.map((dateStr) => {
      const row: Record<string, number | string> = { date: dateStr };
      config.selectedSites.forEach((site) => {
        const siteSeries = timeSeriesRaw[site] || [];
        const pt = siteSeries.find((p: TimeSeriesPoint) => p.date === dateStr);
        if (pt) {
          config.selectedMetrics.forEach((m) => {
            if (pt[m] !== undefined) {
              row[`${site}_${m}`] = pt[m];
            }
          });
        }
      });
      return row;
    });
  }, [timeSeriesRaw, config.selectedSites, config.selectedMetrics]);

  const hasHighRange = config.selectedMetrics.some((m) => m === "tds" || m === "ec");
  const hasLowRange = config.selectedMetrics.some((m) => m !== "tds" && m !== "ec");
  const isDualAxis = hasHighRange && hasLowRange;

  const CustomChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; stroke?: string; value: number }[]; label?: string }) => {
    if (!active || !payload || !payload.length || !label) return null;
    const siteDataMap: Record<string, { metricName: string; value: number; unit: string; color: string }[]> = {};
    payload.forEach((item) => {
      const dataKey = item.dataKey;
      const separatorIdx = dataKey.lastIndexOf("_");
      if (separatorIdx === -1) return;
      const site = dataKey.substring(0, separatorIdx);
      const metricKey = dataKey.substring(separatorIdx + 1);
      const metricConfig = METRIC_OPTIONS.find((m) => m.key === metricKey);
      if (!metricConfig) return;
      if (!siteDataMap[site]) siteDataMap[site] = [];
      siteDataMap[site].push({
        metricName: metricConfig.name,
        value: item.value,
        unit: metricConfig.unit,
        color: item.stroke || metricConfig.color,
      });
    });

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl p-4 max-w-sm max-h-[400px] overflow-y-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {new Date(label).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <div className="space-y-3">
          {Object.entries(siteDataMap).map(([siteName, metrics]) => {
            const siteColor = SITE_COLORS[config.selectedSites.indexOf(siteName) % SITE_COLORS.length];
            return (
              <div key={siteName} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                <p className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: siteColor }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: siteColor }} />
                  {siteName}
                </p>
                <div className="mt-1 space-y-1 pl-4">
                  {metrics.map((m) => (
                    <div key={m.metricName} className="flex justify-between items-center text-xs text-gray-600">
                      <span>{m.metricName}:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {m.value}<span className="text-[10px] text-gray-400 font-normal ml-0.5">{m.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={() => setActiveGraph(config.id)}
      className={`relative bg-white rounded-3xl border transition-all cursor-pointer ${
        isActive 
          ? "border-slate-900 ring-4 ring-slate-900/5 shadow-2xl" 
          : "border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
    >
      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-black text-slate-900">
              {config.selectedSites.length > 0 ? config.selectedSites.join(" vs ") : "Unconfigured Graph"}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {config.selectedMetrics.length} metrics • {config.dateRange}
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); removeGraph(config.id); }}
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="xl:col-span-2 min-h-[400px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Loading data...</div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-rose-500 text-sm font-medium">{error}</div>
            ) : config.selectedSites.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">No sites selected. Use the filter panel.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} orientation="left" />
                  {isDualAxis && <YAxis yAxisId="right" tick={{ fontSize: 10 }} orientation="right" />}
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  {config.selectedSites.map((site, sIdx) => (
                    config.selectedMetrics.map((mKey) => {
                      const metricConfig = METRIC_OPTIONS.find((m) => m.key === mKey);
                      if (!metricConfig) return null;
                      const siteColor = SITE_COLORS[sIdx % SITE_COLORS.length];
                      return (
                        <Line
                          key={`${site}_${mKey}`}
                          yAxisId={mKey === "tds" || mKey === "ec" ? "right" : "left"}
                          type="monotone"
                          dataKey={`${site}_${mKey}`}
                          name={`${site} - ${metricConfig.name}`}
                          stroke={siteColor}
                          strokeWidth={2}
                          strokeDasharray={metricConfig.dashStyle}
                          dot={false}
                          connectNulls
                        />
                      );
                    })
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Correlation Matrix */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            <div>
              <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Pearson Correlations</h4>
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Metric relationship mapping</p>
            </div>
            
            {config.selectedSites.length > 1 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {config.selectedSites.map((site) => (
                  <button
                    key={site}
                    onClick={(e) => { e.stopPropagation(); setActiveCorrSite(site); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${
                      activeCorrSite === site 
                        ? "bg-white border-slate-900 text-slate-900 shadow-sm" 
                        : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}

            {activeCorrSite && correlations[activeCorrSite] ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/30">
                <table className="w-full text-[10px] text-center border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-left pl-4">Metric</th>
                      {config.selectedMetrics.map((mKey) => (
                        <th key={mKey} className="px-2 py-2.5 font-black text-slate-500 uppercase tracking-tighter">
                          {mKey.substring(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {config.selectedMetrics.map((rowMetric) => (
                      <tr key={rowMetric} className="hover:bg-white transition-colors">
                        <td className="px-3 py-2.5 font-black text-slate-500 text-left pl-4 uppercase tracking-tighter bg-white/50">
                          {rowMetric.substring(0, 3)}
                        </td>
                        {config.selectedMetrics.map((colMetric) => {
                          let r = 1.0;
                          if (rowMetric !== colMetric) {
                            const key1 = `${rowMetric}_vs_${colMetric}`;
                            const key2 = `${colMetric}_vs_${rowMetric}`;
                            r = correlations[activeCorrSite][key1] !== undefined
                              ? correlations[activeCorrSite][key1]
                              : correlations[activeCorrSite][key2] !== undefined
                              ? correlations[activeCorrSite][key2]
                              : 0;
                          }
                          
                          let bg = "bg-white";
                          let text = "text-slate-300";
                          if (rowMetric !== colMetric) {
                            if (r > 0.6) { bg = "bg-emerald-50"; text = "text-emerald-700"; }
                            else if (r > 0.2) { bg = "bg-emerald-50/50"; text = "text-emerald-600"; }
                            else if (r < -0.6) { bg = "bg-rose-50"; text = "text-rose-700"; }
                            else if (r < -0.2) { bg = "bg-rose-50/50"; text = "text-rose-600"; }
                            else { text = "text-slate-500"; }
                          }

                          return (
                            <td key={colMetric} className="p-0.5">
                              <div className={`py-2 rounded-lg font-mono font-bold ${bg} ${text} border border-transparent`}>
                                {rowMetric === colMetric ? "—" : r.toFixed(2)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center min-h-[150px] border border-dashed border-slate-200">
                Configure graph to view correlations
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
