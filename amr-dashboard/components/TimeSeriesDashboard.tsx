"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

interface TimeSeriesDashboardProps {
  siteId: number;
}

interface TimeSeriesData {
  date: string;
  avgWQI: number;
  avgTemp: number;
  avgDO: number;
  avgPH?: number;
  amrGeneCount: number;
  phRange?: [number, number];
  movingAvgPH?: number;
}

export default function TimeSeriesDashboard({ siteId }: TimeSeriesDashboardProps) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30days");

  useEffect(() => {
    const fetchTimeSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/statistics/timeSeriesData?siteId=${siteId}&dateRange=${dateRange}`);
        if (!response.ok) throw new Error("Failed to fetch time series data");
        const result = await response.json();
        const rawData = result.results || [];

        const processedData = rawData.map((d: any) => {
          const ph = d.avgPH || 7.0;
          d.avgPH = Number(ph.toFixed(2));
          d.phRange = [ph - 0.5, ph + 0.5];
          return d;
        });

        setData(processedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (siteId) fetchTimeSeries();
  }, [siteId, dateRange]);

  if (loading) return <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">Synchronizing Time-Series Data...</div>;
  if (error) return <div className="p-12 text-center text-risk-high text-sm font-bold uppercase tracking-widest">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-8 w-full bg-white border border-border p-8 rounded-2xl shadow-subtle">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Temporal & Spatial Analysis</h2>
           <p className="text-xs text-gray-400 font-medium mt-1">Multi-parameter correlation over time</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all bg-gray-50"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="1year">Last Year</option>
        </select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="AMR Load vs. Water Quality" desc="Correlation between WQI and detected resistance genes">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar yAxisId="right" dataKey="amrGeneCount" name="AMR Genes" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Line yAxisId="left" type="monotone" dataKey="avgWQI" name="WQI" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="O₂ Saturation vs. Temperature" desc="Dissolved Oxygen (mg/L) and Water Temperature (°C)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="avgDO" name="DO" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgTemp" name="Temp" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

function ChartContainer({ title, desc, children }: any) {
  return (
    <div className="bg-gray-50/50 rounded-xl p-6 border border-border/50">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-[10px] text-gray-400 font-medium mb-6">{desc}</p>
      <div className="h-[280px]">
        {children}
      </div>
    </div>
  );
}
