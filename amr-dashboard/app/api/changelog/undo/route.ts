import { undoChange } from "@/functions/changelog/changeLog";

import { cookies } from "next/headers";

export async function POST(req: Request) {
    let token = "";

    // 1. Try to read token from HttpOnly cookie first
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");
    if (userCookie) {
        try {
            const userData = JSON.parse(userCookie.value);
            token = userData.token;
        } catch (e) {
            console.error("Failed to parse user cookie:", e);
        }
    }

    // 2. Fallback to Authorization header
    if (!token) {
        const auth = req.headers.get("authorization");
        if (auth) {
            token = auth.split(" ")[1];
        }
    }

    if (!token) {
        return Response.json(
            { error: "Missing token" },
            { status: 401 }
        );
    }

    const { changeLogId } = await req.json();

    if (!changeLogId) {
        return Response.json(
            { error: "changeLogId is required" },
            { status: 400 }
        );
    }

    const res = await undoChange(changeLogId, token);

    return Response.json(res.body, {
        status: res.statusCode,
    });
}
