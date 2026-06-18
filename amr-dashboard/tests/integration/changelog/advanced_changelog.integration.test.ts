import { prisma } from "@/lib/db";
import { GET as changelogGet } from "@/app/api/changelog/route";
import { POST as undoPost } from "@/app/api/changelog/undo/route";

let mockAdminId = 1;

// Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    get: jest
      .fn()
      .mockReturnValue({
        value: JSON.stringify({ token: global.adminToken, isAdmin: true }),
      }),
  })),
}));

// Provide a mock adminNeeded bypass for GET route (which uses token extraction)
jest.mock("@/lib/middleware/authMiddleware", () => ({
  adminNeeded: jest.fn().mockImplementation(() => ({
    authorized: true,
    user: { userId: mockAdminId, isAdmin: true },
  })),
}));

describe("Advanced Changelog and Bulk Undo Integration", () => {
  let adminId: number;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteData", "ChangeLog", "AdminUser" CASCADE;`,
    );
    const admin = await prisma.adminUser.create({
      data: {
        name: "Admin",
        surname: "Log",
        email: "log@example.com",
        password: "hash",
        isAdmin: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    mockAdminId = admin.id;
    (global as any).adminToken = "mock_jwt_token";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should paginate and filter changelog records correctly", async () => {
    // Seed 15 logs
    for (let i = 0; i < 15; i++) {
      await prisma.changeLog.create({
        data: {
          entityType: "SiteData",
          entityId: i,
          action: i % 2 === 0 ? "CREATE" : "UPDATE",
          changedBy: adminId,
          newData: "{}",
        },
      });
    }

    const req = new Request(
      "http://localhost:3000/api/changelog?page=2&limit=5&action=CREATE",
    );
    const res = await changelogGet(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // 8 CREATE actions total. Page 2 with limit 5 should return 3 items.
    expect(data.total).toBe(8);
    expect(data.data).toHaveLength(3);
    expect(data.data[0].action).toBe("CREATE");
  });

  it("should successfully undo a BULK_CREATE action", async () => {
    // 1. Manually create sites
    const s1 = await prisma.siteData.create({
      data: {
        sampleName: "B1",
        isolationSource: "W",
        collectionDate: new Date(),
        geoLocName: "X",
        dangerZone: "red",
        sampleAnalysisType: "G",
        amrResGenes: "",
        predictedSir: "",
        adminId,
      },
    });
    const s2 = await prisma.siteData.create({
      data: {
        sampleName: "B2",
        isolationSource: "W",
        collectionDate: new Date(),
        geoLocName: "X",
        dangerZone: "red",
        sampleAnalysisType: "G",
        amrResGenes: "",
        predictedSir: "",
        adminId,
      },
    });

    // 2. Create the associated BULK_CREATE changelog
    const bulkLog = await prisma.changeLog.create({
      data: {
        entityType: "SiteData",
        entityId: 0,
        action: "BULK_CREATE",
        changedBy: adminId,
        newData: JSON.stringify([{ id: s1.id }, { id: s2.id }]),
      },
    });

    // 3. Trigger Undo
    const req = new Request("http://localhost:3000/api/changelog/undo", {
      method: "POST",
      body: JSON.stringify({ changeLogId: bulkLog.id }),
    });
    const res = await undoPost(req);
    expect(res.status).toBe(200);

    // 4. Verify DB is clean and UNDO log is created
    const sites = await prisma.siteData.findMany({
      where: { id: { in: [s1.id, s2.id] } },
    });
    expect(sites).toHaveLength(0);

    const undoLog = await prisma.changeLog.findFirst({
      where: { action: "UNDO_BULK_CREATE" },
    });
    expect(undoLog).not.toBeNull();
  });

  it("should successfully undo a BULK_DELETE action", async () => {
    // Mock the deleted payload
    const deletedPayload = [
      {
        sampleName: "Restored 1",
        isolationSource: "W",
        geoLocName: "X",
        dangerZone: "green",
        sampleAnalysisType: "G",
        amrResGenes: "",
        predictedSir: "",
      },
      {
        sampleName: "Restored 2",
        isolationSource: "W",
        geoLocName: "X",
        dangerZone: "yellow",
        sampleAnalysisType: "G",
        amrResGenes: "",
        predictedSir: "",
      },
    ];

    const bulkLog = await prisma.changeLog.create({
      data: {
        entityType: "SiteData",
        entityId: 0,
        action: "BULK_DELETE",
        changedBy: adminId,
        previousData: JSON.stringify(deletedPayload),
      },
    });

    // Trigger Undo
    const req = new Request("http://localhost:3000/api/changelog/undo", {
      method: "POST",
      body: JSON.stringify({ changeLogId: bulkLog.id }),
    });
    await undoPost(req);

    // Verify sites were restored into the database
    const restoredSites = await prisma.siteData.findMany({
      where: { sampleName: { in: ["Restored 1", "Restored 2"] } },
    });
    expect(restoredSites).toHaveLength(2);
  });
});
