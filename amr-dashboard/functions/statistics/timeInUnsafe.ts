import {prisma} from "../../lib/db"

export async function timeInUnsafe(siteId: number) {
    try {
        const data = await prisma.siteData.findUnique({
            where: {id: siteId},
            select: {
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

        const now = new Date();
        const timeStartedAtRed = data.createdAt.getTime();
        const timeStoppedRed = now.getTime() - timeStartedAtRed;

        return {
            statusCode: 200,
            body: {
                totalRedTime: timeStoppedRed / (1000 * 60 * 60)
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