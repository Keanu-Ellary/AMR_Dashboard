import { data } from "autoprefixer";
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
    collectionDate: Date | null;
    geoLocName: string | null;
    latitude: number | null;
    longitude: number | null;
    amrResGenes: string | null;
    predictedSir: string | null;
    sampleAnalysisType: string;

    // optional
    isolateId?: string;
    organism?: string;
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

    if (data.isolationSource == null || data.isolationSource == undefined || data.isolationSource == "") {
      data.isolationSource = "Missing";
    }
    if (data.amrResGenes == null || data.amrResGenes == undefined || data.amrResGenes=="") {
      data.amrResGenes = "Not collected";
    }
    if (data.predictedSir == null || data.predictedSir == undefined || data.predictedSir == "") {
      data.predictedSir = "Not collected";
    }
    if (data.geoLocName == null || data.geoLocName == undefined || data.geoLocName=="") {
      data.geoLocName = "Missing";
    }
    const geoLocName = data.geoLocName ?? "Missing";
    const isolationSource = data.isolationSource ?? "Missing";
    const amrResGenes = data.amrResGenes ?? "Not collected";
    const predictedSir = data.predictedSir ?? "Not collected";

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
        geoLocName,
        isolationSource,
        amrResGenes,
        predictedSir,
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

function parseDelimitedText(fileText: string, delimiter: string): Record<string, string>[] {
  const cleanedText = fileText.replace(/^\uFEFF/, "");
      const lines = cleanedText
        .split("\n")
        .map((l) => {
          if (l.endsWith("\r")) l = l.slice(0, -1);
            return l.trim();
        })
        .map((l) => {
          if (l.startsWith("\uFEFF")) l = l.slice(1);
            return l;
        })
        .filter((l) => {
          if (l === "") return false;
          if (l.startsWith("#")) return false;
          if (l.split(";").join("").trim() === "") return false;
          return true;
        });

      if (lines.length < 2) {
        return [];
      }

      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(delimiter).map((h) => h.trim());
      return dataLines.map((line) => {
        const values = line.split(delimiter).map((v) => v.trim());
        return Object.fromEntries(
            headers.map((h, i) => [h, values[i] ?? ""]),
          );
      })
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
      const firstDataLine = fileText
        .replace(/^\uFEFF/,"")
        .split("\n")
        .map((line) => line.replace(/\r$/, ""). trim())
        .find((line) => line !== "" && !line.startsWith("#") && line.split(";").join("").trim() !== "");
      const delimiterUsed = firstDataLine?.includes(";") ? ";" : ",";
      rows = parseDelimitedText(fileText, delimiterUsed);

    } else if (fileExtension === ".tsv") {
      rows = parseDelimitedText(fileText, "\t");

    } else if (fileExtension === ".json") {
      const parsed = JSON.parse(fileText.replace(/^\uFEFF/,""));
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      const hasExcelArtifacts = dataArray.some((obj) => Object.keys(obj).some((index) => index === "__EMPTY" || index.startsWith("__EMPTY")));
      
      if (hasExcelArtifacts) {
        const headerRowIndex = dataArray.findIndex((obj) => Object.values(obj).some(
          (val) => typeof val === "string" && (val.trim() === "*Sample_name" || val.trim() === "Sample_name")
        ))
        if (headerRowIndex === -1) {
          return {
            statusCode: 400,
            body: { error: "Could not find header row in JSON file."}
          };
        }
        const headerRow = dataArray[headerRowIndex]
        const keyMap: Record<string, string> = {};
        for (const [index, val] of Object.entries(headerRow)) {
          if (typeof val === "string" && !val.startsWith("#")) {
            keyMap[index] = val.trim();
          }
        }
        rows = dataArray
          .slice(headerRowIndex +1)
          .map((obj) => {
            const remapped: Record<string, string> = {};
            for (const [index, val] of Object.entries(obj)) {
              const realName = keyMap[index];
              if (realName) {
                remapped[realName] = val == null ? "" : String(val);
              }
            }
            return remapped;
          })
          .filter((row) => Object.keys(row).length > 0);

      } else {
        rows = dataArray.map((obj: Record<string, unknown>) => {
          const stringiedObject: Record<string, string> = {};
          for (const [index, val] of Object.entries(obj)) {
            stringiedObject[index] = val == null ? "" : String(val);
          }
          return stringiedObject;
        });
      }
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
        determineDangerZone(row['Predicted_SIR profile'] || "", row['AMR_Resistance_genes'] || "");

      const parseDate = (val: string) => {
        if (!val) return null;
        const parts = val.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
        }
        return new Date(val);
      };

      const parseNullableFields = (val: string) => {
        const tempVal = parseFloat((val ?? "").replace(",","."));
        return isNaN(tempVal) ? null : tempVal;
      }

      return {
        sampleName: row['*Sample_name'] || row['Sample_name'] || "Missing",
        isolationSource: row['Isolation source'] || "Missing",
        collectionDate: parseDate(row['Collection date']),
        geoLocName: row['*geo_loc_name'] || row['geo_loc_name'] || "Missing",
        latitude: parseNullableFields(row['latitude']) || null,
        longitude: parseNullableFields(row['longitude']) || null,
        amrResGenes: row['AMR_Resistance_genes'] || "Not collected",
        predictedSir: row['Predicted_SIR profile'] || "Not collected",
        sampleAnalysisType: row['*Sample_Analysis_Type'] || row['Sample_Analysis_Type'] || "Not collected",
        dangerZone: dangerZone as string,
        adminId: authorize.user!.userId,

        ...((row['Isolate ID'] || row['isolateId']) && { isolateId: row['Isolate ID'] || row['isolateId'] }),
        ...((row['Organism'] || row['organism'] || row['organism']) && { organism: row['Organism'] || row['organism'] || row['organism'] }),
        ...((row['Sample ID'] || row['sampleId']) && { sampleId: row['Sample ID'] || row['sampleId'] }),
        ...((row['Collected by'] || row['collectedBy']) && { collectedBy: row['Collected by'] || row['collectedBy'] }),
        ...((row['Sequence Name'] || row['sequenceName']) && { sequenceName: row['Sequence Name'] || row['sequenceName'] }),
        ...((row['Element type'] || row['elementType']) && { elementType: row['Element type'] || row['elementType'] }),
        ...((row['Class'] || row['class']) && { class: row['Class'] || row['class'] }),
        ...((row['Subclass'] || row['subclass']) && { subclass: row['Subclass'] || row['subclass'] }),
        ...((row['Accession of closest sequence'] || row['accession']) && { accession: row['Accession of closest sequence'] || row['accession'] }),
        ...((row['Virulence_genes'] || row['virtulenceGenes']) && { virtulenceGenes: row['Virulence_genes'] || row['virtulenceGenes'] }),
        ...((row['Plasmid_replicons'] || row['plasmidReplicons']) && { plasmidReplicons: row['Plasmid_replicons'] || row['plasmidReplicons'] }),
        ...((row['Target length'] || row['targetLength']) && { targetLength: parseNullableFields(row['Target length'] || row['targetLength']) ?? undefined }),
        ...((row['Reference sequence length'] || row['referenceLength']) && {
          referenceLength: parseNullableFields(row['Reference sequence length'] || row['referenceLength']) ?? undefined,
        }),
        ...((row['Alignment length'] || row['alignmentLength']) && {
          alignmentLength: parseNullableFields(row['Alignment length'] || row['alignmentLength']) ?? undefined,
        }),
        ...((row['% Coverage of reference sequence'] || row['coverage']) && { coverage: parseNullableFields(row['% Coverage of reference sequence'] || row['coverage']) ?? undefined }),
        ...((row['% Identity to reference sequence'] || row['identity']) && { identity: parseNullableFields(row['% Identity to reference sequence'] || row['identity']) ?? undefined }),
        ...((row['Temp of water'] || row['temperature']) && { temperature: parseNullableFields(row['Temp of water'] || row['temperature']) ?? undefined }),
        ...((row['pH'] || row['ph']) && { ph: parseNullableFields(row['pH'] || row['ph']) ?? undefined }),
        ...((row['TDS (mg/L)'] || row['tds']) && { tds: parseNullableFields(row['TDS (mg/L)'] || row['tds']) ?? undefined }),
        ...((row['ec'] || row['EC']) && { ec: parseNullableFields(row['ec'] || row['EC']) ?? undefined }),
        ...((row['Dissolved Oxygen (mg/L)'] || row['dissolvedO2']) && { dissolvedO2: parseNullableFields(row['Dissolved Oxygen (mg/L)'] || row['dissolvedO2']) ?? undefined }),
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
