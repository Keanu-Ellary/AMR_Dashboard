import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { prisma } from "../../lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../../lib/email";

export async function registerAdmin(token: string, data: {
    name: string;
    surname: string;
    email: string;
}) {
    const authorize = adminNeeded(token);
    
    if (!authorize.authorized)
    {
        return {
            statusCode: authorize.statusCode,
            body: {error: authorize.message}
        };
    }

    try {
        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashed = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.adminUser.create({
            data: {
                name: data.name,
                surname: data.surname,
                email: data.email,
                password: hashed,
                isAdmin: true,
                mustChangePassword: true
            },
        });

        await sendEmail(
            newUser.email,
            "Welcome to AMR Dashboard",
            `<p>Your admin account has been created.</p>
            <p>Email: ${newUser.email}</p>
            <p>Temporary Password: ${tempPassword}</p>
            <p>Please log in and change your password immediately.<p>`
        )

        return {
            statusCode: 201,
            body: {
                id: newUser.id,
                email: newUser.email,
            }
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch(error: any) {
        console.error(error);

        if(error.code === "P2002")
        {
            return {
                statusCode: 400,
                body: {
                    error: "Email already exists"
                }
            };
        }

        return {
            statusCode: 500,
            body: {
                error: "Failed to register user"
            }
        };
    }
}