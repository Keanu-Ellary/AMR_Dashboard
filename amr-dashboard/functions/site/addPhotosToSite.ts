import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";

export async function addPhotosToSite(
    token: string,
    siteId: number,
    imagesBase64: string[],
    dateTaken?: string,
    checkAlgae?: boolean
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
        let algaeDetected = false;

        for (const baseString of imagesBase64)
        { 
            const base64Data = baseString.replace(/^data:image\/\w+;base64,/, '');

            if (checkAlgae) {
                try {
                    const lambdaUrl = process.env.ALGAE_DETECTOR_LAMBDA_URL;
                    if (lambdaUrl) {
                        const lambdaResponse = await fetch(lambdaUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ image: base64Data })
                        });
                        
                        if (lambdaResponse.ok) {
                            const result = await lambdaResponse.json();
                            let parsedData = result;
                            if (result.body && typeof result.body === "string") {
                                parsedData = JSON.parse(result.body);
                            }
                            if (parsedData.results && Array.isArray(parsedData.results) && parsedData.results.length > 0) {
                                algaeDetected = true;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error checking algae:", e);
                }
            }

            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `site-${siteId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`

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

        const batch = await prisma.siteImageBatch.create({
            data: {
                siteId,
                dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
                algaeDetected,
                algaeScanRun: checkAlgae ?? false,
            }
        });

        await prisma.siteImage.createMany({
            data: imagesToUpload.map((img) => ({
                url: img.url,
                siteId,
                batchId: batch.id
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