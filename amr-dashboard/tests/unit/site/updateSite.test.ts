import { updateSite } from "@/functions/site/updateSite";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";

describe("updateSite", () => {
    it("should update a site successfully", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1,
        });

        mockPrisma.siteData.update.mockResolvedValue({
            id: 1,
            sampleName: "Updated Name",
        });

        const res = await updateSite("validToken", 1, {
            sampleName: "Updated Name"
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.siteToUpdate?.sampleName).toBe("Updated Name");
    });

    it("should return 401 if unauthorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 401,
            message: "Unauthorized",
        });

        const res = await updateSite("badToken", 1, {sampleName: "Test"});

        expect(res.statusCode).toBe(401);
    });

    it("should return 404 if site not found", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue(null);

        const res = await updateSite("validToken", 999, {
            sampleName: "test"
        });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Site not found");
    });

    it("should return 400 if pH is invalid", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1,
        });

        const res =  await updateSite("validToken", 1, {
            ph: 20,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it("should return 400 if not fields are provided", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1
        });

        const res = await updateSite("validToken", 1, {});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    })
})