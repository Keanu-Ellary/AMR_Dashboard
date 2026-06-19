import { login } from "@/functions/auth/login";
import { mockPrisma } from "../helpers/mockPrisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("bcrypt", () => ({
    compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn().mockReturnValue("mocked_jwt_token")
}));

describe("login", () => {
    it("should login user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: "user@gmail.com",
            password: "hashedPassword",
            name: "John",
            surname: "Smith",
        });

        mockPrisma.adminUser.findUnique.mockResolvedValue(null);

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const res = await login({
            email: "user@gmail.com",
            password: "userPassword",
        });

        expect(res?.statusCode).toBe(200);
        expect(jwt.sign).toHaveBeenCalled();
        expect(res?.body.jwtToken).toBe("mocked_jwt_token");
    });

    it("should fail if password is incorrect", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: "user@gmail.com",
            password: "hashedPassword",
            name: "John",
            surname: "Smith",
        });

        mockPrisma.adminUser.findUnique.mockResolvedValue(null);

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const res = await login({
            email: "user@gmail.com",
            password: "wrongPassword",
        });

        expect(res?.statusCode).toBe(401);
        expect(res?.body.error).toBeDefined();
    });

    it("should return 401 if user is not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.adminUser.findUnique.mockResolvedValue(null);

        const res = await login({
            email: "doesnotexist@gmail.com",
            password: "password",
        });

        expect(res?.statusCode).toBe(401);
    })
});