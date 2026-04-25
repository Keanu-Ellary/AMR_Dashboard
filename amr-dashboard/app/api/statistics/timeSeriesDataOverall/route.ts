import { timeSeriesDataOverall } from "@/functions/statistics/timeSeriesDataOverall";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const dateRange = url.searchParams.get("dateRange") || "30days";

    const res = await timeSeriesDataOverall(dateRange);

    return Response.json(res.body, { status: res.statusCode });
}
