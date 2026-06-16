import {prisma} from "@/lib/db"

export const mockPrisma = prisma as unknown as {
    user: {
        findMany: jest.Mock,
        findUnique: jest.Mock,
        create: jest.Mock,
        update: jest.Mock,
        delete: jest.Mock,
    },
    adminUser: {
        findMany: jest.Mock,
        findUnique: jest.Mock,
        create: jest.Mock,
    },
    siteData: {
        findMany: jest.Mock,
        findUnique: jest.Mock,
        create: jest.Mock,
        createMany: jest.Mock,
        update: jest.Mock,
        delete: jest.Mock,
    },
    siteImage: {
        createMany: jest.Mock,
    },
    siteImageBatch: {
        create: jest.Mock,
    },
}