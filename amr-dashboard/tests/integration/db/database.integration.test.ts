import { prisma } from "@/lib/db";

describe("Database Integration Tests", () => {
  beforeEach(async () => {
    // Truncate tables to ensure database is clean before each test
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`
    );
  });

  afterAll(async () => {
    // Clean up connections
    await prisma.$disconnect();
  });

  describe("Constraints and Validation", () => {
    it("should enforce unique email constraint on User and AdminUser", async () => {
      // Create first user
      await prisma.user.create({
        data: {
          name: "John",
          surname: "Doe",
          email: "john.doe@example.com",
          password: "password123",
        },
      });

      // Attempt duplicate user creation
      await expect(
        prisma.user.create({
          data: {
            name: "Jane",
            surname: "Doe",
            email: "john.doe@example.com",
            password: "password123",
          },
        })
      ).rejects.toThrow();

      // Create first admin
      await prisma.adminUser.create({
        data: {
          name: "Admin",
          surname: "One",
          email: "admin@example.com",
          password: "password123",
          isAdmin: true,
          mustChangePassword: false,
        },
      });

      // Attempt duplicate admin creation
      await expect(
        prisma.adminUser.create({
          data: {
            name: "Admin",
            surname: "Two",
            email: "admin@example.com",
            password: "password123",
            isAdmin: true,
            mustChangePassword: false,
          },
        })
      ).rejects.toThrow();
    });

    it("should require a valid AdminUser for SiteData creation", async () => {
      // Attempt to create site data with a non-existent admin ID (e.g. 9999)
      await expect(
        prisma.siteData.create({
          data: {
            sampleName: "Sample A",
            isolationSource: "Water",
            collectionDate: new Date(),
            geoLocName: "South Africa",
            latitude: -25.74,
            longitude: 28.18,
            amrResGenes: "mecA",
            predictedSir: "R",
            sampleAnalysisType: "Genomic",
            dangerZone: "red",
            adminId: 9999,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Cascade Deletions", () => {
    it("should cascade delete SiteImageBatch and SiteImage when SiteData is deleted", async () => {
      // Create admin user
      const admin = await prisma.adminUser.create({
        data: {
          name: "John",
          surname: "Admin",
          email: "john.admin@example.com",
          password: "password123",
          isAdmin: true,
          mustChangePassword: false,
        },
      });

      // Create site data
      const site = await prisma.siteData.create({
        data: {
          sampleName: "Sample B",
          isolationSource: "Water",
          collectionDate: new Date(),
          geoLocName: "South Africa",
          latitude: -25.74,
          longitude: 28.18,
          amrResGenes: "mecA",
          predictedSir: "R",
          sampleAnalysisType: "Genomic",
          dangerZone: "red",
          adminId: admin.id,
        },
      });

      // Create image batch
      const batch = await prisma.siteImageBatch.create({
        data: {
          siteId: site.id,
          dateTaken: new Date(),
          algaeDetected: false,
          algaeScanRun: false,
        },
      });

      // Create site image
      const image = await prisma.siteImage.create({
        data: {
          url: "http://example.com/image.jpg",
          siteId: site.id,
          batchId: batch.id,
        },
      });

      // Verify records exist
      expect(await prisma.siteData.count({ where: { id: site.id } })).toBe(1);
      expect(await prisma.siteImageBatch.count({ where: { id: batch.id } })).toBe(1);
      expect(await prisma.siteImage.count({ where: { id: image.id } })).toBe(1);

      // Delete the site
      await prisma.siteData.delete({
        where: { id: site.id },
      });

      // Verify site and cascade deleted records no longer exist
      expect(await prisma.siteData.count({ where: { id: site.id } })).toBe(0);
      expect(await prisma.siteImageBatch.count({ where: { id: batch.id } })).toBe(0);
      expect(await prisma.siteImage.count({ where: { id: image.id } })).toBe(0);
    });
  });
});
