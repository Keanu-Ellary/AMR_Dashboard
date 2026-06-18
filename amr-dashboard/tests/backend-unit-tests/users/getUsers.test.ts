import { getUsers } from "@/functions/users/getUsers";
import { mockPrisma } from "../helpers/mockPrisma";

jest.mock("@/lib/middleware/authMiddleware", () => ({
    adminNeeded: jest.fn().mockReturnValue({ authorized: true})
}));

describe("getUsers", () => {
    it("should return users without selecting password field", async () => {
        mockPrisma.adminUser.findMany.mockResolvedValue([
            {
                id: 2,
                name: "Admin",
                surname: "User",
                email: "admin@gmail.com",
            }
        ]);

        const res = await getUsers("validToken");
        expect(res.statusCode).toBe(200);

        expect(res.body.adminUsers).toHaveLength(1);

        expect(mockPrisma.adminUser.findMany).toHaveBeenCalledWith({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        });
    });
});