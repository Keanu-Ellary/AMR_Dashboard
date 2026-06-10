"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { MapFilters, ContaminationLevel } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";

interface DashboardContextType {
  filters: MapFilters;
  selectedWqiBrackets: string[];
  setFilters: (filters: MapFilters) => void;
  toggleContaminationLevel: (level: ContaminationLevel, append?: boolean) => void;
  toggleSite: (site: string, append?: boolean) => void;
  toggleWqiBracket: (bracket: string, append?: boolean) => void;
  setDateRange: (start?: string, end?: string) => void;
  clearAllFilters: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<MapFilters>(DEFAULT_FILTERS);
  const [selectedWqiBrackets, setSelectedWqiBrackets] = useState<string[]>([]);

  const setFilters = (newFilters: MapFilters) => {
    setFiltersState(newFilters);
  };

  const toggleContaminationLevel = (level: ContaminationLevel, append: boolean = false) => {
    setFiltersState((prev) => {
      const current = prev.contaminationLevels ?? [];
      const exists = current.includes(level);
      let next: ContaminationLevel[];

      if (append) {
        next = exists ? current.filter((l) => l !== level) : [...current, level];
      } else {
        next = exists && current.length === 1 ? [] : [level];
      }

      return { ...prev, contaminationLevels: next };
    });
  };

  const toggleSite = (site: string, append: boolean = false) => {
    setFiltersState((prev) => {
      const current = prev.sites ?? [];
      const exists = current.includes(site);
      let next: string[];

      if (append) {
        next = exists ? current.filter((s) => s !== site) : [...current, site];
      } else {
        next = exists && current.length === 1 ? [] : [site];
      }

      return { ...prev, sites: next };
    });
  };

  const toggleWqiBracket = (bracket: string, append: boolean = false) => {
    setSelectedWqiBrackets((prev) => {
      const exists = prev.includes(bracket);
      if (append) {
        return exists ? prev.filter((b) => b !== bracket) : [...prev, bracket];
      } else {
        return exists && prev.length === 1 ? [] : [bracket];
      }
    });
  };

  const setDateRange = (start?: string, end?: string) => {
    setFiltersState((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  const clearAllFilters = () => {
    setFiltersState(DEFAULT_FILTERS);
    setSelectedWqiBrackets([]);
  };

  return (
    <DashboardContext.Provider
      value={{
        filters,
        selectedWqiBrackets,
        setFilters,
        toggleContaminationLevel,
        toggleSite,
        toggleWqiBracket,
        setDateRange,
        clearAllFilters,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
