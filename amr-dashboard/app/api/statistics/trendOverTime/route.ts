import { trendOverTime } from "@/functions/statistics/trendOverTime";

export async function GET()
{
    const res = await trendOverTime(7);

    return Response.json(res.body, {
        status: res.statusCode
    });
}