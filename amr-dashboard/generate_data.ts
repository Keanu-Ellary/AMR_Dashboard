import * as fs from "fs";
import * as path from "path";

// Accurately matched to your provided CSV locations
const SITES = [
  {
    name: "APR-002",
    geo: "Groenkloof - Apies River",
    lat: -25.78,
    lon: 28.1957,
    basePh: 6.1,
    baseTds: 508,
  },
  {
    name: "APR-003",
    geo: "Pretoria CBD",
    lat: -25.746,
    lon: 28.201,
    basePh: 7.0,
    baseTds: 401,
  },
  {
    name: "APR-004",
    geo: "Pretoria Zoo - Apies River",
    lat: -25.735,
    lon: 28.188,
    basePh: 6.2,
    baseTds: 547,
  },
  {
    name: "APR-005",
    geo: "Wonderboom - Apies River",
    lat: -25.69,
    lon: 28.187,
    basePh: 6.6,
    baseTds: 427,
  },
  {
    name: "APR-006",
    geo: "Pretoria North - Apies River",
    lat: -25.67,
    lon: 28.187,
    basePh: 7.2,
    baseTds: 345,
  },
];

const AMR_PROFILES = [
  { genes: "blaNDM-1, mcr-1", sir: "Resistant", zone: "red" },
  { genes: "vanA, mecA", sir: "Resistant", zone: "red" },
  { genes: "tet(A), blaTEM-1", sir: "Intermediate", zone: "yellow" },
  { genes: "qnrS1, strA", sir: "Intermediate", zone: "yellow" },
  { genes: "ampC_intrinsic", sir: "Susceptible", zone: "green" },
  { genes: "acrB, tolC", sir: "Susceptible", zone: "green" },
];

const ORGANISMS = [
  "E. coli",
  "Klebsiella pneumoniae",
  "Pseudomonas aeruginosa",
  "Enterococcus faecalis",
];

function generateData() {
  const rows: string[] = [];
  const headers = [
    "sampleName",
    "isolationSource",
    "collectionDate",
    "geoLocName",
    "latitude",
    "longitude",
    "amrResGenes",
    "predictedSir",
    "dangerZone",
    "sampleAnalysisType",
    "temperature",
    "ph",
    "tds",
    "dissolvedO2",
    "ec",
    "isolateId",
    "organism",
    "collectedBy",
    "sequenceName",
    "coverage",
  ];

  // CHANGED: Join headers with a tab character
  rows.push(headers.join("\t"));

  const startDate = new Date("2024-01-01T00:00:00Z");
  const weeksToGenerate = 150;

  for (let week = 0; week < weeksToGenerate; week++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + week * 7);
    const dateStr = currentDate.toISOString().split("T")[0];

    const seasonalFactor = Math.cos((week / 52) * 2 * Math.PI);

    SITES.forEach((site, index) => {
      let temp = 22 + seasonalFactor * 6 + (Math.random() * 2 - 1);
      let doValue = 12 - temp * 0.25 + (Math.random() * 1 - 0.5);
      let ph = site.basePh + (Math.random() * 0.4 - 0.2);

      let tds = site.baseTds + Math.random() * site.baseTds * 0.1;
      const isPollutionSpike = Math.random() > 0.9;
      if (isPollutionSpike) tds *= 1.5 + Math.random();
      let ec = tds * 1.55;

      let profileIndex = Math.floor(Math.random() * AMR_PROFILES.length);
      if (site.baseTds > 500 && Math.random() > 0.3) {
        profileIndex = Math.floor(Math.random() * 2);
      }
      const bio = AMR_PROFILES[profileIndex];

      const organism = ORGANISMS[Math.floor(Math.random() * ORGANISMS.length)];
      const isolateId = `ISO-2026-${week}-${index}`;

      const row = [
        site.name,
        "River Water",
        dateStr,
        site.geo,
        site.lat,
        site.lon,
        bio.genes, // CHANGED: Removed manual quotes around genes
        bio.sir,
        bio.zone,
        "16S rRNA",
        temp.toFixed(2),
        ph.toFixed(2),
        Math.round(tds),
        doValue.toFixed(2),
        Math.round(ec),
        isolateId,
        organism,
        "Automated Script",
        `Contig_${week}`,
        (85 + Math.random() * 15).toFixed(1),
      ];

      // CHANGED: Join row with a tab character
      rows.push(row.join("\t"));
    });
  }

  const fileContent = rows.join("\n");
  // CHANGED: Output as a .tsv file
  const outputPath = path.join(
    process.cwd(),
    "apies_river_timeseries_2026.tsv",
  );
  fs.writeFileSync(outputPath, fileContent);
  console.log(
    `✅ Generated ${weeksToGenerate * SITES.length} rows of strictly-located time-series data!`,
  );
  console.log(`📂 Saved to: ${outputPath}`);
}

generateData();
