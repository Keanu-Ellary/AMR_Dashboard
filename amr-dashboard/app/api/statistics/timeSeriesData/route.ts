import { timeSeriesData } from "@/functions/statistics/timeSeriesData";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const siteIdParam = url.searchParams.get("siteId");
    const dateRange = url.searchParams.get("dateRange") || "30days";

    if (!siteIdParam) {
        return Response.json({ error: "Missing siteId" }, { status: 400 });
    }

    const siteId = parseInt(siteIdParam, 10);
    const res = await timeSeriesData(siteId, dateRange);

    return Response.json(res.body, { status: res.statusCode });
}
