import { anomaliesPerSite } from "@/functions/statistics/anomaly";

export async function GET()
{
    const res = await anomaliesPerSite();

    return Response.json(res.body, {
        status: res.statusCode
    });
}