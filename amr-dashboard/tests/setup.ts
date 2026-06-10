beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
});

jest.mock("@/lib/middleware/authMiddleware", () => ({
    adminNeeded: jest.fn()
}));

jest.mock("@/lib/db", () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        adminUser: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        siteData: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        siteImage: {
            createMany: jest.fn(),
        },
        siteImageBatch: {
            create: jest.fn(),
        },
    },
}));

afterEach(() => {
    jest.clearAllMocks();
});