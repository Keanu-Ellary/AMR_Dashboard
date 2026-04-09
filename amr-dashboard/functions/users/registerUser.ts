import { prisma } from "../../lib/db";
import bcrypt from "bcrypt";

export async function register(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
}) {
    try {
        const hashed = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                surname: data.surname,
                email: data.email,
                password: hashed,
            },
        });

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