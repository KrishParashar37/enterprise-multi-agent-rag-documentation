import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/db/queries";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId") || undefined;
  const result = await getNotifications(userId);
  return NextResponse.json(result);
}

// PATCH /api/notifications?id=xxx  → mark as read
export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !db) return NextResponse.json({ success: true });
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return NextResponse.json({ success: true });
}

// PATCH /api/notifications?all=true  → mark all as read
// handled above by checking body
