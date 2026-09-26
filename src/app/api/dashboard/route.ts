import { NextResponse } from "next/server";
import { getDashboardStats } from "@/db/queries";
import { mockAgentStats, mockQueryTrend, mockLatencyDistribution, mockTokenUsage } from "@/lib/mock-data";

export async function GET() {
  const stats = await getDashboardStats();
  return NextResponse.json({
    kpis:       stats,
    agentStats: mockAgentStats,
    queryTrend: mockQueryTrend,
    latencyDist: mockLatencyDistribution,
    tokenUsage:  mockTokenUsage,
    timestamp:  new Date().toISOString(),
  });
}
