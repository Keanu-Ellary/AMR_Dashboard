import {prisma} from "../../lib/db"

function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a = 
        Math.sin(dLat / 2) ** 2 + 
        Math.cos((lat1 * Math.PI) / 180) * 
        Math.cos((lat2 * Math.PI) / 180) * 
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function waterQuality() {
    try {
        const sites = await prisma.siteData.findMany({
            orderBy: {
                latitude: "asc"
            }
        });

        if (sites.length < 2)
        {
            return {
                statusCode: 200,
                body: {percentageClean: 100}
            };
        }

        let totalDistance = 0;
        let contaminatedDistance = 0;

        for (let j = 0; j < sites.length - 1; j++)
        {
            const curr = sites[j];
            const next = sites[j + 1];

            const dist = getDistance(
                curr.latitude,
                curr.longitude,
                next.latitude,
                next.longitude
            );

            totalDistance += dist;

            contaminatedDistance += dist;
        }

        const percentageClean = totalDistance === 0 ? 100 : 100 - ((contaminatedDistance / totalDistance) * 100);

        return {
            statusCode: 200,
            body: {
                totalDistance,
                contaminatedDistance,
                percentageClean: Number(percentageClean.toFixed(2))
            }
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to calculate water quality"}
        }
    }
}