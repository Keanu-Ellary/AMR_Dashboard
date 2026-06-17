import {prisma} from "../../lib/db";
import { adminNeeded } from "../../lib/middleware/authMiddleware";

export async function deleteAdmin(id: number, token: string) {
    const authorize = adminNeeded(token);

    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        await prisma.adminUser.delete({
            where: {id}
        });

        return {
            statusCode: 200,
            body: {error: "Admin successfully deleted"}
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any)
    {
        console.error(error);

        if(error.code === "P2025")
        {
            return {
                statusCode: 404,
                body: {error: "Admin not found"}
            };
        }

        return {
            statusCode: 500,
            body: {error: "Failed to delete admin"}
        };
    }
}