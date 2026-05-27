"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface OverviewChartsProps {
  wqiDistribution: { bracket: string; count: number }[];
  zoneBreakdown: { red: number; yellow: number; green: number };
}

const BAR_COLORS: Record<string, string> = {
  "0-25": "#ef4444",
  "26-50": "#f97316",
  "51-75": "#eab308",
  "76-100": "#22c55e",
};

const ZONE_COLORS = ["#ef4444", "#eab308", "#22c55e"];

const renderPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

import { useDashboard } from "./DashboardContext";
import type { ContaminationLevel } from "@/types/map_types";

export default function OverviewCharts({
  wqiDistribution,
  zoneBreakdown,
}: OverviewChartsProps) {
  const {
    filters,
    selectedWqiBrackets,
    toggleContaminationLevel,
    toggleWqiBracket,
  } = useDashboard();

  const wqiData = wqiDistribution.map(d => ({
    name: d.bracket,
    value: d.count,
    color: BAR_COLORS[d.bracket] || "#6366f1"
  }));

  const zoneData = [
    { name: "High Risk", value: zoneBreakdown.red, level: "high" as ContaminationLevel, color: ZONE_COLORS[0] },
    { name: "Moderate", value: zoneBreakdown.yellow, level: "moderate" as ContaminationLevel, color: ZONE_COLORS[1] },
    { name: "Low", value: zoneBreakdown.green, level: "low" as ContaminationLevel, color: ZONE_COLORS[2] },
  ];

  const activeContaminationLevels = filters.contaminationLevels ?? [];
  const isAnyZoneSelected = activeContaminationLevels.length > 0 && activeContaminationLevels.length < 5;

  const isAnyWqiSelected = selectedWqiBrackets.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* WQI Distribution Pie Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-indigo-900 font-bold text-lg">
              WQI Distribution
            </h3>
            <p className="text-[11px] text-gray-600 mt-1 mb-4">
              Sites grouped by WQI score bracket
            </p>
          </div>
          {isAnyWqiSelected && (
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Filtered ({selectedWqiBrackets.length})
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={wqiData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={renderPieLabel}
              labelLine={false}
              strokeWidth={2}
              stroke="#fff"
            >
              {wqiData.map((entry, index) => {
                const isSelected = selectedWqiBrackets.includes(entry.name);
                const opacity = !isAnyWqiSelected || isSelected ? 1.0 : 0.35;
                return (
                  <Cell
                    key={`wqi-pie-cell-${index}`}
                    fill={entry.color}
                    style={{ cursor: "pointer" }}
                    fillOpacity={opacity}
                    onClick={(e) => toggleWqiBracket(entry.name, e.ctrlKey || e.metaKey)}
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Danger Zone Donut Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-indigo-900 font-bold text-lg">
              Risk Zone Distribution
            </h3>
            <p className="text-[11px] text-gray-600 mt-1 mb-4">
              Sites by contamination risk level
            </p>
          </div>
          {isAnyZoneSelected && (
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
              Filtered ({activeContaminationLevels.length})
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={zoneData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={renderPieLabel}
              labelLine={false}
              strokeWidth={2}
              stroke="#fff"
            >
              {zoneData.map((entry, index) => {
                const isSelected = activeContaminationLevels.includes(entry.level);
                const opacity = !isAnyZoneSelected || isSelected ? 1.0 : 0.35;
                return (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={entry.color}
                    style={{ cursor: "pointer" }}
                    fillOpacity={opacity}
                    onClick={(e) => toggleContaminationLevel(entry.level, e.ctrlKey || e.metaKey)}
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
