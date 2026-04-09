import {prisma} from "../../lib/db";

export async function getSiteByZone(
    zone:"red" | "yellow"
) {
    try {
        const data = await prisma.siteData.findMany({
            where: {dangerZone: zone},
            orderBy: {createdAt: "desc"},
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
            },
            take: 3
        });

        return {
            statusCode: 200,
            body: data
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch sites"}
        };
    }
}