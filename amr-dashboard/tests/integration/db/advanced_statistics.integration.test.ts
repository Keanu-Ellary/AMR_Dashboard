import { prisma } from "@/lib/db";
import { GET as comparisonGet } from "@/app/api/statistics/comparison/route";
import { GET as trendGet } from "@/app/api/statistics/trendOverTime/route";

describe("Advanced Statistics and Trend Integration", () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "SiteData", "AdminUser" CASCADE;`);
    const admin = await prisma.adminUser.create({
      data: { name: "Admin", surname: "Stats", email: "stats@example.com", password: "hash", isAdmin: true },
    });

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Seed Data: 10 days ago (previous week) -> Worsening
    await prisma.siteData.create({
      data: {
        adminId: admin.id, sampleName: "Old 1", isolationSource: "W", collectionDate: tenDaysAgo, createdAt: tenDaysAgo,
        geoLocName: "Site A", latitude: 0, longitude: 0, amrResGenes: "vanA", predictedSir: "R", dangerZone: "red", sampleAnalysisType: "G",
        ph: 5.0, temperature: 25.0, dissolvedO2: 4.0, tds: 800 // Poor conditions
      }
    });

    // Seed Data: 2 days ago (current week) -> Improving
    await prisma.siteData.create({
      data: {
        adminId: admin.id, sampleName: "New 1", isolationSource: "W", collectionDate: twoDaysAgo, createdAt: twoDaysAgo,
        geoLocName: "Site B", latitude: 0, longitude: 0, amrResGenes: "ampC", predictedSir: "S", dangerZone: "green", sampleAnalysisType: "G",
        ph: 7.2, temperature: 20.0, dissolvedO2: 8.5, tds: 40 // Optimal conditions
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should calculate improving/worsening trends over time correctly", async () => {
    const req = new Request("http://localhost/api/statistics/trendOverTime");
    const res = await trendGet(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // We went from 1 'red' site (score 0) in the previous 7 days to 1 'green' site (score 1) in the current 7 days.
    expect(data.trend).toBe("Improving");
    expect(data.currScore).toBeGreaterThan(data.prevScore);
  });

  it("should return formatted comparison data and Pearson correlations", async () => {
    const req = new Request("http://localhost/api/statistics/comparison?sites=Site A,Site B&dateRange=30days&metrics=ph,temperature,wqi");
    const res = await comparisonGet(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify time series structure
    expect(data.timeSeries["Site A"]).toBeDefined();
    expect(data.timeSeries["Site B"]).toBeDefined();

    const siteA_FirstEntry = data.timeSeries["Site A"][0];
    expect(siteA_FirstEntry.ph).toBe(5.0);
    expect(siteA_FirstEntry.temperature).toBe(25.0);

    // Verify correlations object generation
    expect(data.correlations["Site A"]).toBeDefined();
    expect(Object.keys(data.correlations["Site A"]).length).toBeGreaterThan(0);
    
    // Verify latest stats compilation
    expect(data.siteLatest["Site B"].dangerZone).toBe("green");
    expect(data.siteLatest["Site B"].wqi).toBeGreaterThan(90); // Near perfect WQI
  });
});