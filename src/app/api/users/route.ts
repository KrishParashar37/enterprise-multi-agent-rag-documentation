import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/db/queries";
import { getDB, hasDB } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = await getUsers({
    search: searchParams.get("search") || undefined,
    role:   searchParams.get("role")   || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "name, email, password required" }, { status: 400 });

  if (!hasDB()) {
    return NextResponse.json({ user: { id: `user-${Date.now()}`, name, email, role: role || "EMPLOYEE", isActive: true, createdAt: new Date() } }, { status: 201 });
  }

  const db = await getDB();
  const passwordHash = await hashPassword(password);
  try {
    const [row] = await db.insert(users).values({ name, email, passwordHash, role: (role || "EMPLOYEE") as any }).$returningId();
    return NextResponse.json({ user: { id: row.id, name, email, role: role || "EMPLOYEE", isActive: true, createdAt: new Date() } }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("unique") || err?.message?.includes("Duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !hasDB()) return NextResponse.json({ success: true });
  const db = await getDB();
  const body = await req.json();
  await db.update(users).set({ ...body, updatedAt: new Date() }).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !hasDB()) return NextResponse.json({ success: true });
  const db = await getDB();
  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
