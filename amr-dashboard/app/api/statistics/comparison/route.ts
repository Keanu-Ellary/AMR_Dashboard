import { getSiteComparison } from "@/functions/statistics/comparison";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const sitesParam = url.searchParams.get("sites");
    const dateRange = url.searchParams.get("dateRange") || "30days";
    const metricsParam =
        url.searchParams.get("metrics") || "ph,temperature,dissolvedO2,tds,wqi";

    if (!sitesParam) {
        return Response.json(
            { error: "Missing sites parameter" },
            { status: 400 }
        );
    }

    const sites = sitesParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (sites.length === 0) {
        return Response.json(
            { error: "At least one site name is required" },
            { status: 400 }
        );
    }

    const metrics = metricsParam
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

    const res = await getSiteComparison(sites, dateRange, metrics);

    return Response.json(res.body, { status: res.statusCode });
}
