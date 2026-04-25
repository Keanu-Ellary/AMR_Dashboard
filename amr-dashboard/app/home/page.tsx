"use client";

import { useState, useEffect, useMemo } from "react";
import { MapProvider } from "@/components/map/MapContext";
import type { SiteData } from "@/types/site_types";
import SitesSidebar from "@/components/map/SitesSidebar";
import { getDangerZoneLabel, MapFilters } from "@/types/map_types";
import { DEFAULT_FILTERS } from "@/constants/map_constants";
import { Map } from "@/components/map/LoadMap";
import { getAllSites } from "@/app/services/siteService";
import clsx from "clsx";
import { useUI } from "@/context/UIContext";
import AddDataPopup from "@/components/map/AddDataPopup";
import AddImagesPopup from "@/components/map/AddImagesPopup";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { getAveragedColor } from "@/utils/colorUtils";

export default function Home() {
  const {
    isAddDataOpen,
    setIsAddDataOpen,
    isAddImagesOpen,
    setIsAddImagesOpen,
  } = useUI();
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [timeWindow, setTimeWindow] = useState<[number, number]>([0, 0]);
  const [sliderBounds, setSliderBounds] = useState<[number, number]>([0, 0]);

  const handleGetAllSites = async () => {
    const allSitesResponse = await getAllSites();
    if (allSitesResponse.ok) {
      const allSiteData = await allSitesResponse.json();
      const loadedSites = allSiteData.sites || [];
      setSites(loadedSites);

      if (loadedSites.length > 0) {
        let minTime = Infinity;
        let maxTime = -Infinity;
        loadedSites.forEach((site: SiteData) => {
          const time = new Date(site.collectionDate).getTime();
          if (time < minTime) minTime = time;
          if (time > maxTime) maxTime = time;
        });

        // Give some padding if min == max
        if (minTime === maxTime) {
          minTime -= 86400000;
          maxTime += 86400000;
        }

        setSliderBounds([minTime, maxTime]);
        setTimeWindow([minTime, maxTime]);
      }
    }
  };

  useEffect(() => {
    handleGetAllSites();
  }, []);

  const uniqueSitePoints = useMemo(() => {
    // 1. Time Filter
    const timeFiltered = sites.filter((point) => {
      const time = new Date(point.collectionDate).getTime();
      return time >= timeWindow[0] && time <= timeWindow[1];
    });

    // 2. Group and Average
    const groupedData = timeFiltered.reduce<
      Record<string, { base: SiteData; totalScore: number; count: number }>
    >((acc, point) => {
      const key = `${point.latitude},${point.longitude}`;

      let score = 0;
      const dz = getDangerZoneLabel(point.dangerZone as any);
      if (dz === "high") score = 2;
      else if (dz === "moderate") score = 1;
      else if (dz === "low") score = 0;

      if (!acc[key]) {
        acc[key] = { base: { ...point }, totalScore: 0, count: 0 };
      }

      // Update with newest point base details just in case
      if (
        new Date(point.collectionDate) > new Date(acc[key].base.collectionDate)
      ) {
        acc[key].base = { ...point };
      }

      acc[key].totalScore += score;
      acc[key].count += 1;
      return acc;
    }, {});

    const aggregatedSites = Object.values(groupedData).map(
      ({ base, totalScore, count }) => {
        const averageScore = totalScore / count;
        const blendedColor = getAveragedColor(averageScore);
        let calculatedRiskLevel = "green";
        if (averageScore > 1.33) calculatedRiskLevel = "red";
        else if (averageScore > 0.66) calculatedRiskLevel = "yellow";

        return {
          ...base,
          averageScore,
          blendedColor,
          sampleCount: count,
          dangerZone: calculatedRiskLevel as any,
        };
      },
    );

    // 3. Map over all unique sites in base dataset to handle UI filtering
    const allUniqueBases = sites.reduce<Record<string, SiteData>>(
      (acc, point) => {
        const key = `${point.latitude},${point.longitude}`;
        if (
          !acc[key] ||
          new Date(point.collectionDate) > new Date(acc[key].collectionDate)
        ) {
          acc[key] = point;
        }
        return acc;
      },
      {},
    );

    return Object.values(allUniqueBases).map((baseSite) => {
      const key = `${baseSite.latitude},${baseSite.longitude}`;
      const agg = aggregatedSites.find(
        (a) => `${a.latitude},${a.longitude}` === key,
      );

      let result = agg
        ? { ...agg }
        : {
            ...baseSite,
            sampleCount: 0,
            averageScore: 0,
            blendedColor: "#0c0c0e",
          };

      // Filter logic
      let passesFilter = true;
      if (filters) {
        if (
          filters.contaminationLevels &&
          filters.contaminationLevels.length > 0
        ) {
          const mappedLevel = getDangerZoneLabel(result.dangerZone as any);
          if (!filters.contaminationLevels.includes(mappedLevel))
            passesFilter = false;
        }

        if (filters.sites && filters.sites.length > 0) {
          const siteNameStr = result.geoLocName;
          let siteName = siteNameStr;
          if (result.sampleName) {
            if (siteNameStr.includes("Apies River - ")) {
              const parts = siteNameStr.split("Apies River - ");
              if (parts.length > 1) siteName = parts[1].trim();
            } else if (siteNameStr.includes(" - Apies River")) {
              const parts = siteNameStr.split(" - Apies River");
              if (parts.length > 1) siteName = parts[0].trim();
            }
          }
          if (!filters.sites.includes(siteName)) passesFilter = false;
        }
      }

      if (!passesFilter || !agg) {
        result.blendedColor = "#0c0c0e";
        result.dangerZone = "grey" as any;
      }

      return result;
    });
  }, [sites, timeWindow, filters]);

  const stats = useMemo(() => {
    return {
      total: uniqueSitePoints.length,
      highRisk: uniqueSitePoints.filter((p) => p.dangerZone === "red").length,
      moderateRisk: uniqueSitePoints.filter((p) => p.dangerZone === "yellow")
        .length,
    };
  }, [uniqueSitePoints]);

  return (
    <main className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Stats Header */}
      <div className="p-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 max-w-4xl">
          <StatCard label="Unique Sampling Sites" value={stats.total} />
          <StatCard
            label="High Risk Sites"
            value={stats.highRisk}
            variant="risk-high"
          />
          <StatCard
            label="Moderate Risk Sites"
            value={stats.moderateRisk}
            variant="risk-moderate"
          />
        </div>
        {sliderBounds[0] !== sliderBounds[1] && (
          <div className="mb-4 max-w-4xl px-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Time Window: {new Date(timeWindow[0]).toLocaleDateString()} -{" "}
              {new Date(timeWindow[1]).toLocaleDateString()}
            </label>
            <Slider
              range
              min={sliderBounds[0]}
              max={sliderBounds[1]}
              value={timeWindow}
              onChange={(val) => setTimeWindow(val as [number, number])}
              step={86400000}
              allowCross={false}
              pushable={86400000}
            />
          </div>
        )}
      </div>

      <MapProvider>
        <div className="flex-1 flex overflow-hidden border-t border-border">
          <div className="flex-1 relative">
            <Map
              points={uniqueSitePoints}
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              filters={filters}
              onFiltersChange={setFilters}
              allPoints={sites}
            />
          </div>
          <SitesSidebar
            points={uniqueSitePoints}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onRefresh={handleGetAllSites}
          />
        </div>
      </MapProvider>

      {/* Popups */}
      <AddDataPopup
        isOpen={isAddDataOpen}
        onClose={() => setIsAddDataOpen(false)}
        selectedSite={selectedSite}
        onRefresh={handleGetAllSites}
      />
      <AddImagesPopup
        isOpen={isAddImagesOpen}
        onClose={() => setIsAddImagesOpen(false)}
        initialSite={selectedSite}
        onRefresh={handleGetAllSites}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "risk-high" | "risk-moderate";
}) {
  return (
    <div
      className={clsx(
        "p-5 rounded-xl border transition-all duration-200 shadow-subtle",
        variant === "risk-high"
          ? "bg-red-50 border-red-100"
          : variant === "risk-moderate"
            ? "bg-yellow-50 border-yellow-100"
            : "bg-white border-border",
      )}
    >
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={clsx(
          "text-3xl font-bold tracking-tight",
          variant === "risk-high"
            ? "text-risk-high"
            : variant === "risk-moderate"
              ? "text-risk-moderate"
              : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
