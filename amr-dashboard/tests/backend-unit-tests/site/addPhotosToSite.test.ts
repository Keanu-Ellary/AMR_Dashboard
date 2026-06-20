import { addPhotosToSite } from "@/functions/site/addPhotosToSite";
import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { s3Client } from "@/lib/s3Client";
import { mockPrisma } from "../helpers/mockPrisma";

jest.mock("@/lib/s3Client", () => ({
    s3Client: {
        send: jest.fn(),
    },
    BUCKET: "test-bucket",
    getImageUrl: (fileName: string) => `http://127.0.0.1:9000/test-bucket/${fileName}`,
}));

describe("addPhotosToSite", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should add photos to site", async () => {
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

        mockPrisma.siteImageBatch.create.mockResolvedValue({
            id: 123,
        });

        (s3Client.send as jest.Mock).mockResolvedValue({});

        mockPrisma.siteData.createMany.mockResolvedValue({count: 2});

        const base64Images = [
            Buffer.from("img1").toString("base64"),
            Buffer.from("img2").toString("base64")
        ];

        const res = await addPhotosToSite("validToken", 1, base64Images);

        expect(s3Client.send).toHaveBeenCalledTimes(2);

        expect(mockPrisma.siteImage.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({
                    url: expect.stringContaining("http://127.0.0.1:9000"),
                    siteId: 1,
                }),
            ]),
        });

        expect(res.statusCode).toBe(200);
    });

    it("should return 401 if unauthorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 401,
            message: "Unauthorized",
        });

        const res = await addPhotosToSite("badToken", 1, []);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("should return 404 if the site is not found", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.findUnique.mockResolvedValue(null);

        const res = await addPhotosToSite("validToken", 999, ["test"]);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
    });

    it("should return an error if the images are empty", async () => {
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

        const res = await addPhotosToSite("validToken", 1, []);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
    });

    it("should return 500 if upload fails", async () => {
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

        (s3Client.send as jest.Mock).mockRejectedValue(
            new Error("Upload failed")
        );

        const res = await addPhotosToSite("validToken", 1, [
            Buffer.from("img").toString("base64")
        ]);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    })
})