import { prisma } from "@/lib/db";
import { s3Client, BUCKET } from "@/lib/s3Client";
import { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`,
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
        mustChangePassword: false,
      },
    });

    // Log in to get token
    const loginReq = new Request("http://localhost:3000/api/auth", {
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
      await s3Client.send( new PutObjectCommand({
        Bucket: BUCKET,
        Key: testObjectName,
        Body: buffer,
        ContentType: "text/plain",
      })
      );

      // Retrieve and verify
      const exists = await s3Client.send(new HeadObjectCommand({
              Bucket:BUCKET, 
              Key: testObjectName
      }))
     expect(exists.ContentLength).toBeGreaterThan(0);

    const getRes = await s3Client.send(new GetObjectCommand({
              Bucket:BUCKET, 
              Key: testObjectName
      }))
     const retrievedContent = await getRes.Body?.transformToString();
     expect(retrievedContent).toBe(fileContent);

      // Clean up uploaded file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET, 
        Key: testObjectName// Cleanup
      }));
    });

    it("should upload image via /api/site and save it to MinIO", async () => {
      const siteReq = new Request("http://localhost:3000/api/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
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
      const exists = await s3Client.send(new HeadObjectCommand({
              Bucket:BUCKET, 
              Key: fileName
      }))
     expect(exists.ContentLength).toBeGreaterThan(0);

      // Clean up MinIO file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET, 
        Key: fileName// Cleanup
      }));
    });
  });

  describe("AI Lambda Integration", () => {
    it("should successfully invoke local AI Lambda to detect algae", async () => {
      const algaeReq = new Request("http://localhost:3000/api/algae", {
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
      expect(data.data.clean).toBeDefined();
      expect(data.data.algaeDetected).toBeDefined();
      expect(data.data.pollutionDetected).toBeDefined();
      expect(data.data.probabilities).toBeDefined();
      expect(data.data.probabilities.clean).toBeDefined();
    });
  });
});
