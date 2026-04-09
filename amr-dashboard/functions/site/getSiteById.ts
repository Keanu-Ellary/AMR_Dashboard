import {prisma} from "../../lib/db";

export async function getSiteById(id: number) {
    try {
        const site = await prisma.siteData.findUnique({
            where: {id},
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

        if (!site)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            };
        }

        return {
            statusCode: 200,
            body: {site}
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch site"}
        }
    }
}