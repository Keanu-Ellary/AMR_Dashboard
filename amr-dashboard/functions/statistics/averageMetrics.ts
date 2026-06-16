import { prisma } from "../../lib/db";

export async function averageMetrics() {
  try {
    const sites = await prisma.siteData.findMany({
      select: {
        ph: true,
        temperature: true,
        dissolvedO2: true,
        tds: true,
      },
    });

    let totalH = 0;
    let totalTemp = 0;
    let totalDiss = 0;
    let totalTDS = 0;
    let validSitesCount = 0;

    for (const site of sites) {
      if (
        site.temperature == null ||
        site.ph == null ||
        site.tds == null ||
        site.dissolvedO2 == null
      ) {
        continue;
      }

      totalH += Math.pow(10, -site.ph);
      totalTemp += site.temperature;
      totalDiss += site.dissolvedO2;
      totalTDS += site.tds;
      validSitesCount++;
    }

    const avgpH =
      validSitesCount > 0 ? -Math.log10(totalH / validSitesCount) : 0;
    const avgTemp = validSitesCount > 0 ? totalTemp / validSitesCount : 0;
    const avgDiss = validSitesCount > 0 ? totalDiss / validSitesCount : 0;
    const avgTDS = validSitesCount > 0 ? totalTDS / validSitesCount : 0;

    return {
      statusCode: 200,
      body: {
        avgpH,
        avgTemp,
        avgDiss,
        avgTDS,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to calculate averages" },
    };
  }
}
