import { anomalyUpdateCheck } from "@/functions/statistics/anomaly";

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

    const body = await req.json()

    if (!body.temperature || !body.tds || !body.ph)
    {
        return Response.json(
            {"error": "Cannot perform anomaly check with missing data"},
            {status: 500}
        );
    }

    const res = await anomalyUpdateCheck(siteId, body);

    return Response.json(res.body, {
        status: res.statusCode
    });
}