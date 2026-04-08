import {prisma} from "../../lib/db";

export async function getSiteById(id: number) {
    try {
        const site = await prisma.siteData.findUnique({
            where: {id},
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
                images: true,
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
            body: site
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch site"}
        }
    }
}