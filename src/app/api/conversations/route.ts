import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation, getMessages } from "@/db/queries";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";
  const convId   = searchParams.get("id");

  // Return messages for a specific conversation
  if (convId) {
    const result = await getMessages(convId);
    return NextResponse.json(result);
  }

  const result = await getConversations({ archived, limit: 20 });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { title, category } = await req.json();
  const conv = await createConversation(title || "New Conversation", category);
  return NextResponse.json({ conversation: conv }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const id   = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = await req.json();
  if (!db) return NextResponse.json({ success: true, id, ...body });
  const [conv] = await db.update(conversations)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(conversations.id, id))
    .returning();
  return NextResponse.json({ conversation: conv });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!db) return NextResponse.json({ success: true });
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  return NextResponse.json({ success: true });
}
