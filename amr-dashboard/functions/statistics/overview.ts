import { prisma } from "../../lib/db";

function normalizePH(ph: number): number {
  if (ph >= 7 && ph <= 7.5) return 100;
  if (ph < 4 || ph > 11) return 0;
  if (ph < 7) return ((ph - 4) / 3) * 100;
  return ((11 - ph) / 3.5) * 100;
}

function normalizeDO(dissolvedO2: number): number {
  if (dissolvedO2 >= 8) return 100;
  if (dissolvedO2 <= 2) return 0;
  return ((dissolvedO2 - 2) / 6) * 100;
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
  dissolvedO2: number | null,
  ph: number | null,
  temp: number | null,
  tds: number | null
): number | null {
  if (dissolvedO2 === null || ph === null || temp === null || tds === null) {
    return null;
  }

  return (
    0.35 * normalizeDO(dissolvedO2) +
    0.25 * normalizePH(ph) +
    0.20 * normalizeTemp(temp) +
    0.20 * normalizeTDS(tds)
  );
}

export async function getOverviewStats() {
  const allSiteData = await prisma.siteData.findMany();

  const totalSamples = allSiteData.length;

  const uniqueLocations = new Set(allSiteData.map((s) => s.geoLocName)).size;

  const zoneBreakdown = { red: 0, yellow: 0, green: 0 };
  for (const site of allSiteData) {
    const zone = site.dangerZone.toLowerCase();
    if (zone === "red") zoneBreakdown.red++;
    else if (zone === "yellow") zoneBreakdown.yellow++;
    else if (zone === "green") zoneBreakdown.green++;
  }

  let phSum = 0, phCount = 0;
  let tempSum = 0, tempCount = 0;
  let doSum = 0, doCount = 0;
  let tdsSum = 0, tdsCount = 0;
  let ecSum = 0, ecCount = 0;

  for (const site of allSiteData) {
    if (site.ph !== null) { phSum += site.ph; phCount++; }
    if (site.temperature !== null) { tempSum += site.temperature; tempCount++; }
    if (site.dissolvedO2 !== null) { doSum += site.dissolvedO2; doCount++; }
    if (site.tds !== null) { tdsSum += site.tds; tdsCount++; }
    if (site.ec !== null) { ecSum += site.ec; ecCount++; }
  }

  const averageMetrics = {
    avgPH: phCount > 0 ? phSum / phCount : null,
    avgTemp: tempCount > 0 ? tempSum / tempCount : null,
    avgDO: doCount > 0 ? doSum / doCount : null,
    avgTDS: tdsCount > 0 ? tdsSum / tdsCount : null,
    avgEC: ecCount > 0 ? ecSum / ecCount : null,
  };

  const wqiBrackets = [
    { bracket: "0-25", count: 0 },
    { bracket: "26-50", count: 0 },
    { bracket: "51-75", count: 0 },
    { bracket: "76-100", count: 0 },
  ];

  for (const site of allSiteData) {
    const wqi = calculateWQI(site.dissolvedO2, site.ph, site.temperature, site.tds);
    if (wqi === null) continue;

    if (wqi <= 25) wqiBrackets[0].count++;
    else if (wqi <= 50) wqiBrackets[1].count++;
    else if (wqi <= 75) wqiBrackets[2].count++;
    else wqiBrackets[3].count++;
  }

  const recentActivity = await prisma.siteData.findMany({
    select: {
      id: true,
      sampleName: true,
      geoLocName: true,
      dangerZone: true,
      collectionDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    statusCode: 200,
    body: {
      totalSamples,
      uniqueLocations,
      zoneBreakdown,
      averageMetrics,
      wqiDistribution: wqiBrackets,
      recentActivity,
    },
  };
}
