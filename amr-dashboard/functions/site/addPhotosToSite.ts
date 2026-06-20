import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { s3Client, BUCKET, getImageUrl } from "@/lib/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function addPhotosToSite(
    token: string,
    siteId: number,
    imagesBase64: string[],
    dateTaken?: string,
    runAiScan?: boolean
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
        let pollutionDetected = false;

        for (const baseString of imagesBase64)
        { 
            const match = baseString.match(/^data:image\/(\w+);base64,/);
            const imageExtension = match ? match[1] : "jpg";
            const contentType = match ? `image/${match[1]}` : "image/jpeg";
            const base64Data = baseString.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `site-${siteId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${imageExtension}`;

            console.log("base64 length:", base64Data.length);
            console.log("base64 start:", base64Data.substring(0, 50));

            if (runAiScan) {
                try {
                    const lambdaUrl = process.env.AI_CLASSIFIER_LAMBDA_URL || process.env.ALGAE_DETECTOR_LAMBDA_URL;
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
                            if (parsedData.algaeDetected) {
                                algaeDetected = true;
                            }
                            if (parsedData.pollutionDetected) {
                                pollutionDetected = true;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error checking algae:", e);
                }
            }

            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: fileName,
                Body: buffer,
                ContentType: contentType,
            }));

            const url = getImageUrl(fileName);

            imagesToUpload.push({url});
        }

        const batch = await prisma.siteImageBatch.create({
            data: {
                siteId,
                dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
                algaeDetected,
                pollutionDetected,
                aiScanRun: runAiScan ?? false,
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