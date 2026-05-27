import { prisma } from "../../lib/db";
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";
import { logChange } from "../changelog/changeLog";

function checkSIR(predictedSir: string) {
  if (predictedSir.includes("R")) {
    return "red";
  } else if (predictedSir.includes("I")) {
    return "yellow";
  } else {
    return "green";
  }
}

function checkGene(amrResGenes: string) {
  const redGenes = ["blaNDM-1", "mcr-1", "blaKPC", "vanA", "mecA"];
  const yellowGenes = ["tet(A)", "blaTEM-1", "qnrS1", "erm(B)", "strA"];
  const greenGenes = ["ampC_intrinsic", "acrB", "bacA", "tolC", "merA"];

  if (redGenes.find((gene) => gene === amrResGenes)) {
    return "red";
  } else if (yellowGenes.find((gene) => gene === amrResGenes)) {
    return "yellow";
  } else if (greenGenes.find((gene) => gene === amrResGenes)) {
    return "green";
  }
}

export function determineDangerZone(sir: string, resGene: string) {
  const amrColour = checkSIR(sir);
  const geneColour = checkGene(resGene);
  if (amrColour === "red" || geneColour === "red") {
    return "red";
  } else if (amrColour === "yellow" && geneColour === "yellow") {
    return "yellow";
  } else if (amrColour === "yellow" && geneColour === "green") {
    return "yellow";
  } else if (amrColour === "green" && geneColour === "yellow") {
    return "yellow";
  } else {
    return "green";
  }
}

export async function uploadSiteData(
  token: string,
  data: {
    // required:
    sampleName: string;
    isolationSource: string;
    collectionDate: Date;
    geoLocName: string;
    latitude: number;
    longitude: number;
    amrResGenes: string;
    predictedSir: string;
    sampleAnalysisType: string;

    // optional
    isolateId?: string;
    orgamism?: string;
    sampleId?: string;
    collectedBy?: string;
    sequenceName?: string;
    elementType?: string;
    class?: string;
    subclass?: string;
    targetLength?: number;
    referenceLength?: number;
    coverage?: number;
    identity?: number;
    alignmentLength?: number;
    accession?: string;
    virtulenceGenes?: string;
    plasmidReplicons?: string;
    temperature?: number;
    ph?: number;
    tds?: number;
    ec?: number;
    dissolvedO2?: number;
  },
  imageBase64?: string,
) {
  const authorize = adminNeeded(token);

  if (!authorize.authorized) {
    return {
      statusCode: authorize.statusCode,
      body: { error: authorize.message },
    };
  }

  try {
    if (!authorize.user || !authorize.user.userId) {
      return {
        statusCode: 401,
        body: { error: "Invalid token data" },
      };
    }

    if (data.ph && (data.ph < 0 || data.ph > 14)) {
      throw new Error("Invalid pH level");
    }

    const dangerZone = determineDangerZone(data.predictedSir, data.amrResGenes);

    let imageURL: string | null = null;

    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, "base64");
      const fileName = `site-${Date.now()}.jpg`;

      await minioClient.putObject(BUCKET, fileName, buffer, buffer.length, {
        "Content-Type": "image/jpeg",
      });

      imageURL = `http://127.0.0.1:9000/${BUCKET}/${fileName}`;
    }

    const newSite = await prisma.siteData.create({
      data: {
        ...data,
        dangerZone,
        admin: {
          connect: { id: authorize.user!.userId },
        },
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

    // Log the creation in the change log
    await logChange("SiteData", newSite.id, "CREATE", null, newSite, authorize.user!.userId);

    return {
      statusCode: 201,
      body: { newSite, id: newSite.id },
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: { error: "Failed to upload site data" },
    };
  }
}

export async function uploadMultipleSiteData(token: string, file: File) {
  const fileExtension = file.name
    .slice(file.name.lastIndexOf("."))
    .toLowerCase();

  if (
    fileExtension !== ".csv" &&
    fileExtension !== ".tsv" &&
    fileExtension !== ".json"
  ) {
    return {
      statusCode: 400,
      body: {
        error: "Invalid file type. Only CSV, TSV, and JSON files are allowed.",
      },
    };
  }
  const fileText = await file.text();
  let rows: Record<string, string>[] = [];

  try {
    if (fileExtension === ".csv") {
      const [headerLine, ...dataLines] = fileText.trim().split("\n");
      const headers = headerLine.split(",").map((h) => h.trim());
      rows = dataLines
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          return Object.fromEntries(
            headers.map((h, i) => [h, values[i] ?? ""]),
          );
        });
    } else if (fileExtension === ".tsv") {
      const [headerLine, ...dataLines] = fileText.trim().split("\n");
      const headers = headerLine.split("\t").map((h) => h.trim());
      rows = dataLines
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const values = line.split("\t").map((v) => v.trim());
          return Object.fromEntries(
            headers.map((h, i) => [h, values[i] ?? ""]),
          );
        });
    } else if (fileExtension === ".json") {
      const parsed = JSON.parse(fileText);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    }

    if (rows.length === 0) {
      return {
        statusCode: 400,
        body: { error: "file is empty." },
      };
    }

    const authorize = adminNeeded(token);

    if (!authorize.authorized || !authorize.user || !authorize.user.userId) {
      return {
        statusCode: 401,
        body: { error: "Invalid token data" },
      };
    }

    const siteDataToInsert = rows.map((row) => {
      const dangerZone =
        row.dangerZone ||
        determineDangerZone(row.predictedSir || "", row.amrResGenes || "");

      return {
        sampleName: row.sampleName,
        isolationSource: row.isolationSource,
        collectionDate: new Date(row.collectionDate),
        geoLocName: row.geoLocName,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        amrResGenes: row.amrResGenes,
        predictedSir: row.predictedSir,
        sampleAnalysisType: row.sampleAnalysisType,
        dangerZone: dangerZone as string,
        adminId: authorize.user!.userId,

        ...(row.isolateId && { isolateId: row.isolateId }),
        ...(row.orgamism && { organism: row.orgamism }),
        ...(row.organism && { organism: row.organism }),
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
        ...(row.referenceLength && {
          referenceLength: parseFloat(row.referenceLength),
        }),
        ...(row.alignmentLength && {
          alignmentLength: parseFloat(row.alignmentLength),
        }),
        ...(row.coverage && { coverage: parseFloat(row.coverage) }),
        ...(row.identity && { identity: parseFloat(row.identity) }),
        ...(row.temperature && { temperature: parseFloat(row.temperature) }),
        ...(row.ph && { ph: parseFloat(row.ph) }),
        ...(row.tds && { tds: parseFloat(row.tds) }),
        ...(row.ec && { ec: parseFloat(row.ec) }),
        ...(row.dissolvedO2 && { dissolvedO2: parseFloat(row.dissolvedO2) }),
      };
    });

    const createdSites = await prisma.siteData.createManyAndReturn({
      data: siteDataToInsert,
    });

    // Log grouped bulk ingestion Change Log transaction
    await logChange(
      "SiteData",
      0,
      "BULK_CREATE",
      null,
      createdSites,
      authorize.user!.userId
    );

    return {
      statusCode: 200,
      body: {
        message: `${createdSites.length} uploaded successfully.`,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: { error: "Failed to process CSV file." },
    };
  }
}
