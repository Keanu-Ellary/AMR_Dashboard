import { deleteSitesBulk } from "@/functions/site/deleteSitesBulk";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
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

  try {
    const filters = await req.json();

    const res = await deleteSitesBulk(token, filters);

    return Response.json(res.body, {
      status: res.statusCode,
    });
  } catch (error) {
    console.error("Bulk delete request failed:", error);
    return Response.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
