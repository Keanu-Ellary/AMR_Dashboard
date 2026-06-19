import { getSiteByLocation } from "@/functions/site/getSiteByLocation";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getSiteByLocation", () => {
    it("should return sites by location range", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue({
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

        const res = await getSiteByLocation({
            minLat: -40,
            maxLat: -10,
            minLong: 10,
            maxLong: 40,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual({
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
            where: {
                latitude: {
                    gte: -40,
                    lte: -10,
                },
                longitude: {
                    gte: 10,
                    lte: 40,
                }
            },
            orderBy: {"createdAt": "desc"},
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
    })
})