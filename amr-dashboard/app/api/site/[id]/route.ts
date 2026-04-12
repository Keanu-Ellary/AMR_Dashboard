import { getSiteById } from "@/functions/site/getSiteById";
import { updateSite } from "@/functions/site/updateSite";
import { deleteSite } from "@/functions/site/deleteSite";

export async function GET(
    _req : Request,
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

    const res = await getSiteById(siteId);

    return Response.json(res.body, {
        status: res.statusCode
    });
};

export async function PATCH(
    req : Request,
    {params}: {params: {id: string}}
) {
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];

    const siteId = parseInt(params.id);
    
    if (isNaN(siteId))
    {
        return Response.json(
            {error: "Invalid User ID"},
            {status: 400}
        );
    }

    const body = await req.json();

    const res = await updateSite(token, siteId, body);

    return Response.json(res.body, {
        status: res.statusCode
    });
}

export async function DELETE(
    req : Request,
    {params}: {params: {id: string}}
) {
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];

     const { id } = await params;
    const siteId = parseInt(id);
    
    if (isNaN(siteId))
    {
        return Response.json(
            {error: "Invalid Site ID"},
            {status: 400}
        );
    }

    const res = await deleteSite(token, siteId);

    return Response.json(res.body, {
        status: res.statusCode
    });
}