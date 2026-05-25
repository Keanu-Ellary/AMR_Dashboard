import { getChangeLogs } from "@/functions/changelog/changeLog";
import { adminNeeded } from "@/lib/middleware/authMiddleware";

import { cookies } from "next/headers";

export async function GET(req: Request) {
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

    const authorize = adminNeeded(token);

    if (!authorize.authorized) {
        return Response.json(
            { error: authorize.message },
            { status: authorize.statusCode }
        );
    }

    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const res = await getChangeLogs(
        page ? parseInt(page) : undefined,
        limit ? parseInt(limit) : undefined,
        action || undefined,
        entityType || undefined
    );

    if (res.statusCode === 200 && res.body) {
        return Response.json({
            data: (res.body as any).changeLogs,
            total: (res.body as any).total,
            page: (res.body as any).page,
            limit: (res.body as any).limit
        }, {
            status: 200,
        });
    }

    return Response.json(res.body, {
        status: res.statusCode,
    });
}
