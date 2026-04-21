import { getUsers } from "@/functions/users/getUsers";
import { register } from "@/functions/users/registerUser";

export async function GET() 
{
    const res = await getUsers();

    return Response.json(res.body, {
        status: res.statusCode,
    });
};

export async function POST(req: Request) 
{
    const body = await req.json();

    const res = await register(body);

    return Response.json(res.body, {
        status: res.statusCode
    });
};