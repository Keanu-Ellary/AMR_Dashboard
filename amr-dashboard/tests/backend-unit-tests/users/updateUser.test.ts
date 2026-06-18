import { updateUser } from "@/functions/users/updateUser";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";

describe("updateUser", () => {
    it("should update a user if admin", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.user.update.mockResolvedValue({
            id: 1,
            name: "Updated",
            surname: "User",
            email: "updated@gmail.com",
        });

        const res = await updateUser(1, "validToken", {
            name: "Updated"
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.user?.name).toBe("Updated");
    });

    it("should return 401 if not authorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 401,
            message: "Unauthorized",
        });

        const res = await updateUser(1, "badToken", {name: "Test"});

        expect(res.statusCode).toBe(401);
    });

    it("should handle errors", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.user.update.mockRejectedValue(new Error("fail"));
        
        const res = await updateUser(999, "validToken", {name: "Updated"});
        
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    })
});