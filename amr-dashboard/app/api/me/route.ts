import { cookies } from "next/headers";

export async function GET(req: Request)
{
    const cookieStore = await cookies();
    const user = cookieStore.get("user");

    if (!user) {
        return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({ user: JSON.parse(user.value) }, { status: 200 });
}