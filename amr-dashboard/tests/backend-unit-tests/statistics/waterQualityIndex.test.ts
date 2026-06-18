import { waterQualityIndex } from "@/functions/statistics/waterQualityIndex";
import { mockPrisma } from "../helpers/mockPrisma";

describe("WQI", () => {
    it("should calculate WQI correctly", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                ph: 7,
                dissolvedO2: 8,
                tds: 100,
                ec: 1,
                temperature: 20
            },
        ]);

        const res = await waterQualityIndex();

        expect(res.statusCode).toBe(200);
        expect(res.body.results![0]).toHaveProperty("id", 1);
        expect(res.body.results![0].WQI).toBeDefined();
    });

    it("should throw an error on missing fields", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                ph: null,
                dissolvedO2: 8,
                tds: 100,
                ec: 1,
            },
        ]);

        const res = await waterQualityIndex();

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to calculate WQI");
    });

    it("should round WQI to 2 decimals", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                ph: 7.1234,
                dissolvedO2: 8.5678,
                tds: 100,
                ec: 1,
                temperature: 20,
            },
        ]);

        const res = await waterQualityIndex();

        expect(String(res.body.results![0].WQI)).toMatch(/^\d+\.\d{2}$/);
    })
})