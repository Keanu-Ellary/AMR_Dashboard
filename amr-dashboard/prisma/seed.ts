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
                adminId: 3,
                sampleName: "Sample A",
                isolationSource: "River water",
                collectionDate: new Date("2026-04-01"),
                geoLocName: "Apies River - Point F",
                latitude: -26.8075,
                longitude: 29.6677,
                amrResGenes: "geneA, geneB",
                predictedSir: "Resistant",
                sampleAnalysisType: "Metagenomic",

                temperature: 22,
                dissolvedO2: 8.1,

                dangerZone: "red",
            },
            {
                adminId: 3,
                sampleName: "Sample B",
                isolationSource: "River water",
                collectionDate: new Date("2026-04-09"),
                geoLocName: "Apies River - Point Z",
                latitude: -66.8075,
                longitude: 49.6677,
                amrResGenes: "geneX",
                predictedSir: "Intermediate",
                sampleAnalysisType: "PCR",

                ph: 7.4,
                tds: 300,

                dangerZone: "yellow",
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