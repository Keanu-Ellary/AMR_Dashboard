import { deleteUser } from "@/functions/users/deleteUser";
import { getUserById } from "@/functions/users/getUserById";
import { updateUser } from "@/functions/users/updateUser";

export async function GET(
    _req : Request,
    {params}: {params: {id: string}}
) {
    const userId = parseInt(params.id);

    if (isNaN(userId))
    {
        return Response.json(
            {error: "Invalid User ID"},
            {status: 400}
        );
    }

    const res = await getUserById(userId);

    return Response.json(res.body, {
        status: res.statusCode
    });
}

export async function PATCH(
    req: Request,
    {params}: {params: {id: string}}
) {
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];
    const userId = parseInt(params.id);

    if (isNaN(userId))
    {
        return Response.json(
            {error: "Invalid User ID"},
            {status: 400}
        );
    }

    const body = await req.json();

    const res = await updateUser(userId, token, body);

    return Response.json(res.body, {
        status: res.statusCode
    });
};

export async function DELETE(
    req: Request,
    {params}: {params: {id: string}}
) {
    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];
    const userId = parseInt(params.id);

    if (isNaN(userId))
    {
        return Response.json(
            {error: "Invalid User ID"},
            {status: 400}
        );
    }

    const res = await deleteUser(userId, token);

    return Response.json(res.body, {
        status: res.statusCode
    });
}