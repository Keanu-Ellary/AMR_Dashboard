import { login } from "@/functions/auth/login";

export async function POST(req: Request)
{
    const body = await req.json();

    const res = await login({
        email: body.email,
        password: body.password
    });

    return Response.json(res?.body, {
        status: res?.statusCode
    });
}