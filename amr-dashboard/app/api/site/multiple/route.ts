import { uploadMultipleSiteData } from "@/functions/site/uploadSiteData";

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

    const fileData = await req.formData();
    const file = fileData.get("file") as File;

    const res = await uploadMultipleSiteData(token, file);

    return Response.json(res.body, {
        status: res.statusCode
    });
}