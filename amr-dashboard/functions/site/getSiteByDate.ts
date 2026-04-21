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

                sampleName: true,
                isolationSource: true,
                collectionDate: true,
                geoLocName: true,
                latitude: true,
                longitude: true,
                amrResGenes: true,
                predictedSir: true,
                sampleAnalysisType: true,

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
            }
        });

        return {
            statusCode: 200,
            body: {data}
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch sites by date"}
        };
    }
}