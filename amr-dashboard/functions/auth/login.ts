import { prisma } from "../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function login(data:{
    email: string;
    password: string;
}) {
    try {
        const foundUser = await prisma.user.findUnique({
            where: {email: data.email}
        });

        const foundAdmin = await prisma.adminUser.findUnique({
            where: {email: data.email}
        });

        if (!foundUser && !foundAdmin)
        {
            return {
                statusCode: 401,
                body: {error: "User not found"}
            };
        }

        if (foundUser && !foundAdmin)
        {
            const validPassword = await bcrypt.compare(data.password, foundUser.password);

            if (!validPassword)
            {
                return {
                    statusCode: 401,
                    body: {error: "Invalid email or password"}
                };
            }

            const jwtToken = jwt.sign(
                {
                    userId: foundUser.id,
                    email: foundUser.email,
                    isAdmin: false
                },
                process.env.JWT_SECRET as string,
                {expiresIn: "1h"}
            );

            return {
                statusCode: 200,
                body: {
                    jwtToken,
                    user: {
                        id: foundUser.id,
                        name: foundUser.name,
                        surname: foundUser.surname,
                        email: foundUser.email
                    }
                }
            };
        }

        if (!foundUser && foundAdmin)
        {
            const validPassword = await bcrypt.compare(data.password, foundAdmin.password);

            if (!validPassword)
            {
                return {
                    statusCode: 401,
                    body: {error: "Invalid email or password"}
                };
            }

            const jwtToken = jwt.sign(
                {
                    userId: foundAdmin.id,
                    email: foundAdmin.email,
                    isAdmin: true
                },
                process.env.JWT_SECRET as string,
                {expiresIn: "1h"}
            );

            return {
                statusCode: 200,
                body: {
                    jwtToken,
                    user: {
                        id: foundAdmin.id,
                        name: foundAdmin.name,
                        surname: foundAdmin.surname,
                        email: foundAdmin.email
                    }
                }
            };
        }
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: {error: "Login failed"}
        };
    }
}