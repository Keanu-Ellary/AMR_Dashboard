// get normal users
import {prisma} from "../../lib/db"
import { adminNeeded } from "@/lib/middleware/authMiddleware";

export async function getUsers(token: string)
{
    try{

        const authorize = adminNeeded(token);
            
            if (!authorize.authorized)
            {
                return {
                    statusCode: authorize.statusCode,
                    body: {error: authorize.message}
                };
            }
        

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
            body: {adminUsers},
        };
    } catch(error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Failed to fetch users"},
        };
    }
}