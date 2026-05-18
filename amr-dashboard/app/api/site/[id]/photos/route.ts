import { addPhotosToSite } from "@/functions/site/addPhotosToSite";

export async function POST(
    req: Request,
    {params}: {params: Promise<{id: string}>}
) {
    const {id} = await params;
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];

    const siteId = parseInt(id);
    
    if (isNaN(siteId))
    {
        return Response.json(
            {error: "Invalid User ID"},
            {status: 400}
        );
    }

    const body = await req.json();

    if (!body.images || !Array.isArray(body.images))
    {
        return Response.json(
            {error: "Images must be an array of base64 images"},
            {status: 400}
        );
    }

    const res = await addPhotosToSite(token, siteId, body.images, body.dateTaken, body.checkAlgae);

    return Response.json(res.body, {
        status: res.statusCode
    });
}