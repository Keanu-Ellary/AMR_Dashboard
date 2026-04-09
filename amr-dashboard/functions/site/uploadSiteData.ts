import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";

export async function uploadSiteData(token: string, 
    data: {
        // required:
        sampleName: string,
        isolationSource: string,
        collectionDate: Date,
        geoLocName: string,
        latitude: number;
        longitude: number;
        amrResGenes: string,
        predictedSir: string,
        sampleAnalysisType: string,

        // optional
        isolateId?: string,
        orgamism?: string,
        sampleId?: string,
        collectedBy?: string,
        sequenceName?: string,
        elementType?: string,
        class?: string,
        subclass?: string,
        targetLength?: number,
        referenceLength?: number,
        coverage?: number,
        identity?: number,
        alignmentLength?: number,
        accession?: string,
        virtulenceGenes?: string,
        plasmidReplicons?: string,
        temperature?: number;
        ph?: number;
        tds?: number;
        ec?: number;
        dissolvedO2?: number;
        
        // extra
        dangerZone?: "red" | "yellow";
    },
    imageBase64?: string
) {
    const authorize = adminNeeded(token);
    
    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try 
    {
        if (!authorize.user || !authorize.user.userId)
        {
            return {
                statusCode: 401,
                body: {error: "Invalid token data"}
            };
        }

        if (data.ph && (data.ph < 0 || data.ph > 14))
        {
            throw new Error("Invalid pH level");
        }

        let imageURL: string | null = null;

        if (imageBase64)
        {
            const buffer = Buffer.from(imageBase64, "base64");
            const fileName = `site-${Date.now()}.jpg`;

            await minioClient.putObject(
                BUCKET,
                fileName,
                buffer,
                buffer.length,
                {
                    "Content-Type": "image/jpeg",
                }
            );

            imageURL = `http://127.0.0.1:9000/${BUCKET}/${fileName}`;
        }

        const newSite = await prisma.siteData.create({
            data: {
                ...data,
                adminId: authorize.user.userId,
                images: imageURL
                ? {
                    create: [
                        {
                            url: imageURL,
                        },
                    ],
                }
                : undefined,
            },
        });

        return {
            statusCode: 201,
            body: {newSite}
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to upload site data"}
        };
    }
}