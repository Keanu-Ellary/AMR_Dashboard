import { login } from "@/functions/auth/login";
import { cookies } from "next/headers";

export async function POST(req: Request)
{
    const body = await req.json();

    const res = await login({
        email: body.email,
        password: body.password
    });

    if (res?.statusCode === 200)
    {
        const userData = res.body;
        const {isAdmin } = decodeJwt(userData?.jwtToken?.toString() || "");

        if (isAdmin) {
            const cookieStore = await cookies();
            cookieStore.set('user', JSON.stringify({ email: res.body.user?.email , isAdmin: isAdmin}), {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 //1 hour
            });
        }
    }

    return Response.json(res?.body, {
        status: res?.statusCode
    });
}

function decodeJwt(token: string) {
    const payload = token.split(".")[1];
    const decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decodedPayload);
}