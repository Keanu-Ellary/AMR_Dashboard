import {prisma} from "../../lib/db";

export async function getAllSites() {
    try {
        const sites = await prisma.siteData.findMany({
            select: {
                id: true,
                dangerZone: true,
                latitude: true,
                longitude: true,
                temperature: true,
                tds: true,
                ph: true,
                dissolvedO2: true,
                ec: true,
                createdAt: true,
                images: {
                    select: {
                        url: true,
                    }
                },
            },
        });

        return {
            statusCode: 200,
            body: sites
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch sites"}
        }
    }
}