import { registerAdmin } from "@/functions/users/registerAdmin";
import { getUsers } from "@/functions/users/getUsers";
import { resetPassword } from "@/functions/users/resetPassword";
import { deleteAdmin } from "@/functions/users/deleteUser";

export async function POST(req: Request) {
    const body = await req.json();

    const auth = req.headers.get("authorization");

    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }

    const token = auth.split(" ")[1];
    const { data } = body;

    const res = await registerAdmin(token, data);

    return Response.json(
        res.body, {
        status: res.statusCode
    });
}

export async function GET(req: Request) 
{
    const auth = req.headers.get("authorization");
    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }
    const token = auth.split(" ")[1];

    const res = await getUsers(token);

    return Response.json(res.body, {
        status: res.statusCode,
    });
};

export async function PUT(req: Request)
{
    const body = await req.json();

    const { data } = body;

    const res = await resetPassword(data);

    return Response.json(
        res.body, {
        status: res.statusCode,
    });
}

export async function DELETE(req: Request)
{
    const body = await req.json();
    const auth = req.headers.get("authorization");
    if (!auth)
    {
        return Response.json(
            {error: "Missing token"},
            {status: 401}
        );
    }
    const token = auth.split(" ")[1];

    const res = await deleteAdmin(body, token);

    return Response.json(
        res.body, {
        status: res.statusCode,
    });
}