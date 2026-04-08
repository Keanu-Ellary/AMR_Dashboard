import { prisma } from "../../lib/db";

export async function getUserById(id: number) {
    try {
        const user = await prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            },
        });

        if (!user) {
            return {
                statusCode: 404,
                body: {
                    error: "User not found"
                }
            };
        }

        return {
            statusCode: 200,
            body: user,
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch user"}
        };
    }
}