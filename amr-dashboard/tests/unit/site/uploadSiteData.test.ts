import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { minioClient } from "@/lib/minio";
import { mockPrisma } from "../helpers/mockPrisma";
import { uploadSiteData } from "@/functions/site/uploadSiteData";

jest.mock("@/lib/minio", () => ({
    minioClient: {
        putObject: jest.fn(),
    },
    BUCKET: "test-bucket",
}));

describe("uploadSiteData", () => {
    it("should upload site with image", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

        mockPrisma.siteData.create.mockResolvedValue({
            id: 1,
            sampleName: "Sample A",
        });

        const base64Image = Buffer.from("test").toString("base64");

        const res = await uploadSiteData("validToken", {
            sampleName: "Sample A",
            isolationSource: "River water",
            collectionDate: new Date("2026-04-01"),
            geoLocName: "Apies River - Point F",
            latitude: -26.8075,
            longitude: 29.6677,
            amrResGenes: "geneA, geneB",
            predictedSir: "Resistant",
            sampleAnalysisType: "Metagenomic",
            dangerZone: "red"
        }, base64Image);

        expect(res.statusCode).toBe(201);

        expect(minioClient.putObject).toHaveBeenCalled();

        expect(mockPrisma.siteData.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    adminId: 1,
                    images: {
                        create: expect.arrayContaining([
                            expect.objectContaining({
                                url: expect.stringContaining("http://127.0.0.1:9000"),
                            }),
                        ]),
                    }
                }),
            }),
        );
    });

    it("should still upload without an image", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.siteData.create.mockResolvedValue({
            id: 2,
            sampleName: "No Image Site",
        });

        const res = await uploadSiteData("validToken", {
            sampleName: "No Image Site",
            isolationSource: "River water",
            collectionDate: new Date("2026-04-01"),
            geoLocName: "Apies River - Point F",
            latitude: -26.8075,
            longitude: 29.6677,
            amrResGenes: "geneA, geneB",
            predictedSir: "Resistant",
            sampleAnalysisType: "Metagenomic",
            dangerZone: "red"
        });

        expect(res.statusCode).toBe(201);

        expect(minioClient.putObject).not.toHaveBeenCalled();

        expect(mockPrisma.siteData.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.not.objectContaining({
                    images: expect.anything(),
                }),
            }),
        );
    });

    it("should return 401 if not authorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 401,
            message: "Unauthorized",
        });

        const res = await uploadSiteData("badToken", {
            sampleName: "No Image Site",
            isolationSource: "River water",
            collectionDate: new Date("2026-04-01"),
            geoLocName: "Apies River - Point F",
            latitude: -26.8075,
            longitude: 29.6677,
            amrResGenes: "geneA, geneB",
            predictedSir: "Resistant",
            sampleAnalysisType: "Metagenomic",
            dangerZone: "red"
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("should return 500 for invalid pH", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        const res = await uploadSiteData("validToken", {
            sampleName: "No Image Site",
            isolationSource: "River water",
            collectionDate: new Date("2026-04-01"),
            geoLocName: "Apies River - Point F",
            latitude: -26.8075,
            longitude: 29.6677,
            amrResGenes: "geneA, geneB",
            predictedSir: "Resistant",
            sampleAnalysisType: "Metagenomic",
            ph: 20,
        });

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    })
})