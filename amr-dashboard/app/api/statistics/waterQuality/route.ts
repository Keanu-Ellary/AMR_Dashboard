import { waterQualityIndex } from "@/functions/statistics/waterQualityIndex";

export async function GET(req: Request)
{
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") ? parseInt(searchParams.get("siteId")!) : undefined;
    
    if (!siteId) {
        return Response.json({ error: "siteId is required" }, { status: 400 });
    }

    const res = await waterQualityIndex(siteId);

    return Response.json(res.body, {
        status: res.statusCode
    });
}