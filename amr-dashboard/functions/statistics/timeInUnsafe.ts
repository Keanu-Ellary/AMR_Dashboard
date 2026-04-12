import {prisma} from "../../lib/db"

export async function timeInUnsafe(siteId: number) {
    try {
        const data = await prisma.siteData.findUnique({
            where: {id: siteId},
            select: {
                createdAt: true,
                dangerZone: true,
           }
        });

        if (!data)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            }
        };

        if (data.dangerZone === "red")
        {
            return {
                statusCode: 404,
                body: {error: "Site is still red"}
            };
        }

        const now = new Date();
        const timeStartedAtRed = data.createdAt.getTime();
        const timeStoppedRed = now.getTime() - timeStartedAtRed;

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