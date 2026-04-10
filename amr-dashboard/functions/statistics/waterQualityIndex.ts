import {prisma} from "../../lib/db"

export async function WQI() {
    try {
        const sites = await prisma.siteData.findMany();

        const results = sites.map(site => {
            if (!site.ph || !site.dissolvedO2 || !site.tds || !site.ec) {
                return {
                    id: site.id,
                    WQI: null
                };
            }
            const score = 
                0.25 * (14 - Math.abs(7 - site.ph)) +
                0.25 * site.dissolvedO2 + 
                0.25 * (1 / (site.tds + 1)) * 100 +
                0.25 * (1 / (site.ec + 1)) * 100;

            return {
                id: site.id,
                WQI: Number(score.toFixed(2))
            };
        });

        return {
            statusCode: 200,
            body: results
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to calcuate WQI"}
        };
    }
}