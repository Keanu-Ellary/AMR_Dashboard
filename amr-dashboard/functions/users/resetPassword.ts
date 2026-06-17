import { prisma } from "../../lib/db";
import bcrypt from "bcrypt";

export async function resetPassword(
    data: {
        email: string;
        tempPassword: string;
        newPassword: string;
    }
) {

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
        const admin = await prisma.adminUser.findUnique({
            where: {email: data.email},
            select: { id: true, password: true, mustChangePassword: true}
        })

        if (!admin) {
            return {
                statusCode: 404,
                body: {
                    error: "User not found"
                }
            };
        }
        
        const passwordValid = await bcrypt.compare(data.tempPassword, admin.password)
        if (!passwordValid) {
            return {
                statusCode: 401,
                body: {
                    error: "Temporary password is incorrect"
                }
            }
        }

        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
                password: hashedNewPassword,
                mustChangePassword: false
            }
        })
        return {
            statusCode: 200,
            body: {message: "Password updated successfully"},
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