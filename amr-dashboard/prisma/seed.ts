// default users
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main()
{
    await prisma.adminUser.createMany({
        data: [
            {
                name: "John",
                surname: "Smith",
                email: "admin1@gmail.com",
                isAdmin: true,
            },
            {
                name: "Jackson",
                surname: "Doe",
                email: "JackAdmin@gmail.com",
                isAdmin: true,
            },
        ],
        skipDuplicates: true,
    });

    await prisma.user.createMany({
        data: [
            {
                name: "Adam",
                surname: "Groove",
                email: "AdGroo@gmail.com",
            },
            {
                name: "Alice",
                surname: "Map",
                email: "Alice@gmail.com",
            },
        ],
        skipDuplicates: true,
    });

    console.log("Database seeded");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });