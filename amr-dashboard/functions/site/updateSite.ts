import { prisma } from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";

export async function updateSite(
    token: string,
    siteId: number,
    updates: {
        dangerZone?: "red" | "yellow";
        latitude?: number;
        longitude?: number;
        temperature?: number;
        ph?: number;
        tds?: number;
        ec?: number;
        dissolvedO2?: number;
    }
) {
    const authorize = adminNeeded(token);
    
    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        const siteExists = await prisma.siteData.findUnique({
            where: {id: siteId},
        });

        if (!siteExists)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            };
        }

        if (updates.ph !== undefined && (updates.ph < 0 || updates.ph > 14))
        {
            return {
                statusCode: 400,
                body: {error: "Invalid pH level"}
            };
        }

        const fieldsToUpdate = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(fieldsToUpdate).length === 0)
        {
            return {
                statusCode: 400,
                body: {error: "No valid fields provided to update"}
            };
        }

        const siteToUpdate = await prisma.siteData.update({
            where: {id: siteId},
            data: fieldsToUpdate,
        });

        return {
            statusCode: 200,
            body: {siteToUpdate}
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to update site"}
        };
    }
}