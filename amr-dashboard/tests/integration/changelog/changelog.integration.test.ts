import { prisma } from "@/lib/db";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as sitePost } from "@/app/api/site/route";
import { PATCH as updatePost, DELETE as deletePost } from "@/app/api/site/[id]/route";
import { POST as undoPost } from "@/app/api/changelog/undo/route";
import bcrypt from "bcrypt";

// Mock next/headers for cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe("Changelog and Undo Stateful Integration Tests", () => {
  let adminToken: string;
  let adminId: number;

  beforeEach(async () => {
    // Clean up tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`
    );

    // Create admin user
    const hashed = await bcrypt.hash("adminpassword", 10);
    const admin = await prisma.adminUser.create({
      data: {
        name: "Admin",
        surname: "ChangelogTest",
        email: "admin.changelog@example.com",
        password: hashed,
        isAdmin: true,
      },
    });
    adminId = admin.id;

    // Log in to get token
    const loginReq = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin.changelog@example.com",
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

  it("should undo a CREATE action by deleting the created SiteData", async () => {
    // 1. Create site data
    const siteReq = new Request("http://localhost/api/site", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sampleName: "Create Undo Test",
        isolationSource: "Spring",
        collectionDate: new Date(),
        geoLocName: "Spring City",
        latitude: 10.0,
        longitude: 20.0,
        amrResGenes: "Not collected",
        predictedSir: "Not collected",
        sampleAnalysisType: "Genomic",
        dangerZone: "green",
      }),
    });

    const createRes = await sitePost(siteReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    const siteId = createData.id;

    // Confirm ChangeLog entry exists
    const logs = await prisma.changeLog.findMany({
      where: { entityId: siteId, action: "CREATE" },
    });
    expect(logs).toHaveLength(1);
    const changeLogId = logs[0].id;

    // Verify site exists in DB
    let siteInDb = await prisma.siteData.findUnique({ where: { id: siteId } });
    expect(siteInDb).not.toBeNull();

    // 2. Undo the creation via POST /api/changelog/undo
    const undoReq = new Request("http://localhost/api/changelog/undo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ changeLogId }),
    });

    const undoRes = await undoPost(undoReq);
    expect(undoRes.status).toBe(200);

    // Verify site is deleted
    siteInDb = await prisma.siteData.findUnique({ where: { id: siteId } });
    expect(siteInDb).toBeNull();

    // Verify the changelog log is marked undone
    const updatedLog = await prisma.changeLog.findUnique({ where: { id: changeLogId } });
    expect(updatedLog!.undone).toBe(true);

    // Verify UNDO_CREATE log exists
    const undoLogs = await prisma.changeLog.findMany({
      where: { entityId: siteId, action: "UNDO_CREATE" },
    });
    expect(undoLogs).toHaveLength(1);
  });

  it("should undo an UPDATE action by reverting site field values to their original state", async () => {
    // 1. Create a site directly in the database
    const site = await prisma.siteData.create({
      data: {
        sampleName: "Original Name",
        isolationSource: "Well",
        collectionDate: new Date(),
        geoLocName: "Well 1",
        latitude: 12.0,
        longitude: 22.0,
        amrResGenes: "Not collected",
        predictedSir: "Not collected",
        dangerZone: "green",
        sampleAnalysisType: "Genomic",
        adminId,
      },
    });

    // Log the initial creation manually to simulate realistic state
    await prisma.changeLog.create({
      data: {
        entityType: "SiteData",
        entityId: site.id,
        action: "CREATE",
        newData: JSON.stringify(site),
        changedBy: adminId,
      },
    });

    // 2. Update site data via PATCH /api/site/[id]
    const updateReq = new Request(`http://localhost/api/site/${site.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sampleName: "Updated Name",
        predictedSir: "I",
        amrResGenes: "tet(A)",
      }),
    });

    const updateRes = await updatePost(updateReq, { params: Promise.resolve({ id: site.id.toString() }) });
    expect(updateRes.status).toBe(200);

    // Confirm update in database
    let siteInDb = await prisma.siteData.findUnique({ where: { id: site.id } });
    expect(siteInDb!.sampleName).toBe("Updated Name");
    expect(siteInDb!.dangerZone).toBe("yellow");

    // Fetch the UPDATE changelog entry
    const logs = await prisma.changeLog.findMany({
      where: { entityId: site.id, action: "UPDATE" },
    });
    expect(logs).toHaveLength(1);
    const updateLogId = logs[0].id;

    // 3. Undo the update via POST /api/changelog/undo
    const undoReq = new Request("http://localhost/api/changelog/undo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ changeLogId: updateLogId }),
    });

    const undoRes = await undoPost(undoReq);
    expect(undoRes.status).toBe(200);

    // Verify database site is reverted
    siteInDb = await prisma.siteData.findUnique({ where: { id: site.id } });
    expect(siteInDb!.sampleName).toBe("Original Name");
    expect(siteInDb!.dangerZone).toBe("green");

    // Verify update log is marked undone
    const updatedLog = await prisma.changeLog.findUnique({ where: { id: updateLogId } });
    expect(updatedLog!.undone).toBe(true);
  });

  it("should undo a DELETE action by recreating the deleted SiteData", async () => {
    // 1. Create a site directly in database
    const site = await prisma.siteData.create({
      data: {
        sampleName: "To Be Deleted",
        isolationSource: "Well",
        collectionDate: new Date(),
        geoLocName: "Well 2",
        latitude: 14.0,
        longitude: 24.0,
        amrResGenes: "Not collected",
        predictedSir: "Not collected",
        dangerZone: "green",
        sampleAnalysisType: "Genomic",
        adminId,
      },
    });

    // 2. Delete site via DELETE /api/site/[id]
    const deleteReq = new Request(`http://localhost/api/site/${site.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    const deleteRes = await deletePost(deleteReq, { params: Promise.resolve({ id: site.id.toString() }) });
    expect(deleteRes.status).toBe(200);

    // Confirm it is gone
    let siteInDb = await prisma.siteData.findUnique({ where: { id: site.id } });
    expect(siteInDb).toBeNull();

    // Fetch the DELETE changelog entry
    const logs = await prisma.changeLog.findMany({
      where: { entityId: site.id, action: "DELETE" },
    });
    expect(logs).toHaveLength(1);
    const deleteLogId = logs[0].id;

    // 3. Undo the delete via POST /api/changelog/undo
    const undoReq = new Request("http://localhost/api/changelog/undo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ changeLogId: deleteLogId }),
    });

    const undoRes = await undoPost(undoReq);
    expect(undoRes.status).toBe(200);
    const undoData = await undoRes.json();

    // Verify recreated site exists
    const recreatedLog = undoData.undoneLog;
    expect(recreatedLog.action).toBe("UNDO_DELETE");

    // Check database to ensure the row exists again
    const recreatedSites = await prisma.siteData.findMany({
      where: { sampleName: "To Be Deleted" },
    });
    expect(recreatedSites).toHaveLength(1);
    expect(recreatedSites[0].geoLocName).toBe("Well 2");
  });
});
