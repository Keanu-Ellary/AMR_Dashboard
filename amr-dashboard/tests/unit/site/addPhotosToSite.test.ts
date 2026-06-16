import { addPhotosToSite } from "@/functions/site/addPhotosToSite";
import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { minioClient } from "@/lib/minio";
import { mockPrisma } from "../helpers/mockPrisma";

jest.mock("@/lib/minio", () => ({
    minioClient: {
        putObject: jest.fn(),
    },
    BUCKET: "test-bucket",
}));

describe("addPhotosToSite", () => {
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

        (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

        mockPrisma.siteData.createMany.mockResolvedValue({count: 2});

        const base64Images = [
            Buffer.from("img1").toString("base64"),
            Buffer.from("img2").toString("base64")
        ];

        const res = await addPhotosToSite("validToken", 1, base64Images);

        expect(minioClient.putObject).toHaveBeenCalledTimes(2);

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

        (minioClient.putObject as jest.Mock).mockRejectedValue(
            new Error("Upload failed")
        );

        const res = await addPhotosToSite("validToken", 1, [
            Buffer.from("img").toString("base64")
        ]);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    })
})