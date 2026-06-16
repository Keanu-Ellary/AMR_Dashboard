import { prisma } from "../../lib/db";

// ── WQI normalization helpers (same as timeSeriesData.ts) ──────────────

function normalizePH(ph: number): number {
  if (ph >= 7 && ph <= 7.5) return 100;
  if (ph < 4 || ph > 11) return 0;
  if (ph < 7) return ((ph - 4) / 3) * 100;
  return ((11 - ph) / 3.5) * 100;
}

function normalizeDO(doValue: number): number {
  if (doValue >= 8) return 100;
  if (doValue <= 2) return 0;
  return ((doValue - 2) / 6) * 100;
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

function calculateWQI(
  doValue: number,
  ph: number,
  temp: number,
  tds: number
): number {
  return (
    0.35 * normalizeDO(doValue) +
    0.25 * normalizePH(ph) +
    0.2 * normalizeTemp(temp) +
    0.2 * normalizeTDS(tds)
  );
}

// ── Pearson correlation ────────────────────────────────────────────────

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

// ── Date-range helper ──────────────────────────────────────────────────

function getStartDate(dateRange: string): Date {
  const now = new Date();
  switch (dateRange) {
    case "7days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90days":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // "all"
  }
}

// ── Metric extraction from a SiteData row ──────────────────────────────

interface SiteRow {
  ph: number | null;
  temperature: number | null;
  dissolvedO2: number | null;
  tds: number | null;
  ec: number | null;
  amrResGenes: string;
  dangerZone: string;
  sampleName: string;
  collectionDate: Date;
}

function extractMetric(row: SiteRow, metric: string): number {
  switch (metric) {
    case "ph":
      return row.ph ?? 0;
    case "temperature":
      return row.temperature ?? 0;
    case "dissolvedO2":
      return row.dissolvedO2 ?? 0;
    case "tds":
      return row.tds ?? 0;
    case "ec":
      return row.ec ?? 0;
    case "wqi":
      if (
        row.dissolvedO2 != null &&
        row.ph != null &&
        row.temperature != null &&
        row.tds != null
      ) {
        return calculateWQI(row.dissolvedO2, row.ph, row.temperature, row.tds);
      }
      return 0;
    case "amrGeneCount": {
      if (row.amrResGenes && row.amrResGenes.trim().length > 0) {
        return row.amrResGenes
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g.length > 0).length;
      }
      return 0;
    }
    default:
      return 0;
  }
}

// ── Main export ────────────────────────────────────────────────────────

export async function getSiteComparison(
  siteNames: string[],
  dateRange: string,
  metrics: string[]
) {
  try {
    const startDate = getStartDate(dateRange);

    const timeSeries: Record<
      string,
      { date: string; [metric: string]: number | string }[]
    > = {};

    const correlations: Record<string, Record<string, number>> = {};

    const siteLatest: Record<
      string,
      {
        ph: number | null;
        temperature: number | null;
        dissolvedO2: number | null;
        tds: number | null;
        ec: number | null;
        wqi: number;
        dangerZone: string;
        sampleName: string;
        collectionDate: Date;
      }
    > = {};

    for (const siteName of siteNames) {
      // 1. Query all matching rows for this site within the date range
      const rows = await prisma.siteData.findMany({
        where: {
          geoLocName: siteName,
          collectionDate: { gte: startDate },
        },
        orderBy: { collectionDate: "asc" },
      });

      if (rows.length === 0) {
        timeSeries[siteName] = [];
        correlations[siteName] = {};
        continue;
      }

      // 2. Aggregate data by date
      const dailyBuckets: Record<
        string,
        { count: number; sums: Record<string, number> }
      > = {};

      for (const row of rows) {
        const dateKey = row.collectionDate.toISOString().split("T")[0];

        if (!dailyBuckets[dateKey]) {
          dailyBuckets[dateKey] = { count: 0, sums: {} };
          for (const m of metrics) {
            dailyBuckets[dateKey].sums[m] = 0;
          }
        }

        dailyBuckets[dateKey].count++;
        for (const m of metrics) {
          dailyBuckets[dateKey].sums[m] += extractMetric(row as SiteRow, m);
        }
      }

      // 3. Build time-series array (averages per day)
      const series: { date: string; [metric: string]: number | string }[] =
        Object.keys(dailyBuckets)
          .sort()
          .map((date) => {
            const bucket = dailyBuckets[date];
            const entry: { date: string; [metric: string]: number | string } = {
              date,
            };
            for (const m of metrics) {
              entry[m] =
                bucket.count > 0
                  ? Number((bucket.sums[m] / bucket.count).toFixed(2))
                  : 0;
            }
            return entry;
          });

      timeSeries[siteName] = series;

      // 4. Compute Pearson correlation matrix for every metric pair
      const metricArrays: Record<string, number[]> = {};
      for (const m of metrics) {
        metricArrays[m] = series.map((s) => s[m] as number);
      }

      const siteCorrelations: Record<string, number> = {};
      for (let i = 0; i < metrics.length; i++) {
        for (let j = i + 1; j < metrics.length; j++) {
          const key = `${metrics[i]}_vs_${metrics[j]}`;
          siteCorrelations[key] = pearsonCorrelation(
            metricArrays[metrics[i]],
            metricArrays[metrics[j]]
          );
        }
      }
      correlations[siteName] = siteCorrelations;

      // 5. Latest data point for each site
      const latest = rows[rows.length - 1];
      let latestWqi = 0;
      if (
        latest.dissolvedO2 != null &&
        latest.ph != null &&
        latest.temperature != null &&
        latest.tds != null
      ) {
        latestWqi = Number(
          calculateWQI(
            latest.dissolvedO2,
            latest.ph,
            latest.temperature,
            latest.tds
          ).toFixed(2)
        );
      }

      siteLatest[siteName] = {
        ph: latest.ph,
        temperature: latest.temperature,
        dissolvedO2: latest.dissolvedO2,
        tds: latest.tds,
        ec: latest.ec,
        wqi: latestWqi,
        dangerZone: latest.dangerZone,
        sampleName: latest.sampleName,
        collectionDate: latest.collectionDate,
      };
    }

    return {
      statusCode: 200,
      body: {
        timeSeries,
        correlations,
        siteLatest,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: { error: "Failed to fetch site comparison data" },
    };
  }
}
