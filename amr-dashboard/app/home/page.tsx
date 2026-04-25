"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

const SPEED_OPTIONS = [1, 2, 5, 10] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

// Each speed reduces the delay between 1-day advances
const SPEED_DELAY_MS: Record<Speed, number> = {
  1: 500, // 1× — one day every 500 ms
  2: 250, // 2× — one day every 250 ms
  5: 100, // 5× — one day every 100 ms
  10: 50, // 10× — one day every 50 ms
};

const DAY_MS = 86_400_000;
const THIRTY_DAYS_MS = 30 * DAY_MS;

function toISODateString(ts: number) {
  const d = new Date(ts);
  return d.toISOString().split("T")[0];
}

export default function Home() {
  const {
    isAddDataOpen,
    setIsAddDataOpen,
    isAddImagesOpen,
    setIsAddImagesOpen,
    globalSelectedSite,
    setGlobalSelectedSite,
  } = useUI();
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [timeWindow, setTimeWindow] = useState<[number, number]>([0, 0]);
  const [sliderBounds, setSliderBounds] = useState<[number, number]>([0, 0]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ------- keyboard shortcuts -------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        // Don't toggle if user is typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();

        // Use the same logic as the button
        const atEnd = timeWindow[1] >= sliderBounds[1];
        if (atEnd) {
          const windowSize = timeWindow[1] - timeWindow[0];
          setTimeWindow([sliderBounds[0], sliderBounds[0] + windowSize]);
          setIsPlaying(true);
        } else {
          setIsPlaying((p) => !p);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timeWindow, sliderBounds]);

  // ------- data loading -------
  const handleGetAllSites = async () => {
    const allSitesResponse = await getAllSites();
    if (allSitesResponse.ok) {
      const allSiteData = await allSitesResponse.json();
      const loadedSites: SiteData[] = allSiteData.sites || [];
      setSites(loadedSites);

      if (loadedSites.length > 0) {
        let minTime = Infinity;
        let maxTime = -Infinity;
        loadedSites.forEach((site) => {
          const t = new Date(site.collectionDate).getTime();
          if (t < minTime) minTime = t;
          if (t > maxTime) maxTime = t;
        });

        if (minTime === maxTime) {
          minTime -= DAY_MS;
          maxTime += DAY_MS;
        }

        setSliderBounds([minTime, maxTime]);

        // Default window: last 30 days of available data
        const windowStart = Math.max(minTime, maxTime - THIRTY_DAYS_MS);
        setTimeWindow([windowStart, maxTime]);
      }
    }
  };

  useEffect(() => {
    handleGetAllSites();
  }, []);

  // ------- playback tick -------
  const tick = useCallback(() => {
    setTimeWindow((prev) => {
      const windowSize = prev[1] - prev[0];
      const newEnd = prev[1] + DAY_MS; // always advance exactly 1 day

      if (newEnd >= sliderBounds[1]) {
        // Reached the end — snap and stop
        setIsPlaying(false);
        return [sliderBounds[1] - windowSize, sliderBounds[1]];
      }

      return [prev[0] + DAY_MS, prev[1] + DAY_MS];
    });
  }, [sliderBounds]);

  useEffect(() => {
    if (isPlaying) {
      // Speed controls the delay between day-advances, not the step size
      intervalRef.current = setInterval(tick, SPEED_DELAY_MS[speed]);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, tick, speed]);

  // Auto-pause when window reaches bound
  useEffect(() => {
    if (timeWindow[1] >= sliderBounds[1] && isPlaying) {
      setIsPlaying(false);
    }
  }, [timeWindow, sliderBounds, isPlaying]);

  // ------- unique site points -------
  const uniqueSitePoints = useMemo(() => {
    const timeFiltered = sites.filter((point) => {
      const time = new Date(point.collectionDate).getTime();
      return time >= timeWindow[0] && time <= timeWindow[1];
    });

    const groupedData = timeFiltered.reduce<
      Record<string, { base: SiteData; totalScore: number; count: number }>
    >((acc, point) => {
      const key = point.geoLocName;

      let score = 0;
      const dz = getDangerZoneLabel(point.dangerZone as any);
      if (dz === "high") score = 2;
      else if (dz === "moderate") score = 1;

      if (!acc[key]) {
        acc[key] = { base: { ...point }, totalScore: 0, count: 0 };
      }

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

    const allUniqueBases = sites.reduce<Record<string, SiteData>>(
      (acc, point) => {
        const key = point.geoLocName;
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
      const key = baseSite.geoLocName;
      const agg = aggregatedSites.find((a) => a.geoLocName === key);

      let result = agg
        ? { ...agg }
        : {
            ...baseSite,
            sampleCount: 0,
            averageScore: 0,
            blendedColor: "#0c0c0e",
          };

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

  const hasSlider = sliderBounds[0] !== sliderBounds[1];
  const atEnd = timeWindow[1] >= sliderBounds[1];

  return (
    <main className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Stats + Slider Header */}
      <div className="p-6 pb-2">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
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

          {/* Time Window Control */}
          {hasSlider && (
            <div className="flex-1 bg-white border border-border rounded-xl shadow-subtle px-5 py-4 flex flex-col justify-between min-w-0">
              {/* Header row: label + play controls */}
              <div className="flex items-center justify-between mb-3 gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Time Window
                </span>

                {/* Playback controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Speed toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        id={`speed-${s}x`}
                        onClick={() => setSpeed(s)}
                        className={clsx(
                          "px-2 py-1 rounded-md text-[11px] font-bold transition-all duration-150",
                          speed === s
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700",
                        )}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>

                  {/* Play / Pause button */}
                  <button
                    id="time-play-pause"
                    onClick={() => {
                      if (atEnd) {
                        // Restart from beginning of window
                        const windowSize = timeWindow[1] - timeWindow[0];
                        setTimeWindow([
                          sliderBounds[0],
                          sliderBounds[0] + windowSize,
                        ]);
                        setIsPlaying(true);
                      } else {
                        setIsPlaying((p) => !p);
                      }
                    }}
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm text-white text-sm",
                      atEnd
                        ? "bg-gray-400 hover:bg-gray-500"
                        : isPlaying
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-blue-500 hover:bg-blue-600",
                    )}
                    title={atEnd ? "Restart" : isPlaying ? "Pause" : "Play"}
                  >
                    {atEnd ? (
                      /* Restart icon */
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                      </svg>
                    ) : isPlaying ? (
                      /* Pause icon */
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      /* Play icon */
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="px-1">
                <Slider
                  range={{ draggableTrack: true }}
                  min={sliderBounds[0]}
                  max={sliderBounds[1]}
                  value={timeWindow}
                  onChange={(val) => {
                    setTimeWindow(val as [number, number]);
                    if (isPlaying) setIsPlaying(false);
                  }}
                  step={DAY_MS}
                  allowCross={false}
                  pushable={DAY_MS}
                />
              </div>

              {/* Date labels / inputs */}
              <div className="flex justify-between items-center mt-2 px-1">
                <input
                  type="date"
                  value={toISODateString(timeWindow[0])}
                  min={toISODateString(sliderBounds[0])}
                  max={toISODateString(timeWindow[1])}
                  onChange={(e) => {
                    const newTs = new Date(e.target.value).getTime();
                    if (!isNaN(newTs)) {
                      setTimeWindow([newTs, timeWindow[1]]);
                      if (isPlaying) setIsPlaying(false);
                    }
                  }}
                  className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.5 rounded-md border border-transparent hover:border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 mx-2">→</span>
                <input
                  type="date"
                  value={toISODateString(timeWindow[1])}
                  min={toISODateString(timeWindow[0])}
                  max={toISODateString(sliderBounds[1])}
                  onChange={(e) => {
                    const newTs = new Date(e.target.value).getTime();
                    if (!isNaN(newTs)) {
                      setTimeWindow([timeWindow[0], newTs]);
                      if (isPlaying) setIsPlaying(false);
                    }
                  }}
                  className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.5 rounded-md border border-transparent hover:border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer text-right"
                />
              </div>
            </div>
          )}
        </div>
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
        onClose={() => {
          setIsAddDataOpen(false);
          setGlobalSelectedSite(null);
        }}
        selectedSite={globalSelectedSite || selectedSite}
        onRefresh={handleGetAllSites}
      />
      <AddImagesPopup
        isOpen={isAddImagesOpen}
        onClose={() => {
          setIsAddImagesOpen(false);
          setGlobalSelectedSite(null);
        }}
        initialSite={globalSelectedSite || selectedSite}
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
