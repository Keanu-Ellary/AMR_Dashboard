import { prisma } from "../../lib/db";
import { adminNeeded } from "../../lib/middleware/authMiddleware";

export async function logChange(
    entityType: string,
    entityId: number,
    action: string,
    previousData: any,
    newData: any,
    adminId: number
) {
    try {
        const changeLog = await prisma.changeLog.create({
            data: {
                entityType,
                entityId,
                action,
                previousData: previousData ? JSON.stringify(previousData) : null,
                newData: newData ? JSON.stringify(newData) : null,
                changedBy: adminId,
            },
        });

        return {
            statusCode: 201,
            body: { changeLog },
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: { error: "Failed to create change log" },
        };
    }
}

export async function getChangeLogs(
    page?: number,
    limit?: number,
    action?: string,
    entityType?: string
) {
    try {
        const currentPage = page || 1;
        const currentLimit = limit || 50;
        const skip = (currentPage - 1) * currentLimit;

        const where: any = {};

        if (action) {
            where.action = action;
        }

        if (entityType) {
            where.entityType = entityType;
        }

        const [changeLogs, total] = await Promise.all([
            prisma.changeLog.findMany({
                where,
                orderBy: { changedAt: "desc" },
                skip,
                take: currentLimit,
                include: {
                    admin: {
                        select: {
                            name: true,
                            surname: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.changeLog.count({ where }),
        ]);

        return {
            statusCode: 200,
            body: {
                changeLogs,
                total,
                page: currentPage,
                limit: currentLimit,
            },
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: { error: "Failed to fetch change logs" },
        };
    }
}

export async function undoChange(changeLogId: number, adminToken: string) {
    const authorize = adminNeeded(adminToken);

    if (!authorize.authorized) {
        return {
            statusCode: authorize.statusCode,
            body: { error: authorize.message },
        };
    }

    try {
        const changeLog = await prisma.changeLog.findUnique({
            where: { id: changeLogId },
        });

        if (!changeLog) {
            return {
                statusCode: 404,
                body: { error: "Change log not found" },
            };
        }

        if (changeLog.undone) {
            return {
                statusCode: 400,
                body: { error: "This change has already been undone" },
            };
        }

        let undoneLog;

        switch (changeLog.action) {
            case "CREATE": {
                await prisma.siteData.delete({
                    where: { id: changeLog.entityId },
                });

                undoneLog = await prisma.changeLog.create({
                    data: {
                        entityType: changeLog.entityType,
                        entityId: changeLog.entityId,
                        action: "UNDO_CREATE",
                        previousData: changeLog.newData,
                        newData: null,
                        changedBy: authorize.user!.userId,
                    },
                });

                break;
            }

            case "UPDATE": {
                if (!changeLog.previousData) {
                    return {
                        statusCode: 400,
                        body: { error: "No previous data available to restore" },
                    };
                }

                const previousData = JSON.parse(changeLog.previousData);

                await prisma.siteData.update({
                    where: { id: changeLog.entityId },
                    data: previousData,
                });

                undoneLog = await prisma.changeLog.create({
                    data: {
                        entityType: changeLog.entityType,
                        entityId: changeLog.entityId,
                        action: "UNDO_UPDATE",
                        previousData: changeLog.newData,
                        newData: changeLog.previousData,
                        changedBy: authorize.user!.userId,
                    },
                });

                break;
            }

            case "DELETE": {
                if (!changeLog.previousData) {
                    return {
                        statusCode: 400,
                        body: { error: "No previous data available to restore" },
                    };
                }

                const restoredData = JSON.parse(changeLog.previousData);

                const {
                    id,
                    admin,
                    images,
                    imageBatches,
                    createdAt,
                    ...cleanData
                } = restoredData;

                const recreated = await prisma.siteData.create({
                    data: {
                        ...cleanData,
                        adminId: changeLog.changedBy,
                    },
                });

                undoneLog = await prisma.changeLog.create({
                    data: {
                        entityType: changeLog.entityType,
                        entityId: recreated.id,
                        action: "UNDO_DELETE",
                        previousData: null,
                        newData: JSON.stringify(recreated),
                        changedBy: authorize.user!.userId,
                    },
                });

                break;
            }

            case "BULK_DELETE": {
                if (!changeLog.previousData) {
                    return {
                        statusCode: 400,
                        body: { error: "No previous data available to restore" },
                    };
                }

                const restoredList = JSON.parse(changeLog.previousData);
                if (!Array.isArray(restoredList)) {
                    return {
                        statusCode: 400,
                        body: { error: "Invalid bulk delete data format" },
                    };
                }

                const recreatedRecords: any[] = [];

                for (const restoredData of restoredList) {
                    const {
                        id,
                        admin,
                        images,
                        imageBatches,
                        createdAt,
                        ...cleanData
                    } = restoredData;

                    const recreated = await prisma.siteData.create({
                        data: {
                            ...cleanData,
                            adminId: changeLog.changedBy,
                        },
                    });
                    
                    recreatedRecords.push(recreated);
                }

                undoneLog = await prisma.changeLog.create({
                    data: {
                        entityType: changeLog.entityType,
                        entityId: 0,
                        action: "UNDO_BULK_DELETE",
                        previousData: null,
                        newData: JSON.stringify(recreatedRecords),
                        changedBy: authorize.user!.userId,
                    },
                });

                break;
            }

            case "BULK_CREATE": {
                if (!changeLog.newData) {
                    return {
                        statusCode: 400,
                        body: { error: "No new data available to revert" },
                    };
                }

                const createdList = JSON.parse(changeLog.newData);
                if (!Array.isArray(createdList)) {
                    return {
                        statusCode: 400,
                        body: { error: "Invalid bulk create data format" },
                    };
                }

                const createdIds = createdList.map((item: any) => item.id).filter(Boolean);

                if (createdIds.length > 0) {
                    await prisma.siteData.deleteMany({
                        where: { id: { in: createdIds } },
                    });
                }

                undoneLog = await prisma.changeLog.create({
                    data: {
                        entityType: changeLog.entityType,
                        entityId: 0,
                        action: "UNDO_BULK_CREATE",
                        previousData: changeLog.newData,
                        newData: null,
                        changedBy: authorize.user!.userId,
                    },
                });

                break;
            }

            default: {
                return {
                    statusCode: 400,
                    body: { error: `Cannot undo action: ${changeLog.action}` },
                };
            }
        }

        await prisma.changeLog.update({
            where: { id: changeLogId },
            data: { undone: true },
        });

        return {
            statusCode: 200,
            body: { message: "Change successfully undone", undoneLog },
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: { error: "Failed to undo change" },
        };
    }
}
