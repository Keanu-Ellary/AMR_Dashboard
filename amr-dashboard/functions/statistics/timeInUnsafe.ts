import {prisma} from "../../lib/db"

export async function timeInUnsafe(siteId: number) {
    try {
        const data = await prisma.siteData.findUnique({
            where: {id: siteId},
            select: {
                dangerZone: true,
                createdAt: true
           }
        });

        if (!data)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            }
        };

        if (data.dangerZone === "red") {
            const now = new Date();
            const timeInRedZone = now.getTime() - data.createdAt.getTime();
            
            return {
                statusCode: 200,
                body: {
                    totalRedTime: timeInRedZone / (1000 * 60 * 60)
                }
            };
        }

        return {
            statusCode: 200,
            body: {
                totalRedTime: 0
            }
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to calculate"}
        };
    }
}