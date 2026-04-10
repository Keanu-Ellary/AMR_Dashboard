import { waterQuality } from "@/functions/statistics/waterQuality";
import { mockPrisma } from "../helpers/mockPrisma";

describe("waterQuality", () => {
    it("should return 100% if only one site", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                latitude: -26,
                longitude: 28
            }
        ]);

        const res = await waterQuality();

        expect(res.statusCode).toBe(200);
        expect(res.body.percentageClean).toBe(100);
    });

    it("should calculate contaminated distance", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                latitude: 0,
                longitude: 0
            },
            {
                latitude: 0,
                longitude: 1
            }
        ]);

        const res = await waterQuality();

        expect(res.statusCode).toBe(200);
        expect(res.body.contaminatedDistance).toBeGreaterThan(0);
    });

    it("should calculate percentage clean correctly", async() => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                latitude: 0,
                longitude: 0
            },
            {
                latitude: 0,
                longitude: 1
            }
        ]);

        const res = await waterQuality();

        expect(res.body.percentageClean).toBeLessThanOrEqual(100);
        expect(res.body.percentageClean).toBeGreaterThanOrEqual(0);
    });
})