import { prisma } from "@/lib/db";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as sitePost } from "@/app/api/site/route";
import { POST as photosPost } from "@/app/api/site/[id]/photos/route";
import { minioClient, BUCKET } from "@/lib/minio";
import bcrypt from "bcrypt";

// Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn().mockReturnValue({ value: JSON.stringify({ token: global.adminToken }) }),
    delete: jest.fn(),
  })),
}));

const MOCK_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("Image Upload and AI Pipeline Integration", () => {
  let siteId: number;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`);
    const hashed = await bcrypt.hash("adminpassword", 10);
    const admin = await prisma.adminUser.create({
      data: { name: "Admin", surname: "ImageTest", email: "admin.img@example.com", password: hashed, isAdmin: true },
    });

    const loginReq = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin.img@example.com", password: "adminpassword" }),
    });
    const loginRes = await authPost(loginReq);
    const { jwtToken } = await loginRes.json();
    (global as any).adminToken = jwtToken;

    // Create a base site
    const siteReq = new Request("http://localhost/api/site", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwtToken}` },
      body: JSON.stringify({
        sampleName: "Algae Test Site", isolationSource: "Water", collectionDate: new Date(),
        geoLocName: "Dam", latitude: -25.74, longitude: 28.18, amrResGenes: "mecA",
        predictedSir: "R", sampleAnalysisType: "Genomic"
      }),
    });
    const siteRes = await sitePost(siteReq);
    siteId = (await siteRes.json()).id;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await prisma.$disconnect();
  });

  it("should process a batch of images, hit the AI Lambda, and store in MinIO and DB", async () => {
    // Intercept the AI Lambda fetch call to return a mock bounding box (Algae Detected)
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (input.toString().includes("8080/2015-03-31")) {
        return new Response(JSON.stringify({ results: [[10, 10, 50, 50, 0.95, 0]] }), { status: 200 });
      }
      return originalFetch(input, init);
    }) as any;

    const req = new Request(`http://localhost/api/site/${siteId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(global as any).adminToken}` },
      body: JSON.stringify({
        images: [MOCK_BASE64_IMAGE, MOCK_BASE64_IMAGE],
        dateTaken: "2026-06-01",
        checkAlgae: true,
      }),
    });

    const res = await photosPost(req, { params: Promise.resolve({ id: siteId.toString() }) });
    expect(res.status).toBe(200);

    // Verify DB relationships
    const batch = await prisma.siteImageBatch.findFirst({
      where: { siteId },
      include: { images: true },
    });

    expect(batch).not.toBeNull();
    expect(batch!.algaeScanRun).toBe(true);
    expect(batch!.algaeDetected).toBe(true); // Because our mock returned results > 0
    expect(batch!.images).toHaveLength(2);

    // Verify MinIO upload
    for (const img of batch!.images) {
      const fileName = img.url.substring(img.url.lastIndexOf("/") + 1);
      const exists = await minioClient.statObject(BUCKET, fileName);
      expect(exists.size).toBeGreaterThan(0);
      await minioClient.removeObject(BUCKET, fileName); // Cleanup
    }
  });
});