// get normal users
import {prisma} from "../../lib/db"

export async function getUsers()
{
    try{
        const usersNormal = await prisma.user.findMany();

        return {
            statusCode: 200,
            body: usersNormal,
        };
    } catch(error) {
        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({error: "Failed to fetch users"}),
        };
    }
}