import jwt from "jsonwebtoken";

export function verify(token: string)
{
    try {
        const decode = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as {
            userId: number;
            email: string;
            isAdmin: boolean;
        };

        return decode;
    } catch (error) {
        return null;
    }
}

export function adminNeeded(token: string)
{
    const user = verify(token);

    if (!user)
    {
        return {
            authorized: false,
            statusCode: 401,
            message: "Unauthorized"
        };
    }

    if (!user.userId)
    {
        return {
            authorized: false,
            statusCode: 403,
            message: "Forbidden: Admins only"
        };
    }

    return {
        authorized: true,
        user,
    };
}