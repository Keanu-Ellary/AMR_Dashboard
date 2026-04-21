import { getAllSites } from "@/functions/site/getAllSites";
import { getSiteByDate } from "@/functions/site/getSiteByDate";
import { getSiteByLocation } from "@/functions/site/getSiteByLocation";
import { getSiteByZone } from "@/functions/site/getSiteByZone";
import { uploadSiteData } from "@/functions/site/uploadSiteData";

export async function GET(req: Request) {
    const {searchParams} = new URL(req.url);

    // dates
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // location
    const minLat = searchParams.get("minLat");
    const maxLat = searchParams.get("maxLat");
    const minLong = searchParams.get("minLong");
    const maxLong = searchParams.get("maxLong");

    // zone
    const zone = searchParams.get("zone");

    if (startDate && endDate)
    {
        const res = await getSiteByDate({
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        return Response.json(res.body, {
            status: res.statusCode
        });
    }

    if (minLat && maxLat && minLong && maxLong)
    {
        const res = await getSiteByLocation({
            minLat: parseFloat(minLat),
            maxLat: parseFloat(maxLat),
            minLong: parseFloat(minLong),
            maxLong: parseFloat(maxLong)
        });

        return Response.json(res.body, {
            status: res.statusCode
        });
    }

    if (zone)
    {
        if (zone !== "red" && zone !== "yellow")
        {
            return Response.json(
                {error: "Zone must be red or yellow"},
                {status: 500}
            );
        }

        const res = await getSiteByZone(zone as "red" | "yellow");

        return Response.json(res.body, {
            status: res.statusCode
        });
    }

    const res = await getAllSites();

    return Response.json(res.body, {
        status: res.statusCode
    });
};

export async function POST(req: Request) {
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];

    const body = await req.json();

    const {imageBase64, ...restOfBody} = body;

    const res = await uploadSiteData(token, restOfBody, imageBase64);

    return Response.json(res.body, {
        status: res.statusCode
    });
}