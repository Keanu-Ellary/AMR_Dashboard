import { deleteSite } from "@/functions/site/deleteSite";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { s3Client } from "@/lib/s3Client";

jest.mock("@/lib/s3Client", () => ({
    s3Client: {
        send: jest.fn(),
    },
    BUCKET: "test-bucket",
    getImageUrl: (fileName: string) => `http://127.0.0.1:9000/test-bucket/${fileName}`,
}));

describe("deleteSite", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should successfully delete", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1,
            images: [
                {url: "http://127.0.0.1:9000/test-bucket/file1.jpg"},
                {url: "http://127.0.0.1:9000/test-bucket/file2.jpg"},
            ]
        });

        mockPrisma.siteData.delete.mockResolvedValue({id: 1});

        const res = await deleteSite("validToken", 1);

        expect(res.statusCode).toBe(200);

        expect(s3Client.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: {
                    Bucket: "test-bucket",
                    Delete: {
                        Objects: [{ Key: "file1.jpg"}, { Key: "file2.jpg"}],
                        Quiet: true,
                    }
                }
            })
        );

        expect(mockPrisma.siteData.delete).toHaveBeenCalledWith({
            where: {id: 1},
        });
    });

    it("should still delete with no images", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1,
            images: []
        });

        mockPrisma.siteData.delete.mockResolvedValue({id: 1});

        const res = await deleteSite("validToken", 1);

        expect(res.statusCode).toBe(200);
        expect(s3Client.send).not.toHaveBeenCalled();
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

        const res = await deleteSite("validToken", 999);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
    });

    it("should return 401 if unauthorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 401,
            message: "Unauthorized",
        });

        const res = await deleteSite("badToken", 1);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    })
})