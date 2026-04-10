import { registerAdmin } from "@/functions/users/registerAdmin";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

describe("registerAdmin", () => {
    it("should create an admin if authorized", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: true,
            user: {
                userId: 1,
                isAdmin: true,
            },
        });

        mockPrisma.adminUser.create.mockResolvedValue({
            id: 1,
            name: "Admin",
            surname: "User",
            email: "adminU@gmail.com",
        });

        const res = await registerAdmin("validToken", {
            name: "Admin",
            surname: "User",
            email: "adminU@gmail.com",
            password: "plainPassword",
        });

        expect(res.statusCode).toBe(201);
        expect(bcrypt.hash).toHaveBeenCalledWith("plainPassword", 10);
    });

    it("should fail if not admin", async () => {
        (adminNeeded as jest.Mock).mockReturnValue({
            authorized: false,
            statusCode: 403,
            message: "Forbidden: Admins only",
        });

        const res = await registerAdmin("badToken", {
            name: "Admin",
            surname: "User",
            email: "adminU@gmail.com",
            password: "plainPassword",
        });

        expect(res.statusCode).toBe(403);
    })
});