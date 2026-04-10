import { getUsers } from "@/functions/users/getUsers";
import { mockPrisma } from "../helpers/mockPrisma";

describe("getUsers", () => {
    it("should return users without selecting password field", async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            {
                id: 1,
                name: 'John',
                surname: 'Smith',
                email: 'admin1@gmail.com',
            },
        ]);

        mockPrisma.adminUser.findMany.mockResolvedValue([
            {
                id: 2,
                name: "Admin",
                surname: "User",
                email: "admin@gmail.com",
            }
        ]);

        const res = await getUsers();
        expect(res.statusCode).toBe(200);

        expect(res.body.usersNormal).toHaveLength(1);
        expect(res.body.adminUsers).toHaveLength(1);
        
        const user = res.body.usersNormal?.[0];

        expect(user).toBeDefined();

        expect(user).toEqual(
        {
            id: 1,
            name: 'John',
            surname: 'Smith',
            email: 'admin1@gmail.com',
        });

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
            }
        });
    });
});