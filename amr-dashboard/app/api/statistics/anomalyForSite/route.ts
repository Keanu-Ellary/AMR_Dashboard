import { anomalyForSite } from "@/functions/statistics/anomaly";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") ? parseInt(searchParams.get("siteId")!) : undefined;
    
    if (!siteId || isNaN(siteId))
    {
        return Response.json(
            {error: "Invalid Site ID"},
            {status: 400}
        );
    }

    const res = await anomalyForSite(siteId);

    return Response.json(res.body, {
        status: res.statusCode
    });
}
