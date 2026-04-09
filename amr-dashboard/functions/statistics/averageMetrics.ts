import {prisma} from "../../lib/db"

export async function averageMetrics() {
    try {
        const sites = await prisma.siteData.findMany({
            select: {
                ph: true,
                temperature: true,
                dissolvedO2: true,
                tds: true,
            }
        });

        let totalpH = 0;
        let totalTemp = 0;
        let totalDiss = 0;
        let totalTDS = 0;

        for (let j = 0; j < sites.length; j++)
        {
            totalpH += sites[j].ph;
            totalTemp += sites[j].temperature;
            totalDiss += sites[j].dissolvedO2;
            totalTDS += sites[j].tds;
        }

        const avgpH = totalpH / sites.length;
        const avgTemp = totalTemp / sites.length;
        const avgDiss = totalDiss / sites.length;
        const avgTDS = totalTDS / sites.length;

        return {
            statusCode: 200,
            body: {
                avgpH,
                avgTemp,
                avgDiss,
                avgTDS
            }
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to calculate averages"}
        };
    }
}