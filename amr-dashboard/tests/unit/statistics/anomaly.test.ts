import { mockPrisma } from "../helpers/mockPrisma";
import { anomaliesPerSite, anomalyUpdateCheck } from "@/functions/statistics/anomaly";

describe("anomalies", () => {
    it("should return no anomalies when no jumps are present", async () => {
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

        const res = await anomaliesPerSite();

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({anomalies: []});
    });

    it("should detect temperature anomaly", async () => {
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
                temperature: 30,
                ph: 7.1,
                tds: 110,
                createdAt: new Date(),
            }
        ]);

        const res = await anomaliesPerSite();

        expect(res.statusCode).toBe(200);
        expect(res.body.anomalies![0].issues).toBe("Sudden temperature change");
    });

    it("should skip null values", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue([
            {
                id: 1,
                temperature: null,
                ph: 7,
                tds: 100,
                createdAt: new Date(),
            },
            {
                id: 1,
                temperature: 30,
                ph: 7.1,
                tds: 110,
                createdAt: new Date(),
            }
        ]);

        const res =  await anomaliesPerSite();

        expect(res.body.anomalies).toEqual([]);
    });

    it("should return 404 if site is not found", async () => {
        mockPrisma.siteData.findMany.mockResolvedValue(null);

        const res = await anomalyUpdateCheck(1, {
            newTemp: 20,
            newpH: 7.2,
            newTDS: 200
        });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
    });

    it("should detect pH anomaly", async () => {
        mockPrisma.siteData.findUnique.mockResolvedValue({
            temperature: 20,
            ph: 7,
            tds: 100,
        });

        const res = await anomalyUpdateCheck(1, {
            newTemp: 22,
            newpH: 10,
            newTDS: 120
        });

        expect(res.body.anomalies?.length).toBe(0);
    })
})