import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";

export async function addPhotosToSite(
    token: string,
    siteId: number,
    imagesBase64: string[]
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
        const site = await prisma.siteData.findUnique({
            where: {id: siteId},
        });

        if (!site)
        {
            return {
                statusCode: 404,
                body: {error: "Site not found"}
            };
        }

        if (imagesBase64.length === 0)
        {
            return {
                statusCode: 404,
                body: {error: "There are no images to add"}
            };
        }

        const imagesToUpload = [];

        for (const baseString of imagesBase64)
        { 
            const base64Data = baseString.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `site-${siteId}-${Date.now()}.jpg`

            await minioClient.putObject(
                BUCKET,
                fileName,
                buffer,
                buffer.length,
                {
                    "Content-Type": "image/jpeg",
                }
            );

            const url = `http://127.0.0.1:9000/${BUCKET}/${fileName}`;

            imagesToUpload.push({url});
        }

        await prisma.siteImage.createMany({
            data: imagesToUpload.map((img) => ({
                url: img.url,
                siteId,
            }))
        });

        return {
            statusCode: 200,
            body: {message: "Images added successfully"}
        }
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to add images"}
        }
    }
}