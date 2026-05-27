import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";
import { logChange } from "../changelog/changeLog";

export async function deleteSite(token: string, siteId: number) {
    const authorize = adminNeeded(token);
    
    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        const site = await prisma.siteData.findUnique({
            where: {id: siteId},
            include: {images: true},
        });

        if (!site)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            };
        }

        const objectNames = site.images.map((image) => {
            const parts = image.url.split("/");
            return parts[parts.length - 1];
        });

        if (objectNames.length > 0)
        {
            await minioClient.removeObjects(BUCKET, objectNames);
        }

        await prisma.siteData.delete({
            where: {id: siteId},
        });

        // Log the deletion in changelog
        await logChange("SiteData", siteId, "DELETE", site, null, authorize.user!.userId);

        return {
            statusCode: 200,
            body: {message: "Site successfully deleted"}
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to delete site"}
        };
    }
}