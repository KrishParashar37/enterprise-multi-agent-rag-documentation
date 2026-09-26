import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "services";
  
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/${type}`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { serviceId, action } = await req.json();
    const res = await fetch(`http://127.0.0.1:8000/api/admin/circuit-breaker/${serviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update circuit breaker" }, { status: 500 });
  }
}
