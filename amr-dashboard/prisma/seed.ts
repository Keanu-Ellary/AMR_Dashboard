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
                password: "$2a$10$CTqHkBOLwZrL2EtOtt6vdOAT9.l4upP9qfahGkUw4A13UVbrewPqO",
            },
            {
                name: "Jackson",
                surname: "Doe",
                email: "JackAdmin@gmail.com",
                isAdmin: true,
                password: "$2a$10$.8f4aTZ47fwjwd0P3.yZze6vxJ11WGT9vu1gwaFRmCAmi2z4WdJ/i",
            },
            {
                name: "Tony",
                surname: "Stark",
                email: "tony@industries.com",
                isAdmin: true,
                password: "$2a$10$m/eQJJ46DgsuQ1l2RsFbCOd6Xkcm105bKdyd6pX9RlDznutaHyZ5W"
            }
        ],
        skipDuplicates: true,
    });

    await prisma.user.createMany({
        data: [
            {
                name: "Adam",
                surname: "Groove",
                email: "AdGroo@gmail.com",
                password: "$2a$10$wm7BNrOIxDcyXNCg1lRKdePG6PnowlE8pUyn2YwaBJdd/0neDuu4a",
            },
            {
                name: "Alice",
                surname: "Map",
                email: "Alice@gmail.com",
                password: "$2a$10$Q7BL50faig/TfvElda6JrOGXqRcpeI2tUpg/5FCtu4cZQHYqiMbMy"
            },
        ],
        skipDuplicates: true,
    });

    await prisma.siteData.createMany({
        data: [
            {
                dangerZone: "red",
                latitude: -26.8075,
                longitude: 29.8875,
                temperature: 22,
                ph: 6.7,
                tds: 120,
                ec: 1.5,
                dissolvedO2: 8.1,
                adminId: 3
            },
            {
                dangerZone: "yellow",
                latitude: -64.8075,
                longitude: 34.8875,
                temperature: 20,
                ph: 7.4,
                tds: 300,
                ec: 1.5,
                dissolvedO2: 8.1,
                adminId: 3
            }
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