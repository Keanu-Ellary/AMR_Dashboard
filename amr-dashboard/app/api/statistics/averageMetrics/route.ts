import { averageMetrics } from "@/functions/statistics/averageMetrics";

export async function GET()
{
    const res = await averageMetrics();

    return Response.json(res.body, {
        status: res.statusCode
    });
}