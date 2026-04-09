import {prisma} from "../../lib/db";

export async function getSiteByLocation(params: {
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
}) {
    try {
        const data = await prisma.siteData.findMany({
            where: {
                latitude: {
                    gte: params.minLat,
                    lte: params.maxLat,
                },
                longitude: {
                    gte: params.minLong,
                    lte: params.maxLong,
                }
            },
            orderBy: {"createdAt": "desc"},
            select: {
                id: true,
                dangerZone: true,
                latitude: true,
                longitude: true,
                temperature: true,
                ph: true,
                tds: true,
                ec: true,
                dissolvedO2: true,
                createdAt: true,
            }
        });

        return {
            statusCode: 200,
            body: data
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch sites by location"}
        };
    }
}