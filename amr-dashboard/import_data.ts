import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting TSV import process...");

  // 1. Find an admin user to link the imported site data rows
  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    console.error("❌ No admin users found in the database. Please run Prisma seed first!");
    process.exit(1);
  }
  console.log(`👤 Linking all imported data to admin: ${admin.name} ${admin.surname} (${admin.email})`);

  // 2. Read the TSV file
  const tsvPath = path.join(process.cwd(), "apies_river_timeseries_2026.tsv");
  if (!fs.existsSync(tsvPath)) {
    console.error(`❌ TSV file not found at: ${tsvPath}. Please run npx tsx generate_data.ts first!`);
    process.exit(1);
  }

  const tsvContent = fs.readFileSync(tsvPath, "utf-8");
  const lines = tsvContent.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    console.error("❌ TSV file is empty or only contains headers.");
    process.exit(1);
  }

  const headers = lines[0].split("\t").map((h) => h.trim());
  console.log("📋 Found TSV headers:", headers);

  // 3. Clear old site data rows to ensure a clean import of isolates
  console.log("🧹 Clearing old site data rows from the database...");
  await prisma.siteData.deleteMany();
  console.log("✅ Database cleared of old site entries.");

  // 4. Parse rows
  const rowsToInsert: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t").map((v) => v.trim());
    if (values.length < headers.length) continue;

    const rowObj: any = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx];
    });

    const parsedRow = {
      adminId: admin.id,
      sampleName: rowObj.sampleName,
      isolationSource: rowObj.isolationSource || "River Water",
      collectionDate: new Date(rowObj.collectionDate),
      geoLocName: rowObj.geoLocName,
      latitude: parseFloat(rowObj.latitude),
      longitude: parseFloat(rowObj.longitude),
      amrResGenes: rowObj.amrResGenes || "",
      predictedSir: rowObj.predictedSir || "Susceptible",
      dangerZone: rowObj.dangerZone || "green",
      sampleAnalysisType: rowObj.sampleAnalysisType || "16S rRNA",
      temperature: rowObj.temperature ? parseFloat(rowObj.temperature) : null,
      ph: rowObj.ph ? parseFloat(rowObj.ph) : null,
      tds: rowObj.tds ? parseInt(rowObj.tds) : null,
      dissolvedO2: rowObj.dissolvedO2 ? parseFloat(rowObj.dissolvedO2) : null,
      ec: rowObj.ec ? parseInt(rowObj.ec) : null,
      isolateId: rowObj.isolateId || null,
      organism: rowObj.organism || null,
      collectedBy: rowObj.collectedBy || "Automated Script",
      sequenceName: rowObj.sequenceName || null,
      coverage: rowObj.coverage ? parseFloat(rowObj.coverage) : null,
    };

    rowsToInsert.push(parsedRow);
  }

  console.log(`📦 Parsing complete. Prepared ${rowsToInsert.length} isolates to insert.`);

  // 5. Chunked insertion to prevent parameter limits
  const chunkSize = 200;
  let insertedCount = 0;

  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    const chunk = rowsToInsert.slice(i, i + chunkSize);
    await prisma.siteData.createMany({
      data: chunk,
    });
    insertedCount += chunk.length;
    console.log(`⚡ Inserted isolates ${insertedCount}/${rowsToInsert.length}...`);
  }

  console.log(`\n🎉 Success! Successfully imported ${insertedCount} multi-isolate water samples into your database!`);
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
