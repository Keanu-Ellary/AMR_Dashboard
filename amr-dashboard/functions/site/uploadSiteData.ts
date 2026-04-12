import {prisma} from "../../lib/db"
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";

function checkSIR(predictedSir: string)
{
    if(predictedSir.includes("R"))
    {
        return "red"
    }
    else if (predictedSir.includes("I"))
    {
        return "yellow"
    }
    else
    {
        return "green"
    }
}

function checkGene(amrResGenes:string) 
{
    const redGenes = ["blaNDM-1", "mcr-1", "blaKPC", "vanA", "mecA"];
    const yellowGenes = ["tet(A)", "blaTEM-1", "qnrS1", "erm(B)", "strA"];
    const greenGenes = ["ampC_intrinsic", "acrB", "bacA", "tolC", "merA"];

    if (redGenes.find((gene) => gene === amrResGenes))
    {
        return "red"
    }
    else if (yellowGenes.find((gene) => gene ===  amrResGenes))
    {
        return "yellow";
    }
    else if (greenGenes.find((gene) => gene ===  amrResGenes))
    {
        return "green"
    }
}

export function determineDangerZone(sir:string, resGene: string) {
    const amrColour = checkSIR(sir);
    const geneColour = checkGene(resGene);
    if (amrColour === "red" || geneColour === "red")
    {
        return "red"
    }
    else if (amrColour === "yellow" && geneColour === "yellow")
    {
        return "yellow"
    }
    else if (amrColour === "yellow" && geneColour === "green")
    {
        return "yellow"
    }
    else if (amrColour === "green" && geneColour === "yellow")
    {
        return "yellow"
    }
    else 
    {
        return "green"
    }
}

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

        const dangerZone = determineDangerZone(data.predictedSir, data.amrResGenes);

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
                dangerZone,
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

export async function uploadMultipleSiteData(token: string, file: File) {
    
    if (file.type !== "text/csv" && file.type !== "text/tsv" && file.type !== "application/json") {
        return {
            statusCode: 400,
            body: {error: "Invalid file type. Only CSV, TSV, and JSON files are allowed."}
        };
    }

    const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const fileText = await file.text();
    let rows: Record<string, string>[] = [];

    try {

        if (fileExtension === ".csv") {
            const [headerLine, ...dataLines] = fileText.trim().split("\n");
            const headers = headerLine.split(",").map(h => h.trim());
            rows = dataLines
                .filter(line => line.trim() !== "")
                .map(line => {
                    const values = line.split(",").map(v => v.trim());
                    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
                });

        } else if (fileExtension === ".tsv") {
            const [headerLine, ...dataLines] = fileText.trim().split("\n");
            const headers = headerLine.split("\t").map(h => h.trim()); 
            rows = dataLines
                .filter(line => line.trim() !== "")
                .map(line => {
                    const values = line.split("\t").map(v => v.trim());
                    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
                });

        } else if (fileExtension === ".json") {
            const parsed = JSON.parse(fileText);
            rows = Array.isArray(parsed) ? parsed : [parsed];
        }

        if (rows.length === 0) {
            return {
                statusCode: 400,
                body: { error: "file is empty." }
            };
        }

        const uploadResponses = [];

        for (const row of rows) {
            const res = await uploadSiteData(token, {
                sampleName: row.sampleName,
                isolationSource: row.isolationSource,
                collectionDate: new Date(row.collectionDate),
                geoLocName: row.geoLocName,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                amrResGenes: row.amrResGenes,
                predictedSir: row.predictedSir,
                sampleAnalysisType: row.sampleAnalysisType,

                ...(row.dangerZone && { dangerZone: row.dangerZone as "red" | "yellow"}),
                ...(row.isolateId && { isolateId: row.isolateId }),
                ...(row.orgamism && { orgamism: row.orgamism }),
                ...(row.sampleId && { sampleId: row.sampleId }),
                ...(row.collectedBy && { collectedBy: row.collectedBy }),
                ...(row.sequenceName && { sequenceName: row.sequenceName }),
                ...(row.elementType && { elementType: row.elementType }),
                ...(row.class && { class: row.class }),
                ...(row.subclass && { subclass: row.subclass }),
                ...(row.accession && { accession: row.accession }),
                ...(row.virtulenceGenes && { virtulenceGenes: row.virtulenceGenes }),
                ...(row.plasmidReplicons && { plasmidReplicons: row.plasmidReplicons }),
                ...(row.targetLength && { targetLength: parseFloat(row.targetLength) }),
                ...(row.referenceLength && { referenceLength: parseFloat(row.referenceLength) }),
                ...(row.alignmentLength && { alignmentLength: parseFloat(row.alignmentLength) }),
                ...(row.coverage && { coverage: parseFloat(row.coverage) }),
                ...(row.identity && { identity: parseFloat(row.identity) }),
                ...(row.temperature && { temperature: parseFloat(row.temperature) }),
                ...(row.ph && { ph: parseFloat(row.ph) }),
                ...(row.tds && { tds: parseFloat(row.tds) }),
                ...(row.ec && { ec: parseFloat(row.ec) }),
                ...(row.dissolvedO2 && { dissolvedO2: parseFloat(row.dissolvedO2) }),
            });

            uploadResponses.push({ sampleName: row.sampleName, ...res });
        }

        const failedResponses = uploadResponses.filter(r => r.statusCode !== 201);
        const successfulResponses = uploadResponses.filter(r => r.statusCode === 201);

        if (failedResponses.length === uploadResponses.length) {
            return {
                statusCode: 400,
                message: "Failed to upload.",
            }
        }

        return {
            statusCode: 200,
            body: {
                message: `${successfulResponses.length} uploaded successfully, ${failedResponses.length} failed.`,
                succeeded: successfulResponses,
                failed: failedResponses
            }
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: { error: "Failed to process CSV file." }
        };
    }
}
