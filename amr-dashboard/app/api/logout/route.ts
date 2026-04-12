import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete("user");

    return Response.json({ message: "Logged out successfully" }, { status: 200 });
}