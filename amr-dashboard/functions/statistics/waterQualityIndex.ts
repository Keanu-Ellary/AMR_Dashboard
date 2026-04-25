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

export async function waterQualityIndex() {
  try {
    const sites = await prisma.siteData.findMany();

    const results = sites.map((site) => {
      if (
        site.dissolvedO2 == null ||
        site.ph == null ||
        site.tds == null ||
        site.temperature == null
      ) {
        throw new Error("Fields are empty. Cannot perform function");
      }

      const qDO = normalizeDO(site.dissolvedO2);
      const qPH = normalizePH(site.ph);
      const qTemp = normalizeTemp(site.temperature);
      const qTDS = normalizeTDS(site.tds);

      const score = 0.35 * qDO + 0.25 * qPH + 0.2 * qTemp + 0.2 * qTDS;

      return {
        id: site.id,
        WQI: Number(score.toFixed(2)),
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
      body: { error: "Failed to calculate WQI" },
    };
  }
}
