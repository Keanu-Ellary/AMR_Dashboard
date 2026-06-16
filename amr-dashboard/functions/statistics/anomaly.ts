import { prisma } from "../../lib/db";

export async function anomaliesPerSite() {
  try {
    const sites = await prisma.siteData.findMany({
      orderBy: { createdAt: "asc" },
    });

    const anomalies = [];
    const siteGroups = new Map<string, typeof sites>();

    for (const site of sites) {
      const loc = site.geoLocName || `${site.latitude},${site.longitude}`;
      if (!siteGroups.has(loc)) {
        siteGroups.set(loc, []);
      }
      siteGroups.get(loc)!.push(site);
    }

    for (const [loc, locSites] of siteGroups.entries()) {
      for (let j = 1; j < locSites.length; j++) {
        const prevSite = locSites[j - 1];
        const currSite = locSites[j];

        if (
          prevSite.temperature == null ||
          currSite.temperature == null ||
          prevSite.ph == null ||
          currSite.ph == null ||
          prevSite.tds == null ||
          currSite.tds == null ||
          prevSite.dissolvedO2 == null ||
          currSite.dissolvedO2 == null
        ) {
          continue;
        }

        const jumpTemp = Math.abs(currSite.temperature - prevSite.temperature);
        const jumppH = Math.abs(currSite.ph - prevSite.ph);
        const jumpTDS = Math.abs(currSite.tds - prevSite.tds);
        const jumpDO = Math.abs(currSite.dissolvedO2 - prevSite.dissolvedO2);

        if (jumpTemp > 3) {
          anomalies.push({
            id: currSite.id,
            sampleName: currSite.sampleName,
            issues: "Sudden temperature change",
            changes: jumpTemp,
          });
        }

        if (jumppH > 1.0) {
          anomalies.push({
            id: currSite.id,
            sampleName: currSite.sampleName,
            issues: "Sudden pH change",
            changes: jumppH,
          });
        }

        if (jumpTDS > 50) {
          anomalies.push({
            id: currSite.id,
            sampleName: currSite.sampleName,
            issues: "Sudden TDS change",
            changes: jumpTDS,
          });
        }

        if (jumpDO > 2.0) {
          anomalies.push({
            id: currSite.id,
            sampleName: currSite.sampleName,
            issues: "Sudden DO change",
            changes: jumpDO,
          });
        }
      }
    }

    return {
      statusCode: 200,
      body: { anomalies },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to get anomalies" },
    };
  }
}

export async function anomalyUpdateCheck(
  siteId: number,
  data: {
    newTemp: number;
    newpH: number;
    newTDS: number;
  },
) {
  try {
    const site = await prisma.siteData.findUnique({
      where: { id: siteId },
      select: {
        temperature: true,
        ph: true,
        tds: true,
      },
    });

    if (!site) {
      return {
        statusCode: 404,
        body: { error: "Site not found" },
      };
    }

    if (site.temperature == null || site.ph == null || site.tds == null) {
      throw new Error("Fields are empty. Cannot perform function");
    }

    const jumpTemp = Math.abs(data.newTemp - site.temperature);
    const jumppH = Math.abs(data.newpH - site.ph);
    const jumpTDS = Math.abs(data.newTDS - site.tds);

    const anomalies = [];

    if (jumpTemp > 5) {
      anomalies.push({
        id: siteId,
        issue: "Sudden temperature jump",
        changes: jumpTemp,
      });
    }

    if (jumppH > 5) {
      anomalies.push({
        id: siteId,
        issue: "Sudden pH jump",
        changes: jumppH,
      });
    }

    if (jumpTDS > 200) {
      anomalies.push({
        id: siteId,
        issue: "Sudden TDS jump",
        changes: jumpTDS,
      });
    }

    return {
      statusCode: 200,
      body: { anomalies },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to get anomalies" },
    };
  }
}

export async function anomalyForSite(siteId: number) {
  try {
    const sites = await prisma.siteData.findMany({
      where: { id: { lte: siteId } },
      orderBy: { createdAt: "asc" },
    });

    const anomalies = [];

    for (let j = 1; j < sites.length; j++) {
      const prevSite = sites[j - 1];
      const currSite = sites[j];

      // Only check anomalies for the specific site
      if (currSite.id !== siteId) continue;

      if (
        prevSite.temperature == null ||
        currSite.temperature == null ||
        prevSite.ph == null ||
        currSite.ph == null ||
        prevSite.tds == null ||
        currSite.tds == null
      ) {
        continue;
      }

      const jumpTemp = Math.abs(currSite.temperature - prevSite.temperature);
      const jumppH = Math.abs(currSite.ph - prevSite.ph);
      const jumpTDS = Math.abs(currSite.tds - prevSite.tds);

      if (jumpTemp > 5) {
        anomalies.push({
          id: currSite.id,
          issues: "Sudden temperature change",
          changes: jumpTemp,
        });
      }

      if (jumppH > 5) {
        anomalies.push({
          id: currSite.id,
          issues: "Sudden pH change",
          changes: jumppH,
        });
      }

      if (jumpTDS > 5) {
        anomalies.push({
          id: currSite.id,
          issues: "Sudden TDS change",
          changes: jumpTDS,
        });
      }
    }

    return {
      statusCode: 200,
      body: anomalies,
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to get anomalies for site" },
    };
  }
}
