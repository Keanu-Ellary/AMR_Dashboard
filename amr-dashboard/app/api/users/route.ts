import { getUsers } from "@/functions/users/getUsers";

export async function GET(req: Request) 
{
    const auth = req.headers.get("authorization");
    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }
    const token = auth.split(" ")[1];

    const res = await getUsers(token);

    return Response.json(res.body, {
        status: res.statusCode,
    });
};