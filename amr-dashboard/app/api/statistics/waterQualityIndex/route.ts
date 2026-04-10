import { waterQualityIndex } from "@/functions/statistics/waterQualityIndex";

export async function GET() {
    const res = await waterQualityIndex();

    return Response.json(res.body, {
        status: res.statusCode
    });
}