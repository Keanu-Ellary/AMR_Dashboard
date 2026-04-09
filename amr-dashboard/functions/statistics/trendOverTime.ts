import {prisma} from "../../lib/db"

export async function trendOverTime(days = 7) {
    const now = new Date();
    const curr = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prev = new Date(curr.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
        prisma.siteData.findMany({
            where: {createdAt: {
                gte: curr,
                lte: now
            }}
        }),
        prisma.siteData.findMany({
            where: {createdAt: {
                gte: prev,
                lte: curr
            }}
        })
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const score = (sites: any[]) => sites.reduce((acc, s) => acc + (s.dangerZone === "red" ? 0 : 1), 0) / (sites.length || 1);

    const currScore = score(current);
    const prevScore = score(previous);

    let trend = "Stable";
    if (currScore > prevScore)
    {
        trend = "Improving";
    }
    if (currScore < prevScore)
    {
        trend = "Worsening";
    }

    return {
        statusCode: 200,
        body: {
            currScore, prevScore, trend
        }
    }
}