import { getOverviewStats } from "@/functions/statistics/overview";

export async function GET() {
  const res = await getOverviewStats();
  return Response.json(res.body, { status: res.statusCode });
}
