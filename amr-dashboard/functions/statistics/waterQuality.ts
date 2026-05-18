import { prisma } from "../../lib/db";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function waterQuality(siteId?: number) {
  try {
    // water quality calc for specific site
    if (siteId) {
      const site = await prisma.siteData.findUnique({
        where: { id: siteId },
      });

      if (!site) {
        return {
          statusCode: 404,
          body: { error: "Site not found" },
        };
      }

      let qualityScore = 100;

      // pH assessment
      if (site.ph !== null) {
        if (site.ph >= 6.5 && site.ph <= 8.5) {
        } else if (site.ph >= 6 && site.ph <= 9) {
          qualityScore -= 10;
        } else {
          qualityScore -= 25;
        }
      }

      // Temperature assessment
      if (site.temperature !== null) {
        if (site.temperature >= 15 && site.temperature <= 25) {
        } else if (site.temperature >= 10 && site.temperature <= 30) {
          qualityScore -= 10;
        } else {
          qualityScore -= 20;
        }
      }

      // TDS assessment
      if (site.tds !== null) {
        if (site.tds < 500) {
        } else if (site.tds < 1000) {
          qualityScore -= 15;
        } else {
          qualityScore -= 30;
        }
      }

      // Dissolved Oxygen assessment
      if (site.dissolvedO2 !== null) {
        if (site.dissolvedO2 > 5) {
        } else if (site.dissolvedO2 > 3) {
          qualityScore -= 15;
        } else {
          qualityScore -= 30;
        }
      }

      // Danger zone assessment
      if (site.dangerZone === "red") {
        qualityScore -= 25;
      } else if (site.dangerZone === "yellow") {
        qualityScore -= 10;
      }

      const percentageClean = Math.max(0, Math.min(100, qualityScore));

      return {
        statusCode: 200,
        body: {
          percentageClean: Number(percentageClean.toFixed(2)),
          dangerZone: site.dangerZone || "unknown",
          parameters: {
            ph: site.ph,
            temperature: site.temperature,
            tds: site.tds,
            dissolvedO2: site.dissolvedO2,
          },
        },
      };
    }

    // System-wide water quality calculation (all sites)
    const sites = await prisma.siteData.findMany({
      orderBy: [{ latitude: "desc" }, { longitude: "asc" }],
    });

    if (sites.length < 2) {
      return {
        statusCode: 200,
        body: { percentageClean: 100 },
      };
    }

    let totalDistance = 0;
    let contaminatedDistance = 0;

    for (let j = 0; j < sites.length - 1; j++) {
      const curr = sites[j];
      const next = sites[j + 1];

      const dist = getDistance(
        curr.latitude,
        curr.longitude,
        next.latitude,
        next.longitude,
      );

      totalDistance += dist;

      if (curr.dangerZone === "red" || next.dangerZone === "red") {
        contaminatedDistance += dist;
      }
    }

    const percentageClean =
      totalDistance === 0
        ? 100
        : 100 - (contaminatedDistance / totalDistance) * 100;

    return {
      statusCode: 200,
      body: {
        totalDistance,
        contaminatedDistance,
        percentageClean: Number(percentageClean.toFixed(2)),
      },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to calculate water quality" },
    };
  }
}
