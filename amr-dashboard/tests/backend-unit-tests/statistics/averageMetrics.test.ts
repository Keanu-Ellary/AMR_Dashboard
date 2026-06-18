import { averageMetrics } from "@/functions/statistics/averageMetrics";
import { mockPrisma } from "../helpers/mockPrisma";

describe("averageMetrics", () => {
    it("should return the average", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                temperature: 20,
                ph: 7,
                tds: 100,
                createdAt: new Date(),
            },
            {
                id: 1,
                temperature: 21,
                ph: 7.1,
                tds: 110,
                createdAt: new Date(),
            }
        ]);

        const res = await averageMetrics();

        expect(res.body.error).toBeUndefined();
        expect(res.body).toBeDefined();
        expect(res.statusCode).toBe(200);
    });

    it("should handle null values gracefully", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                temperature: 20,
                ph: 7,
                tds: 100,
                createdAt: new Date(),
            },
            {
                id: 1,
                temperature: null,
                ph: 7.1,
                tds: 110,
                createdAt: new Date(),
            }
        ]);

        const res = await averageMetrics();

        expect(res.statusCode).toBe(200);
    })
})