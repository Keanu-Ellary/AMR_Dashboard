import { timeInUnsafe } from "@/functions/statistics/timeInUnsafe";
import { mockPrisma } from "../helpers/mockPrisma";

describe("timeInUnsafe", () => {
    it("should return 404 if site not found", async () => {
        mockPrisma.siteData.findUnique.mockResolvedValue(null);

        const res = await timeInUnsafe(1);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Site not found");
    });

    it("should calculate time", async () => {
        const fixedTime = new Date("2026-04-10T12:00:00Z");

        jest.useFakeTimers();
        jest.setSystemTime(fixedTime.getTime());

        mockPrisma.siteData.findUnique.mockResolvedValue({
            createdAt: new Date("2026-04-10T10:00:00Z")
        });

        const res = await timeInUnsafe(1);

        expect(res.statusCode).toBe(200);
        expect(res.body.totalRedTime).toBe(2);

        jest.useRealTimers();
    });
})