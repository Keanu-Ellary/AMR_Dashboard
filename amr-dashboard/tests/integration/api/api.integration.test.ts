import { prisma } from "@/lib/db";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as registerPost } from "@/app/api/users/route";
import { POST as sitePost } from "@/app/api/site/route";
import bcrypt from "bcrypt";

// Mock next/headers for cookie support in raw Jest environment
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe("API Routes & Middleware Integration Tests", () => {
  beforeEach(async () => {
    // Clean up tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "SiteImage", "SiteImageBatch", "SiteData", "ChangeLog", "AdminUser", "User" CASCADE;`
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Authentication & Registration API Flow", () => {
    it("should register a user, hash password, and then login successfully", async () => {
      // 1. Register a user via POST /api/users
      const registerReq = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice",
          surname: "Smith",
          email: "alice@example.com",
          password: "securepassword",
        }),
      });

      const registerRes = await registerPost(registerReq);
      expect(registerRes.status).toBe(201);
      const registerData = await registerRes.json();
      expect(registerData.email).toBe("alice@example.com");

      // Verify user is in database with a hashed password
      const dbUser = await prisma.user.findUnique({
        where: { email: "alice@example.com" },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.password).not.toBe("securepassword"); // should be hashed
      const passwordMatch = await bcrypt.compare("securepassword", dbUser!.password);
      expect(passwordMatch).toBe(true);

      // 2. Login as the newly created user via POST /api/auth
      const loginReq = new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alice@example.com",
          password: "securepassword",
        }),
      });

      const loginRes = await authPost(loginReq);
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.jwtToken).toBeDefined();
      expect(loginData.user.email).toBe("alice@example.com");
    });

    it("should reject login with invalid credentials", async () => {
      // Create user directly in DB
      const hashed = await bcrypt.hash("password123", 10);
      await prisma.user.create({
        data: {
          name: "Bob",
          surname: "Jones",
          email: "bob@example.com",
          password: hashed,
        },
      });

      // Attempt login with incorrect password
      const loginReq = new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bob@example.com",
          password: "wrongpassword",
        }),
      });

      const loginRes = await authPost(loginReq);
      expect(loginRes.status).toBe(401);
      const loginData = await loginRes.json();
      expect(loginData.error).toBe("Invalid email or password");
    });
  });

  describe("API Endpoint Protection (authMiddleware)", () => {
    it("should return 401 Unauthorized if authorization header is missing on protected route", async () => {
      const siteReq = new Request("http://localhost/api/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleName: "Sample X",
          isolationSource: "Water",
          collectionDate: new Date(),
          geoLocName: "South Africa",
          latitude: -25.74,
          longitude: 28.18,
          amrResGenes: "mecA",
          predictedSir: "R",
          sampleAnalysisType: "Genomic",
        }),
      });

      const siteRes = await sitePost(siteReq);
      expect(siteRes.status).toBe(401);
      const data = await siteRes.json();
      expect(data.error).toBe("Missing token");
    });

    it("should return 403 Forbidden if user is authenticated but not an admin", async () => {
      // Register and login as regular user to get JWT
      const hashed = await bcrypt.hash("password123", 10);
      const user = await prisma.user.create({
        data: {
          name: "Regular",
          surname: "User",
          email: "user@example.com",
          password: hashed,
        },
      });

      const loginReq = new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      });
      const loginRes = await authPost(loginReq);
      const { jwtToken } = await loginRes.json();

      // Attempt to post site data as regular user
      const siteReq = new Request("http://localhost/api/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          sampleName: "Sample X",
          isolationSource: "Water",
          collectionDate: new Date(),
          geoLocName: "South Africa",
          latitude: -25.74,
          longitude: 28.18,
          amrResGenes: "mecA",
          predictedSir: "R",
          sampleAnalysisType: "Genomic",
        }),
      });

      const siteRes = await sitePost(siteReq);
      expect(siteRes.status).toBe(403);
      const data = await siteRes.json();
      expect(data.error).toBe("Forbidden: Admins only");
    });
  });

  describe("API Route Validation", () => {
    it("should return 500 when pH value is invalid (outside 0-14 range)", async () => {
      // Create admin user and log in to get admin JWT
      const hashed = await bcrypt.hash("adminpassword", 10);
      await prisma.adminUser.create({
        data: {
          name: "Admin",
          surname: "User",
          email: "admin@example.com",
          password: hashed,
          isAdmin: true,
        },
      });

      const loginReq = new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "adminpassword",
        }),
      });
      const loginRes = await authPost(loginReq);
      const { jwtToken } = await loginRes.json();

      // Submit site data with invalid pH
      const siteReq = new Request("http://localhost/api/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          sampleName: "Sample Y",
          isolationSource: "Water",
          collectionDate: new Date(),
          geoLocName: "South Africa",
          latitude: -25.74,
          longitude: 28.18,
          amrResGenes: "mecA",
          predictedSir: "R",
          sampleAnalysisType: "Genomic",
          ph: 15.0, // Invalid pH level (should be between 0 and 14)
        }),
      });

      const siteRes = await sitePost(siteReq);
      expect(siteRes.status).toBe(500);
      const data = await siteRes.json();
      expect(data.error).toBe("Failed to upload site data");
    });
  });
});
