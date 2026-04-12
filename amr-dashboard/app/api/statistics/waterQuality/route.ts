import { waterQuality } from "@/functions/statistics/waterQuality";

export async function GET(req: Request)
{
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") ? parseInt(searchParams.get("siteId")!) : undefined;
    
    const res = await waterQuality(siteId);

    return Response.json(res.body,{
        status: res.statusCode
    });
}