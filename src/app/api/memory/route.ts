import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "timeline"; // timeline, stats
  
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/memory/${type}`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch memory data" }, { status: 500 });
  }
}
