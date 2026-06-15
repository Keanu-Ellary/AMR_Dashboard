import { prisma } from "@/lib/db";
import { minioClient, BUCKET } from "@/lib/minio";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as sitePost } from "@/app/api/site/route";
import { POST as algaePost } from "@/app/api/algae/route";
import bcrypt from "bcrypt";

// Mock next/headers for cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}));

// 1x1 transparent PNG base64 string
const MOCK_BASE64_IMAGE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("External Services Integration Tests (MinIO & AI Lambda)", () => {
  let adminToken: string;

  beforeAll(async () => {
    // Clean up tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`
    );

    // Create admin user
    const hashed = await bcrypt.hash("adminpassword", 10);
    await prisma.adminUser.create({
      data: {
        name: "Admin",
        surname: "ServiceTest",
        email: "admin.servicetest@example.com",
        password: hashed,
        isAdmin: true,
      },
    });

    // Log in to get token
    const loginReq = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin.servicetest@example.com",
        password: "adminpassword",
      }),
    });
    const loginRes = await authPost(loginReq);
    const loginData = await loginRes.json();
    adminToken = loginData.jwtToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("MinIO Storage Integration", () => {
    it("should successfully save and retrieve a file directly from MinIO", async () => {
      const testObjectName = "integration-test-file.txt";
      const fileContent = "Hello from integration test!";
      const buffer = Buffer.from(fileContent, "utf-8");

      // Upload directly to MinIO
      await minioClient.putObject(BUCKET, testObjectName, buffer, buffer.length, {
        "Content-Type": "text/plain",
      });

      // Retrieve and verify
      const stream = await minioClient.getObject(BUCKET, testObjectName);
      let retrievedContent = "";
      
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk) => {
          retrievedContent += chunk.toString();
        });
        stream.on("end", () => resolve());
        stream.on("error", (err) => reject(err));
      });

      expect(retrievedContent).toBe(fileContent);

      // Clean up uploaded file
      await minioClient.removeObject(BUCKET, testObjectName);
    });

    it("should upload image via /api/site and save it to MinIO", async () => {
      const siteReq = new Request("http://localhost/api/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          sampleName: "MinIO Site Test",
          isolationSource: "River",
          collectionDate: new Date(),
          geoLocName: "Pretoria East",
          latitude: -25.75,
          longitude: 28.3,
          amrResGenes: "Not collected",
          predictedSir: "Not collected",
          sampleAnalysisType: "Genomic",
          dangerZone: "green",
          imageBase64: MOCK_BASE64_IMAGE,
        }),
      });

      const res = await sitePost(siteReq);
      expect(res.status).toBe(201);
      const data = await res.json();

      // Verify record is created in database
      const siteId = data.id;
      const siteInDb = await prisma.siteData.findUnique({
        where: { id: siteId },
        include: { images: true },
      });

      expect(siteInDb).not.toBeNull();
      expect(siteInDb!.images).toHaveLength(1);

      // Extract filename from URL (format: http://127.0.0.1:9000/site-images/site-<timestamp>.jpg)
      const imageUrl = siteInDb!.images[0].url;
      expect(imageUrl).toContain(`http://127.0.0.1:9000/${BUCKET}/site-`);
      
      const fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

      // Verify file exists in MinIO bucket
      const exists = await minioClient.statObject(BUCKET, fileName);
      expect(exists.size).toBeGreaterThan(0);

      // Clean up MinIO file
      await minioClient.removeObject(BUCKET, fileName);
    });
  });

  describe("AI Lambda Integration", () => {
    it("should successfully invoke local AI Lambda to detect algae", async () => {
      const algaeReq = new Request("http://localhost/api/algae", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: MOCK_BASE64_IMAGE,
        }),
      });

      const res = await algaePost(algaeReq);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.data.results).toBeDefined();
      expect(Array.isArray(data.data.results)).toBe(true);
    });
  });
});
