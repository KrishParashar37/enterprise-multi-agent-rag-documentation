import { NextRequest, NextResponse } from "next/server";
import { getAgentRuns } from "@/db/queries";
import { mockAgentStats } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const limit  = parseInt(new URL(req.url).searchParams.get("limit") || "20");
  const result = await getAgentRuns(limit);
  return NextResponse.json({ ...result, stats: mockAgentStats });
}
