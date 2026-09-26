import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "usage"; // usage, breakdown, invoices
  const period = searchParams.get("period") || "30d";
  
  try {
    let url = `http://127.0.0.1:8000/api/billing/${type}`;
    if (type === "usage") url += `?period=${period}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}
