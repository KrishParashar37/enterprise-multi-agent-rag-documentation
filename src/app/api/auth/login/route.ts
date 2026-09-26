import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find user in DB (only if DB is connected)
    let user: any = null;
    if (db) {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = result[0] ?? null;
    }

    // Demo mode: if no DB or user not found, allow demo credentials
    if (!user) {
      const demoUsers: Record<string, { id: string; name: string; role: string; email: string }> = {
        "rahul@enterprise.com":  { id: "user-001", name: "Rahul Sharma",  role: "ADMIN",    email },
        "priya@enterprise.com":  { id: "user-002", name: "Priya Singh",   role: "MANAGER",  email },
        "amit@enterprise.com":   { id: "user-003", name: "Amit Kumar",    role: "ANALYST",  email },
        "sneha@enterprise.com":  { id: "user-004", name: "Sneha Gupta",   role: "EMPLOYEE", email },
      };

      const demo = demoUsers[email];
      if (!demo || password !== "password") {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const token = await createToken({ id: demo.id, email: demo.email, role: demo.role, name: demo.name });
      const res = NextResponse.json({ user: demo, token });
      res.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
      return res;
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
    res.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
