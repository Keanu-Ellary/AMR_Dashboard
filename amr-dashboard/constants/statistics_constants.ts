export const SITE_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
];

export interface MetricOption {
  key: string;
  name: string;
  unit: string;
  color: string;
  dashStyle?: string;
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: "ph", name: "pH Level", unit: "", color: "#3b82f6", dashStyle: "" },
  { key: "temperature", name: "Temperature", unit: "°C", color: "#f59e0b", dashStyle: "5 5" },
  { key: "dissolvedO2", name: "Dissolved O₂", unit: "mg/L", color: "#06b6d4", dashStyle: "3 3" },
  { key: "tds", name: "TDS", unit: "mg/L", color: "#8b5cf6", dashStyle: "10 5" },
  { key: "ec", name: "EC", unit: "µS/cm", color: "#ec4899", dashStyle: "5 2 2 2" },
  { key: "wqi", name: "WQI", unit: "", color: "#10b981", dashStyle: "1 1" },
  { key: "amrGeneCount", name: "AMR Genes", unit: " count", color: "#ef4444", dashStyle: "8 3 2 3" },
];
