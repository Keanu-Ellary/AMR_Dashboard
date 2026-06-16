"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface GraphConfig {
  id: string;
  selectedSites: string[];
  selectedMetrics: string[];
  dateRange: string;
}

interface StatisticsContextType {
  graphs: GraphConfig[];
  activeGraphId: string | null;
  addGraph: () => void;
  removeGraph: (id: string) => void;
  updateGraph: (id: string, updates: Partial<GraphConfig>) => void;
  setActiveGraph: (id: string | null) => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

const DEFAULT_METRICS = ["ph", "temperature", "wqi"];
const DEFAULT_DATE_RANGE = "30days";

export function StatisticsProvider({ children }: { children: ReactNode }) {
  const [graphs, setGraphs] = useState<GraphConfig[]>(() => {
    const initialId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    return [
      {
        id: initialId,
        selectedSites: [],
        selectedMetrics: DEFAULT_METRICS,
        dateRange: DEFAULT_DATE_RANGE,
      },
    ];
  });
  
  const [activeGraphId, setActiveGraphId] = useState<string | null>(graphs[0]?.id || null);

  const addGraph = () => {
    const newId = crypto.randomUUID();
    const newGraph: GraphConfig = {
      id: newId,
      selectedSites: graphs.length > 0 ? [...graphs[graphs.length - 1].selectedSites] : [],
      selectedMetrics: graphs.length > 0 ? [...graphs[graphs.length - 1].selectedMetrics] : DEFAULT_METRICS,
      dateRange: graphs.length > 0 ? graphs[graphs.length - 1].dateRange : DEFAULT_DATE_RANGE,
    };
    setGraphs((prev) => [...prev, newGraph]);
    setActiveGraphId(newId);
  };

  const removeGraph = (id: string) => {
    setGraphs((prev) => {
      const filtered = prev.filter((g) => g.id !== id);
      if (activeGraphId === id) {
        setActiveGraphId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const updateGraph = (id: string, updates: Partial<GraphConfig>) => {
    setGraphs((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const setActiveGraph = (id: string | null) => {
    setActiveGraphId(id);
  };

  return (
    <StatisticsContext.Provider
      value={{
        graphs,
        activeGraphId,
        addGraph,
        removeGraph,
        updateGraph,
        setActiveGraph,
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
}

export function useStatistics() {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error("useStatistics must be used within a StatisticsProvider");
  }
  return context;
}
