import {prisma} from "../../lib/db";
import { adminNeeded } from "../../lib/middleware/authMiddleware";

export async function deleteUser(id: number, token: string) {
    const authorize = adminNeeded(token);

    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        await prisma.user.delete({
            where: {id}
        });

        return {
            statusCode: 200,
            body: {error: "User successfully deleted"}
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any)
    {
        console.error(error);

        if(error.code === "P2025")
        {
            return {
                statusCode: 404,
                body: {error: "User not found"}
            };
        }

        return {
            statusCode: 500,
            body: {error: "Failed to delete user"}
        };
    }
}