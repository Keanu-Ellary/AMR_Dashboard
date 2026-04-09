// get normal users
import {prisma} from "../../lib/db"

export async function getUsers()
{
    try{
        const usersNormal = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        });
        const adminUsers = await prisma.adminUser.findMany({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        });

        return {
            statusCode: 200,
            body: {usersNormal, adminUsers},
        };
    } catch(error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch users"},
        };
    }
}