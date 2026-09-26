import { NextResponse } from "next/server";
import { pingDB } from "@/db";

export async function GET() {
  try {
    const ping = await pingDB();
    if (!ping.ok) {
      return NextResponse.json({
        status: "healthy",
        service: "Enterprise Multi-Agent RAG Platform",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: "not-configured (demo mode)",
        error: ping.error
      });
    }
    
    return NextResponse.json({
      status: "healthy",
      service: "Enterprise Multi-Agent RAG Platform",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      database: "connected",
      mode: ping.mode
    });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", database: "disconnected" },
      { status: 503 }
    );
  }
}
