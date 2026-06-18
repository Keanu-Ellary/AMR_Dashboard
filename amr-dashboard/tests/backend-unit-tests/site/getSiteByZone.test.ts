import { getSiteByZone } from "@/functions/site/getSiteByZone";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getSiteByZone", () => {
    it("should get sites by the zone specified", async () => {
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
            dangerZone: "red"
        });

        const res = await getSiteByZone("red")

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
            dangerZone: "red"
        });

        expect(mockPrisma.siteData.findMany).toHaveBeenCalledWith({
            where: {dangerZone: "red"},
            orderBy: {createdAt: "desc"},
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
            },
            take: 3
        })
    });
})