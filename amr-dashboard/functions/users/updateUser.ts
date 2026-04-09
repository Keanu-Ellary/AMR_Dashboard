import { prisma } from "../../lib/db";
import bcrypt from "bcrypt";
import { adminNeeded } from "../../lib/middleware/authMiddleware";

export async function updateUser(
    id: number,
    token: string,
    data: {
        name?: string;
        surname?: string;
        email?: string;
        password?: string;
    }
) {
    const authorize = adminNeeded(token);
    
    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
        let dataToUpdate: any = {...data};

        if (data.password)
        {
            dataToUpdate.password = await bcrypt.hash(data.password, 10);
        }

        const user = await prisma.user.update({
            where: {id},
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            },
        });

        return {
            statusCode: 200,
            body: {user},
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

        if (error.code === "P2002")
        {
            return {
                statusCode: 400,
                body: {error: "Email already exists"}
            };
        }

        return {
            statusCode: 500,
            body: {error: "Failed to update user"}
        };
    }
}