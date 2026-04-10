import { register } from "@/functions/users/registerUser";
import { mockPrisma } from "../helpers/mockPrisma";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

describe("registerUser", () => {
    it("should register a new user", async () => {
        mockPrisma.user.create.mockResolvedValue({
            id: 1,
            name: 'John',
            surname: 'Smith',
            email: 'jSmith@gmail.com',
        });

        const res = await register({
            name: "John",
            surname: "Smith",
            email: "jSmith@gmail.com",
            password: "plainPassword",
        });

        expect(res.statusCode).toBe(201);

        expect(res.body).toEqual({
            id: 1,
            email: "jSmith@gmail.com"
        });

        expect(bcrypt.hash).toHaveBeenCalledWith("plainPassword", 10);

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
            data: {
                name: "John",
                surname: "Smith",
                email: "jSmith@gmail.com",
                password: "hashedPassword",
            }
        });
    });

    it("should return an error if email already exists", async () => {
        mockPrisma.user.create.mockRejectedValue(new Error("Unique constraint"));

        const res = await register({
            name: "John",
            surname: "Smith",
            email: "jSmith@gmail.com",
            password: "plainPassword",
        });

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    });
});