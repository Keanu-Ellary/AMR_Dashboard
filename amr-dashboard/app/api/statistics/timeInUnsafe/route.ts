import { timeInUnsafe } from "@/functions/statistics/timeInUnsafe";

export async function GET(
    _req: Request,
    {params}: {params: {id: string}}
) {
    const siteId = parseInt(params.id);
    
    if (isNaN(siteId))
    {
        return Response.json(
            {error: "Invalid Site ID"},
            {status: 400}
        );
    }

    const res = await timeInUnsafe(siteId);

    return Response.json(res.body, {
        status: res.statusCode
    });
}