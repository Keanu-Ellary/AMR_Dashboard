import { cookies } from "next/headers";

export async function getUserFromCookies() {
    const cookieData = await cookies();
    const user = cookieData.get("user");

    if (!user) {
        return null;
    }
    return JSON.parse(user.value);
}