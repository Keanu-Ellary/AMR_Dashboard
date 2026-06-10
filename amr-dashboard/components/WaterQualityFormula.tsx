"use client";

import React from "react";
import {
  Droplets,
  Thermometer,
  FlaskConical,
  Gauge,
  Info,
  Award,
} from "lucide-react";

// ─── Normalization helpers ──────────────────────────────────────────────────────

function normalizePH(ph: number): number {
  if (ph >= 7 && ph <= 7.5) return 100;
  if (ph < 4 || ph > 11) return 0;
  if (ph < 7) return ((ph - 4) / 3) * 100;
  return ((11 - ph) / 3.5) * 100;
}

function normalizeDO(doVal: number): number {
  if (doVal >= 8) return 100;
  if (doVal <= 2) return 0;
  return ((doVal - 2) / 6) * 100;
}

function normalizeTemp(temp: number): number {
  if (temp >= 15 && temp <= 25) return 100;
  if (temp < 5 || temp > 35) return 0;
  if (temp < 15) return ((temp - 5) / 10) * 100;
  return ((35 - temp) / 10) * 100;
}

function normalizeTDS(tds: number): number {
  if (tds <= 50) return 100;
  if (tds >= 1000) return 0;
  return 100 - ((tds - 50) / 950) * 100;
}

// ─── Quality label helpers ──────────────────────────────────────────────────────

function getQualityLabel(wqi: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (wqi >= 90)
    return {
      label: "Excellent",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "ring-emerald-500",
    };
  if (wqi >= 70)
    return {
      label: "Good",
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      ring: "ring-blue-500",
    };
  if (wqi >= 50)
    return {
      label: "Moderate",
      color: "text-yellow-700",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      ring: "ring-yellow-500",
    };
  if (wqi >= 25)
    return {
      label: "Poor",
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      ring: "ring-orange-500",
    };
  return {
    label: "Very Poor",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-500",
  };
}

function getBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getBarTrack(score: number): string {
  if (score >= 70) return "bg-emerald-100";
  if (score >= 40) return "bg-yellow-100";
  return "bg-red-100";
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WaterQualityFormulaProps {
  ph?: number | null;
  temperature?: number | null;
  dissolvedO2?: number | null;
  tds?: number | null;
  wqi?: number | null;
  mode?: "site" | "reference";
  variant?: "full" | "compact";
}

interface ParamCard {
  name: string;
  abbrev: string;
  icon: React.ReactNode;
  rawValue: number;
  unit: string;
  subIndex: number;
  weight: number;
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function FormulaBox() {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">
          Water Quality Index Formula
        </h3>
      </div>
      <div className="overflow-x-auto">
        <p className="font-mono text-base md:text-lg text-indigo-900 whitespace-nowrap leading-relaxed">
          WQI&nbsp;=&nbsp;
          <span className="text-blue-700 font-bold">0.35</span>
          &nbsp;×&nbsp;q(DO)&nbsp;+&nbsp;
          <span className="text-blue-700 font-bold">0.25</span>
          &nbsp;×&nbsp;q(pH)&nbsp;+&nbsp;
          <span className="text-blue-700 font-bold">0.20</span>
          &nbsp;×&nbsp;q(Temp)&nbsp;+&nbsp;
          <span className="text-blue-700 font-bold">0.20</span>
          &nbsp;×&nbsp;q(TDS)
        </p>
      </div>
      <p className="text-xs text-indigo-500 mt-3">
        Where q(X) is the normalised sub-index for parameter X, scaled 0 – 100.
      </p>
    </div>
  );
}

function SubIndexCard({ card }: { card: ParamCard }) {
  const contribution = card.subIndex * card.weight;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{card.name}</p>
            <p className="text-xs text-gray-400">{card.abbrev}</p>
          </div>
        </div>
        <span className="font-mono text-sm font-bold text-gray-700">
          {card.rawValue.toFixed(1)}{" "}
          <span className="text-[10px] text-gray-400 font-normal">
            {card.unit}
          </span>
        </span>
      </div>

      {/* Sub-index score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            q({card.abbrev}) ={" "}
            <span className="font-semibold text-gray-700">
              {card.subIndex.toFixed(1)}
            </span>
          </span>
          <span className="text-[10px] text-gray-400">/100</span>
        </div>
        <div
          className={`w-full h-2.5 rounded-full ${getBarTrack(card.subIndex)} overflow-hidden`}
        >
          <div
            className={`h-full rounded-full ${getBarColor(card.subIndex)} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(Math.max(card.subIndex, 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Weight & contribution */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
        <span className="text-gray-500">
          Weight:{" "}
          <span className="font-semibold text-gray-700">
            {card.weight.toFixed(2)}
          </span>
        </span>
        <span className="text-gray-500">
          Contribution:{" "}
          <span className="font-semibold text-indigo-600">
            {contribution.toFixed(1)}
          </span>
        </span>
      </div>
    </div>
  );
}

function WQIScoreBadge({ wqi }: { wqi: number }) {
  const q = getQualityLabel(wqi);

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border ${q.border} ${q.bg} transition-all duration-300 flex flex-col sm:flex-row items-center gap-6`}
    >
      {/* Ring */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={q.ring.replace("ring-", "text-")}
            strokeDasharray={`${(wqi / 100) * 263.9} 263.9`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${q.color}`}>
            {wqi.toFixed(0)}
          </span>
          <span className="text-[9px] text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
          <Award className={`w-5 h-5 ${q.color}`} />
          <h3 className={`text-lg font-bold ${q.color}`}>{q.label}</h3>
        </div>
        <p className="text-sm text-gray-500 max-w-xs">
          The calculated Water Quality Index based on the measured parameters
          and their respective weights.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
          {[
            {
              min: 90,
              label: "Excellent",
              cls: "bg-emerald-100 text-emerald-700",
            },
            { min: 70, label: "Good", cls: "bg-blue-100 text-blue-700" },
            {
              min: 50,
              label: "Moderate",
              cls: "bg-yellow-100 text-yellow-700",
            },
            { min: 25, label: "Poor", cls: "bg-orange-100 text-orange-700" },
            { min: 0, label: "Very Poor", cls: "bg-red-100 text-red-700" },
          ].map((b) => (
            <span
              key={b.label}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.cls} ${
                wqi >= b.min &&
                (b.min === 90 ||
                  wqi <
                    (b.min === 70
                      ? 90
                      : b.min === 50
                        ? 70
                        : b.min === 25
                          ? 50
                          : b.min === 0
                            ? 25
                            : 101))
                  ? "ring-2 ring-offset-1 ring-current"
                  : "opacity-60"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompactBreakdown({ cards }: { cards: ParamCard[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {cards.map((card) => (
          <div
            key={card.abbrev}
            className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2"
          >
            <div>
              <p className="font-medium text-slate-800">{card.name}</p>
              <p className="text-xs text-slate-500">q({card.abbrev})</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-800">
                {card.subIndex.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">
                w {card.weight.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reference mode sub-components ──────────────────────────────────────────────

function NormalizationTable() {
  const rows = [
    {
      param: "Dissolved Oxygen (DO)",
      ideal: "≥ 8 mg/L",
      formula: "((DO − 2) / 6) × 100",
      zero: "≤ 2 mg/L",
    },
    {
      param: "pH",
      ideal: "7.0 – 7.5",
      formula: "< 7: ((pH − 4) / 3) × 100\n> 7.5: ((11 − pH) / 3.5) × 100",
      zero: "< 4 or > 11",
    },
    {
      param: "Temperature",
      ideal: "15 – 25 °C",
      formula: "< 15: ((T − 5) / 10) × 100\n> 25: ((35 − T) / 10) × 100",
      zero: "< 5 or > 35 °C",
    },
    {
      param: "TDS",
      ideal: "≤ 50 mg/L",
      formula: "100 − ((TDS − 50) / 950) × 100",
      zero: "≥ 1000 mg/L",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">
          Sub-index Normalization Functions
        </h4>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Parameter
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ideal (→ 100)
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Normalization
            </th>
            <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Zero Score
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.param}
              className={`${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <td className="py-3 pr-4 font-medium text-gray-800">{r.param}</td>
              <td className="py-3 pr-4 text-emerald-600 font-mono text-xs">
                {r.ideal}
              </td>
              <td className="py-3 pr-4 font-mono text-xs text-gray-600 whitespace-pre-line">
                {r.formula}
              </td>
              <td className="py-3 text-red-500 font-mono text-xs">{r.zero}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeightBar() {
  const segments = [
    {
      label: "DO",
      weight: 0.35,
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "pH",
      weight: 0.25,
      color: "bg-indigo-500",
      textColor: "text-indigo-700",
    },
    {
      label: "Temp",
      weight: 0.2,
      color: "bg-teal-500",
      textColor: "text-teal-700",
    },
    {
      label: "TDS",
      weight: 0.2,
      color: "bg-purple-500",
      textColor: "text-purple-700",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">
          Parameter Weights
        </h4>
      </div>

      {/* Stacked bar */}
      <div className="flex h-10 rounded-xl overflow-hidden mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} flex items-center justify-center text-white text-xs font-bold transition-all duration-500`}
            style={{ width: `${seg.weight * 100}%` }}
          >
            {seg.label} ({(seg.weight * 100).toFixed(0)}%)
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${seg.color}`} />
            <span className="text-xs text-gray-600">
              {seg.label}:{" "}
              <span className={`font-semibold ${seg.textColor}`}>
                {(seg.weight * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function WaterQualityFormula({
  ph,
  temperature,
  dissolvedO2,
  tds,
  wqi: externalWqi,
  mode = "reference",
  variant = "full",
}: WaterQualityFormulaProps) {
  // Determine effective mode
  const hasSiteData =
    ph != null && temperature != null && dissolvedO2 != null && tds != null;
  const effectiveMode = mode === "site" && hasSiteData ? "site" : "reference";

  // ── Site mode calculations ──
  if (effectiveMode === "site" && hasSiteData) {
    const phVal = ph as number;
    const tempVal = temperature as number;
    const doVal = dissolvedO2 as number;
    const tdsVal = tds as number;

    const qDO = normalizeDO(doVal);
    const qPH = normalizePH(phVal);
    const qTemp = normalizeTemp(tempVal);
    const qTDS = normalizeTDS(tdsVal);

    const calculatedWqi = 0.35 * qDO + 0.25 * qPH + 0.2 * qTemp + 0.2 * qTDS;
    const finalWqi = externalWqi ?? calculatedWqi;

    const cards: ParamCard[] = [
      {
        name: "Dissolved Oxygen",
        abbrev: "DO",
        icon: <Droplets className="w-5 h-5" />,
        rawValue: doVal,
        unit: "mg/L",
        subIndex: qDO,
        weight: 0.35,
      },
      {
        name: "pH Level",
        abbrev: "pH",
        icon: <FlaskConical className="w-5 h-5" />,
        rawValue: phVal,
        unit: "",
        subIndex: qPH,
        weight: 0.25,
      },
      {
        name: "Temperature",
        abbrev: "Temp",
        icon: <Thermometer className="w-5 h-5" />,
        rawValue: tempVal,
        unit: "°C",
        subIndex: qTemp,
        weight: 0.2,
      },
      {
        name: "Total Dissolved Solids",
        abbrev: "TDS",
        icon: <Gauge className="w-5 h-5" />,
        rawValue: tdsVal,
        unit: "mg/L",
        subIndex: qTDS,
        weight: 0.2,
      },
    ];

    if (variant === "compact") {
      return <CompactBreakdown cards={cards} />;
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Formula */}
        <FormulaBox />

        {/* Sub-index cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((c) => (
            <SubIndexCard key={c.abbrev} card={c} />
          ))}
        </div>

        {/* Final WQI score */}
        <WQIScoreBadge wqi={finalWqi} />
      </div>
    );
  }

  // ── Reference mode ──
  return (
    <div className="flex flex-col gap-6">
      {/* Formula */}
      <FormulaBox />

      {/* Normalization table */}
      <NormalizationTable />

      {/* Weight bar */}
      <WeightBar />
    </div>
  );
}
