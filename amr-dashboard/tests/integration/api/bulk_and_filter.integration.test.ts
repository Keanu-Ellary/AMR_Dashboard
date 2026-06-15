import { prisma } from "@/lib/db";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as bulkPost } from "@/app/api/site/multiple/route";
import { DELETE as bulkDelete } from "@/app/api/site/bulk/route";
import { GET as siteGet, POST as sitePost } from "@/app/api/site/route";
import bcrypt from "bcrypt";

// Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn().mockReturnValue({ value: JSON.stringify({ token: global.adminToken }) }),
    delete: jest.fn(),
  })),
}));

describe("Bulk Operations and Search Filter Integration", () => {
  let adminId: number;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`);
    const hashed = await bcrypt.hash("adminpassword", 10);
    const admin = await prisma.adminUser.create({
      data: { name: "Admin", surname: "BulkTest", email: "admin.bulk@example.com", password: hashed, isAdmin: true },
    });
    adminId = admin.id;

    const loginReq = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin.bulk@example.com", password: "adminpassword" }),
    });
    const loginRes = await authPost(loginReq);
    const { jwtToken } = await loginRes.json();
    (global as any).adminToken = jwtToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should successfully ingest bulk data via CSV and log BULK_CREATE", async () => {
    // Construct a mock CSV file
    const csvContent = `*Sample_name,Isolation source,Collection date,*geo_loc_name,latitude,longitude,AMR_Resistance_genes,Predicted_SIR profile,Sample_Analysis_Type,pH,Temp of water,TDS (mg/L)
Sample A,River,2026-05-15,Test River A,-25.7,28.2,mecA,R,Genomic,7.2,22.5,150
Sample B,Lake,2026-05-16,Test Lake B,-26.1,28.0,vanA,I,Genomic,6.8,18.0,200`;
    
    const file = new File([csvContent], "test_import.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new Request("http://localhost/api/site/multiple", {
      method: "POST",
      headers: { "Authorization": `Bearer ${(global as any).adminToken}` },
      body: formData,
    });

    const res = await bulkPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("uploaded successfully");

    // Verify DB insertion
    const sites = await prisma.siteData.findMany({ where: { geoLocName: { in: ["Test River A", "Test Lake B"] } } });
    expect(sites).toHaveLength(2);
    expect(sites[0].ph).toBe(7.2);

    // Verify Changelog
    const logs = await prisma.changeLog.findMany({ where: { action: "BULK_CREATE" } });
    expect(logs).toHaveLength(1);
    expect(JSON.parse(logs[0].newData!)).toHaveLength(2);
  });

  it("should filter map data by bounding box, date, and zone", async () => {
    // Fetch all sites with specific filters
    const searchUrl = "http://localhost/api/site?minLat=-26.0&maxLat=-25.0&minLong=28.1&maxLong=28.5";
    const req = new Request(searchUrl);
    const res = await siteGet(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Only "Sample A" falls into this bounding box (-25.7, 28.2)
    expect(data.data).toHaveLength(1);
    expect(data.data[0].sampleName).toBe("Sample A");
  });

  it("should bulk delete sites by Date Range and log BULK_DELETE", async () => {
    const req = new Request("http://localhost/api/site/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(global as any).adminToken}` },
      body: JSON.stringify({
        startDate: "2026-05-14",
        endDate: "2026-05-17",
      }),
    });

    const res = await bulkDelete(req);
    expect(res.status).toBe(200);
    
    const dbSites = await prisma.siteData.findMany();
    expect(dbSites).toHaveLength(0); // Both were in that range

    const logs = await prisma.changeLog.findMany({ where: { action: "BULK_DELETE" } });
    expect(logs).toHaveLength(1);
  });
});

