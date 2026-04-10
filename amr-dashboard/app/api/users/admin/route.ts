import { registerAdmin } from "@/functions/users/registerAdmin";

export async function POST(req: Request) {
    const body = await req.json();

    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];

    const res = await registerAdmin(token, body);

    return Response.json(res.body, {
        status: res.statusCode
    });
}