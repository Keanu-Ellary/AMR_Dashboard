import { mockPrisma } from "../helpers/mockPrisma";
import { getAllSites } from "@/functions/site/getAllSites";

describe("getAllSites", () => {
    it("should return all sites", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
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
            },
        ]);

        const res = await getAllSites();

        expect(res.statusCode).toBe(200);
        expect(res.body.sites).toHaveLength(1);
        expect(res.body.sites).toBeDefined();

        expect(res.body.sites?.[0]).toEqual({
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

        expect(mockPrisma.siteData.findMany).toHaveBeenCalledWith({
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
        })
    });
});