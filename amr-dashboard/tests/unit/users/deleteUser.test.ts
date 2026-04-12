import { deleteUser } from "@/functions/users/deleteUser";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";

describe("deleteUser", () => {
    it("should delete user if admin", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.user.delete.mockResolvedValue({id: 1});

        const res = await deleteUser(1, "validToken");

        expect(res.statusCode).toBe(200);
    });

    it("should return 403 if not authorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 403,
            message: "Forbidden: Admins only",
        });

        const res = await deleteUser(1, "badToken");

        expect(res.statusCode).toBe(403);
    })
})