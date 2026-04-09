import {prisma} from "../../lib/db"

export async function anomaliesPerSite() {
    try {
        const sites = await prisma.siteData.findMany({
            orderBy: {createdAt: "asc"}
        });

        const anomalies = [];

        for (let j = 0; j < sites.length; j++)
        {
            const prevSite = sites[j - 1];
            const currSite = sites[j];

            const jumpTemp = Math.abs(currSite.temperature - prevSite.temperature);
            const jumppH = Math.abs(currSite.ph - prevSite.ph);
            const jumpTDS = Math.abs(currSite.tds - prevSite.tds);

            if (jumpTemp > 5)
            {
                anomalies.push({
                    id: currSite.id,
                    issues: "Sudden temperature change",
                    changes: jumpTemp
                });
            }

            if (jumppH > 5)
            {
                anomalies.push({
                    id: currSite.id,
                    issues: "Sudden pH change",
                    changes: jumppH
                });
            }

            if (jumpTDS > 5)
            {
                anomalies.push({
                    id: currSite.id,
                    issues: "Sudden TDS change",
                    changes: jumpTDS
                });
            }
        }

        return {
            statusCode: 200,
            body: anomalies
        }
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to get anomalies"}
        };
    }
}

export async function anomalyUpdateCheck(siteId: number, data: {
    newTemp: number,
    newpH: number,
    newTDS: number
}) {
    try {
        const site = await prisma.siteData.findUnique({
            where: {id: siteId},
            select: {
                temperature: true,
                ph: true,
                tds: true,
            }
        });

        if (!site)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            };
        }

        const jumpTemp = Math.abs(data.newTemp - site.temperature);
        const jumppH = Math.abs(data.newpH - site.ph);
        const jumpTDS = Math.abs(data.newTDS - site.tds);

        const anomalies = [];

        if (jumpTemp > 5)
        {
            anomalies.push({
                id: siteId,
                issue: "Sudden temperature jump",
                changes: jumpTemp,
            });
        }

        if (jumppH > 2)
        {
            anomalies.push({
                id: siteId,
                issue: "Sudden pH jump",
                changes: jumppH,
            });
        }

        if (jumpTDS > 200)
        {
            anomalies.push({
                id: siteId,
                issue: "Sudden TDS jump",
                changes: jumpTDS,
            });
        }

        return {
            statusCode: 200,
            body: anomalies
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to get anomalies"}
        };
    }
}