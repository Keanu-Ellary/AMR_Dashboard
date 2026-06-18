import { prisma } from "@/lib/db";
import { waterQualityIndex } from "@/functions/statistics/waterQualityIndex";
import { anomaliesPerSite, anomalyUpdateCheck } from "@/functions/statistics/anomaly";

describe("Statistics and Aggregation Integration Tests", () => {
  let adminId: number;

  beforeEach(async () => {
    // Truncate tables to ensure database is clean before each test
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`
    );

    // Create an admin user for this test run
    const admin = await prisma.adminUser.create({
      data: {
        name: "Test",
        surname: "Admin",
        email: "test.admin@example.com",
        password: "password123",
        isAdmin: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Water Quality Index (WQI)", () => {
    it("should calculate correct WQI when all required fields are present", async () => {
      // Create a site with optimal values
      const site = await prisma.siteData.create({
        data: {
          sampleName: "Optimal Site",
          isolationSource: "River",
          collectionDate: new Date(),
          geoLocName: "Pretoria",
          latitude: -25.7,
          longitude: 28.2,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          sampleAnalysisType: "Genomic",
          dangerZone: "green",
          adminId,
          ph: 7.2,           // Normalizes to 100
          dissolvedO2: 9.0,  // Normalizes to 100
          temperature: 20.0, // Normalizes to 100
          tds: 40.0,         // Normalizes to 100
        },
      });

      const res = await waterQualityIndex(site.id);
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(site.id);
      expect(res.body.results[0].WQI).toBe(100);
    });

    it("should return an error when required fields are missing", async () => {
      // Create a site with missing ph
      const site = await prisma.siteData.create({
        data: {
          sampleName: "Incomplete Site",
          isolationSource: "River",
          collectionDate: new Date(),
          geoLocName: "Johannesburg",
          latitude: -26.2,
          longitude: 28.0,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          dangerZone: "green",
          sampleAnalysisType: "Genomic",
          adminId,
          ph: null, // missing ph
          dissolvedO2: 9.0,
          temperature: 20.0,
          tds: 40.0,
        },
      });

      const res = await waterQualityIndex(site.id);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Failed to calculate WQI");
    });
  });

  describe("Anomaly Detection", () => {
    it("should detect a sudden temperature and pH change between sequential site data points", async () => {
      // Create two sequential site readings at the same geo location
      const site1 = await prisma.siteData.create({
        data: {
          sampleName: "Reading 1",
          isolationSource: "Lake",
          collectionDate: new Date("2026-06-01T10:00:00Z"),
          geoLocName: "Lake V",
          latitude: -25.0,
          longitude: 27.5,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          dangerZone: "green",
          sampleAnalysisType: "Genomic",
          adminId,
          ph: 7.0,
          temperature: 15.0,
          tds: 100.0,
          dissolvedO2: 8.0,
          createdAt: new Date("2026-06-01T10:00:00Z"),
        },
      });

      const site2 = await prisma.siteData.create({
        data: {
          sampleName: "Reading 2",
          isolationSource: "Lake",
          collectionDate: new Date("2026-06-01T11:00:00Z"),
          geoLocName: "Lake V",
          latitude: -25.0,
          longitude: 27.5,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          dangerZone: "yellow",
          sampleAnalysisType: "Genomic",
          adminId,
          ph: 9.0,         // Jump of 2.0 (Threshold: 1.0)
          temperature: 20.0, // Jump of 5.0 (Threshold: 3.0)
          tds: 110.0,        // Jump of 10.0 (Threshold: 50.0)
          dissolvedO2: 7.5,  // Jump of 0.5 (Threshold: 2.0)
          createdAt: new Date("2026-06-01T11:00:00Z"),
        },
      });

      const res = await anomaliesPerSite();
      expect(res.statusCode).toBe(200);
      const anomalies = res.body.anomalies;

      // Expect sudden temperature change and sudden pH change anomalies
      expect(anomalies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: site2.id,
            issues: "Sudden temperature change",
          }),
          expect.objectContaining({
            id: site2.id,
            issues: "Sudden pH change",
          }),
        ])
      );

      // Verify that tds and DO did not trigger anomalies (they are below thresholds)
      expect(anomalies).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: site2.id,
            issues: "Sudden TDS change",
          }),
        ])
      );
    });

    it("should check update anomalies against current site state", async () => {
      const site = await prisma.siteData.create({
        data: {
          sampleName: "Original Site",
          isolationSource: "Well",
          collectionDate: new Date(),
          geoLocName: "Well A",
          latitude: -25.1,
          longitude: 27.6,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          dangerZone: "green",
          sampleAnalysisType: "Genomic",
          adminId,
          ph: 7.0,
          temperature: 20.0,
          tds: 100.0,
          dissolvedO2: 8.0,
        },
      });

      const res = await anomalyUpdateCheck(site.id, {
        newTemp: 26.0, // Jump of 6.0 (Threshold: 5.0)
        newpH: 7.5,    // Jump of 0.5 (Threshold: 5.0)
        newTDS: 110.0, // Jump of 10.0 (Threshold: 200.0)
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.anomalies).toHaveLength(1);
      expect(res.body.anomalies[0].issue).toBe("Sudden temperature jump");
    });
  });
});
