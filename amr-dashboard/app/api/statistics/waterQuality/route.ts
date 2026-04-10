import { waterQuality } from "@/functions/statistics/waterQuality";

export async function GET()
{
    const res = await waterQuality();

    return Response.json(res.body,{
        status: res.statusCode
    });
}