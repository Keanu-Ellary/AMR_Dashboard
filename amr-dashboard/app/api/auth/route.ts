import { login } from "@/functions/auth/login";
import { cookies } from "next/headers";

const ONE_HOUR = 60 * 60;

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
            cookieStore.set('user', JSON.stringify({ token: res.body.jwtToken, isAdmin: isAdmin }), {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: ONE_HOUR
            });
        }
    }

    return Response.json(res?.body, {
        status: res?.statusCode
    });
}

function decodeJwt(token: string) {
    const jwtData = token.split(".")[1];
    const decodedData = Buffer.from(jwtData, "base64").toString("utf-8");
    return JSON.parse(decodedData);
}