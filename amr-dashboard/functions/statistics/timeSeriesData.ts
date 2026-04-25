import { prisma } from "../../lib/db";

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

function calculateWQI(doValue: number, ph: number, temp: number, tds: number): number {
  const qDO = normalizeDO(doValue);
  const qPH = normalizePH(ph);
  const qTemp = normalizeTemp(temp);
  const qTDS = normalizeTDS(tds);
  return 0.35 * qDO + 0.25 * qPH + 0.2 * qTemp + 0.2 * qTDS;
}

export async function timeSeriesData(siteId: number, dateRange: string) {
  try {
    // We assume siteId refers to a specific SiteData entry.
    // To get time-series data, we'll fetch its location name, then find all samples for that location.
    const referenceSite = await prisma.siteData.findUnique({
      where: { id: siteId },
      select: { geoLocName: true },
    });

    if (!referenceSite) {
      return {
        statusCode: 404,
        body: { error: "Site not found" },
      };
    }

    const now = new Date();
    let startDate = new Date(0); // Default to all time

    if (dateRange === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90days") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "1year") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const sites = await prisma.siteData.findMany({
      where: {
        geoLocName: referenceSite.geoLocName,
        collectionDate: { gte: startDate },
      },
      orderBy: { collectionDate: "asc" },
    });

    const dailyData: Record<
      string,
      {
        count: number;
        wqiSum: number;
        tempSum: number;
        doSum: number;
        amrGeneCountSum: number;
      }
    > = {};

    for (const site of sites) {
      const dateKey = site.collectionDate.toISOString().split("T")[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          count: 0,
          wqiSum: 0,
          tempSum: 0,
          doSum: 0,
          amrGeneCountSum: 0,
        };
      }

      let amrCount = 0;
      if (site.amrResGenes && site.amrResGenes.trim().length > 0) {
        // Split by comma to get the count
        amrCount = site.amrResGenes.split(",").map((g) => g.trim()).filter((g) => g.length > 0).length;
      }

      let wqi = 0;
      if (
        site.dissolvedO2 != null &&
        site.ph != null &&
        site.temperature != null &&
        site.tds != null
      ) {
        wqi = calculateWQI(site.dissolvedO2, site.ph, site.temperature, site.tds);
      }

      dailyData[dateKey].count++;
      dailyData[dateKey].tempSum += site.temperature || 0;
      dailyData[dateKey].doSum += site.dissolvedO2 || 0;
      dailyData[dateKey].wqiSum += wqi;
      dailyData[dateKey].amrGeneCountSum += amrCount;
    }

    const results = Object.keys(dailyData).map((date) => {
      const data = dailyData[date];
      return {
        date,
        avgWQI: data.count > 0 ? Number((data.wqiSum / data.count).toFixed(2)) : 0,
        avgTemp: data.count > 0 ? Number((data.tempSum / data.count).toFixed(2)) : 0,
        avgDO: data.count > 0 ? Number((data.doSum / data.count).toFixed(2)) : 0,
        amrGeneCount: data.count > 0 ? Math.round(data.amrGeneCountSum / data.count) : 0,
      };
    });

    return {
      statusCode: 200,
      body: { results },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to fetch time series data" },
    };
  }
}
