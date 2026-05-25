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

const CustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#374151"
      textAnchor="middle"
      fontSize={13}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

const renderDonutLabel = (props: any) => {
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
      fontSize={13}
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

  const zoneData = [
    { name: "High Risk", value: zoneBreakdown.red, level: "high" as ContaminationLevel, color: ZONE_COLORS[0] },
    { name: "Moderate", value: zoneBreakdown.yellow, level: "moderate" as ContaminationLevel, color: ZONE_COLORS[1] },
    { name: "Low", value: zoneBreakdown.green, level: "low" as ContaminationLevel, color: ZONE_COLORS[2] },
  ];

  const activeContaminationLevels = filters.contaminationLevels ?? [];
  const isAnyZoneSelected = activeContaminationLevels.length > 0;

  const isAnyWqiSelected = selectedWqiBrackets.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* WQI Distribution Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-indigo-900 font-bold text-lg">
              Water Quality Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Sites grouped by WQI score bracket (Click to filter)
            </p>
          </div>
          {isAnyWqiSelected && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Filtered ({selectedWqiBrackets.length})
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={wqiDistribution}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="bracket"
              tick={{ fontSize: 13, fill: "#6b7280" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 13, fill: "#6b7280" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                fontSize: 13,
              }}
              cursor={{ fill: "rgba(99,102,241,0.08)" }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              label={<CustomBarLabel />}
            >
              {wqiDistribution.map((entry, index) => {
                const isSelected = selectedWqiBrackets.includes(entry.bracket);
                const opacity = !isAnyWqiSelected || isSelected ? 1.0 : 0.35;
                return (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={BAR_COLORS[entry.bracket] || "#6366f1"}
                    style={{ cursor: "pointer" }}
                    fillOpacity={opacity}
                    onClick={(e) => toggleWqiBracket(entry.bracket, e.ctrlKey || e.metaKey)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Danger Zone Donut Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-indigo-900 font-bold text-lg">
              Risk Zone Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Sites by contamination risk level (Click to filter)
            </p>
          </div>
          {isAnyZoneSelected && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
              Filtered ({activeContaminationLevels.length})
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={zoneData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={renderDonutLabel}
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
                fontSize: 13,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
