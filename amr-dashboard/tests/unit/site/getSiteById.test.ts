import { getSiteById } from "@/functions/site/getSiteById";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getSiteById", () => {
    it("should return the site by ID", async () => {
        mockPrisma.siteData.findUnique.mockResolvedValue({
            id: 1,
            adminId: 3,
            sampleName: "Sample A",
            isolationSource: "River water",
            collectionDate: new Date("2026-04-01"),
            geoLocName: "Apies River - Point F",
            latitude: -26.8075,
            longitude: 29.6677,
            amrResGenes: "geneA, geneB",
            predictedSir: "Resistant",
            sampleAnalysisType: "Metagenomic",
        });

        const res = await getSiteById(1);

        expect(res.statusCode).toBe(200);
        expect(res.body.site).toEqual(
            {
                id: 1,
                adminId: 3,
                sampleName: "Sample A",
                isolationSource: "River water",
                collectionDate: new Date("2026-04-01"),
                geoLocName: "Apies River - Point F",
                latitude: -26.8075,
                longitude: 29.6677,
                amrResGenes: "geneA, geneB",
                predictedSir: "Resistant",
                sampleAnalysisType: "Metagenomic",
            }
        );

        expect(mockPrisma.siteData.findUnique).toHaveBeenCalledWith({
            where: {id: 1},
            select: {
                id: true,
                dangerZone: true,

                sampleName: true,
                isolationSource: true,
                collectionDate: true,
                geoLocName: true,
                latitude: true,
                longitude: true,
                amrResGenes: true,
                predictedSir: true,
                sampleAnalysisType: true,

                temperature: true,
                tds: true,
                ph: true,
                dissolvedO2: true,
                ec: true,
                createdAt: true,
                images: {
                    select: {
                        url: true,
                    }
                },
            }
        });
    });

    it("should return 404 if site is not found", async () => {
        mockPrisma.siteData.findUnique.mockResolvedValue(null);

        const res = await getSiteById(999);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
    });
});