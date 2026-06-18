import { registerAdmin } from "@/functions/users/registerAdmin";
import { mockPrisma } from "../helpers/mockPrisma";
import { adminNeeded } from "@/lib/middleware/authMiddleware";
import { sendEmail } from "@/lib/email";

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

jest.mock("../../../lib/email", () =>  ({
    sendEmail: jest.fn().mockResolvedValue(true),
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
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("id", 1);
        expect(sendEmail).toHaveBeenCalledTimes(1);
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
        });

        expect(res.statusCode).toBe(403);
    })
});