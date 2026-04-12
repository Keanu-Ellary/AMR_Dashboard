import { prisma } from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { timeInUnsafe } from "../statistics/timeInUnsafe";
import { determineDangerZone } from "./uploadSiteData";

export async function updateSite(
    token: string,
    siteId: number,
    updates: {
        // required:
        sampleName?: string,
        isolationSource?: string,
        collectionDate?: Date,
        geoLocName?: string,
        latitude?: number;
        longitude?: number;
        amrResGenes?: string,
        predictedSir?: string,
        sampleAnalysisType?: string,

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

        let dangerZone = siteExists.dangerZone;

        if (updates.ph !== undefined && (updates.ph < 0 || updates.ph > 14))
        {
            return {
                statusCode: 400,
                body: {error: "Invalid pH level"}
            };
        }

        if(updates.predictedSir !== undefined && updates.amrResGenes !== undefined)
        {
            dangerZone = determineDangerZone(updates.predictedSir, updates.amrResGenes);
        } 
        else if (updates.predictedSir === undefined && updates.amrResGenes !== undefined)
        {
            dangerZone = determineDangerZone(siteExists.predictedSir, updates.amrResGenes);
        }
        else if (updates.predictedSir !== undefined && updates.amrResGenes === undefined)
        {
            dangerZone = determineDangerZone(updates.predictedSir, siteExists.amrResGenes);
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

        let totalRedTime = null;
        const timeChange = await timeInUnsafe(siteExists.id);

        if (timeChange.statusCode ===  200)
        {
            totalRedTime = timeChange.body.totalRedTime;
        }

        const siteToUpdate = await prisma.siteData.update({
            where: {id: siteId},
            data: {fieldsToUpdate, dangerZone},
        });

        return {
            statusCode: 200,
            body: {
                siteToUpdate, 
                totalRedTime,
            }
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to update site"}
        };
    }
}