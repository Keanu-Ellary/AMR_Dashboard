import { trendOverTime } from "@/functions/statistics/trendOverTime";
import { mockPrisma } from "../helpers/mockPrisma";

describe("trendOverTime", () => {
    it("should return improving trend", async () => {
        mockPrisma.siteData.findMany.mockResolvedValueOnce([
            {dangerZone: "yellow", createdAt: new Date()},
            {dangerZone: "yellow", createdAt: new Date()},
        ])
        .mockResolvedValueOnce([
            {dangerZone: "red", createdAt: new Date()},
            {dangerZone: "red", createdAt: new Date()}
        ]);

        const res = await trendOverTime(7);

        expect(res.statusCode).toBe(200);
        expect(res.body.trend).toBe("Improving");
    });

    it("should return worsening trend", async () => {
        mockPrisma.siteData.findMany.mockResolvedValueOnce([
            {dangerZone: "red", createdAt: new Date()},
            {dangerZone: "yellow", createdAt: new Date()},
        ])
        .mockResolvedValueOnce([
            {dangerZone: "yellow", createdAt: new Date()},
            {dangerZone: "yellow", createdAt: new Date()}
        ]);

        const res = await trendOverTime(7);

        expect(res.statusCode).toBe(200);
        expect(res.body.trend).toBe("Worsening");
    });

    it("should return stable trend", async () => {
        mockPrisma.siteData.findMany.mockResolvedValueOnce([
            {dangerZone: "yellow", createdAt: new Date()},
            {dangerZone: "yellow", createdAt: new Date()},
        ])
        .mockResolvedValueOnce([
            {dangerZone: "yellow", createdAt: new Date()},
            {dangerZone: "yellow", createdAt: new Date()}
        ]);

        const res = await trendOverTime(7);

        expect(res.statusCode).toBe(200);
        expect(res.body.trend).toBe("Stable");
    })
})