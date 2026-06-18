import { getUserById } from "@/functions/users/getUserById";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getUserById", () => {
    it("should return a user by ID witout the password", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(
        {
            id: 1,
            name: 'John',
            surname: 'Smith',
            email: 'jSmith@gmail.com',
        });

        const res = await getUserById(1);

        expect(res.statusCode).toBe(200);

        expect(res.body).toEqual({
            id: 1,
            name: 'John',
            surname: 'Smith',
            email: 'jSmith@gmail.com',
        });

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: {id: 1},
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        });
    });

    it("should return 404 if user is not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const res = await getUserById(999);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            error: "User not found",
        });
    });
});