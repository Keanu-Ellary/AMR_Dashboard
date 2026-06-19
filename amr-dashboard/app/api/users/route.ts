import { getUsers } from "@/functions/users/getUsers";
import { register } from "@/functions/users/registerUser";

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
}

export async function POST(req: Request) {
    const body = await req.json();

    const res = await register({
        name: body.name,
        surname: body.surname,
        email: body.email,
        password: body.password,
    });

    return Response.json(res.body, {
        status: res.statusCode,
    });
}