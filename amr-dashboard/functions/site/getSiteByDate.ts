import {prisma} from "../../lib/db";

export async function getSiteByDate(params: {
    startDate: Date;
    endDate: Date;
}) {
    try {
        const data = await prisma.siteData.findMany({
            where: {
                createdAt: {
                    gte: params.startDate,
                    lte: params.endDate
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
            body: {error: "Failed to fetch sites by date"}
        };
    }
}