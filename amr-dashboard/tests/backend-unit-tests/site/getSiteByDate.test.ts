import { getSiteByDate } from "@/functions/site/getSiteByDate";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getSiteByDate", () => {
    it("should return sites by date range", async () => {
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

        const res = await getSiteByDate({
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-04-30"),
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toBeDefined();

        expect(mockPrisma.siteData.findMany).toHaveBeenCalledWith({
            where: {
                createdAt: {
                    gte: new Date("2026-03-01"),
                    lte: new Date("2026-04-30")
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
    });
})