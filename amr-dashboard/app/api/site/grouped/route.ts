import { getAllSitesGrouped } from "@/functions/site/getAllSitesGrouped";

export async function GET() {
    const res = await getAllSitesGrouped();

    return Response.json(res.body, {
        status: res.statusCode,
    });
}
