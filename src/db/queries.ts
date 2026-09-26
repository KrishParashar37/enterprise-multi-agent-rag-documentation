/**
 * Centralized DB query functions
 * All API routes use these — with automatic mock fallback when DB is not connected
 */

import { getDB, hasDB } from "./index";
import {
  users, documents, conversations, messages,
  agentRuns, evaluations, notifications
} from "./schema";
import { desc, eq, like, and, count, sum, avg } from "drizzle-orm";
import {
  mockDocuments, mockConversations, mockMessages,
  mockUsers, mockAgentRuns, mockEvaluations, mockNotifications, mockKPIs,
} from "@/lib/mock-data";

// ── Documents ─────────────────────────────────────
export async function getDocuments(opts: { search?: string; department?: string; status?: string; limit?: number; page?: number }) {
  if (!hasDB()) {
    let r = mockDocuments as any[];
    if (opts.search) r = r.filter((d) => d.name.toLowerCase().includes(opts.search!.toLowerCase()));
    if (opts.department) r = r.filter((d) => d.department === opts.department);
    if (opts.status) r = r.filter((d) => d.status === opts.status);
    return { data: r.slice(0, opts.limit ?? 50), total: r.length, source: "mock" as const };
  }
  const db = await getDB();
  const conditions = [];
  if (opts.search) conditions.push(like(documents.name, `%${opts.search}%`));
  if (opts.department) conditions.push(eq(documents.department, opts.department));
  if (opts.status) conditions.push(eq(documents.status, opts.status as any));
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const data = await db.select().from(documents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(documents.createdAt))
    .limit(limit).offset((page - 1) * limit);
  const [{ total }] = await db.select({ total: count() }).from(documents)
    .where(conditions.length ? and(...conditions) : undefined);
  return { data, total, source: "database" as const };
}

export async function createDocument(values: { name: string; type: string; department?: string; category?: string; description?: string; fileSize?: number; accessLevel?: string }) {
  if (!hasDB()) {
    return { id: `doc-${Date.now()}`, ...values, status: "PROCESSING", chunkCount: 0, pageCount: 0, createdAt: new Date(), updatedAt: new Date() };
  }
  const db = await getDB();
  const [doc] = await db.insert(documents).values({
    name: values.name, originalName: values.name,
    type: values.type as any, department: values.department,
    category: values.category, description: values.description,
    fileSize: values.fileSize ?? 0,
    accessLevel: (values.accessLevel ?? "employee") as any,
    status: "UPLOADING", tags: [],
  }).$returningId();
  return { id: doc.id, ...values };
}

export async function deleteDocument(id: string) {
  if (!hasDB()) return { success: true };
  const db = await getDB();
  await db.delete(documents).where(eq(documents.id, id));
  return { success: true };
}

export async function updateDocument(id: string, values: Record<string, any>) {
  if (!hasDB()) return { id, ...values };
  const db = await getDB();
  await db.update(documents)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(documents.id, id));
  return { id, ...values };
}

// ── Conversations ─────────────────────────────────
export async function getConversations(opts: { archived?: boolean; limit?: number }) {
  if (!hasDB()) {
    const r = mockConversations.filter((c) => c.isArchived === (opts.archived ?? false));
    return { data: r.slice(0, opts.limit ?? 20), source: "mock" as const };
  }
  const db = await getDB();
  const data = await db.select().from(conversations)
    .where(eq(conversations.isArchived, opts.archived ?? false))
    .orderBy(desc(conversations.updatedAt))
    .limit(opts.limit ?? 20);
  return { data, source: "database" as const };
}

export async function createConversation(title: string, category?: string, userId?: string) {
  if (!hasDB()) {
    return { id: `conv-${Date.now()}`, title, category, isPinned: false, isArchived: false, createdAt: new Date(), updatedAt: new Date() };
  }
  const db = await getDB();
  const [row] = await db.insert(conversations).values({ title, category, userId }).$returningId();
  return { id: row.id, title, category, isPinned: false, isArchived: false, createdAt: new Date(), updatedAt: new Date() };
}

export async function getMessages(conversationId: string) {
  if (!hasDB()) {
    return { data: mockMessages.filter((m) => m.conversationId === conversationId), source: "mock" as const };
  }
  const db = await getDB();
  const data = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  return { data, source: "database" as const };
}

export async function saveMessage(values: { conversationId: string; role: string; content: string; citations?: any[]; agentTrace?: any[]; tokensUsed?: number; latencyMs?: number }) {
  if (!hasDB()) {
    return { id: `msg-${Date.now()}`, ...values, createdAt: new Date() };
  }
  const db = await getDB();
  const [row] = await db.insert(messages).values({
    conversationId: values.conversationId,
    role: values.role as any,
    content: values.content,
    citations: values.citations ?? [],
    agentTrace: values.agentTrace ?? [],
    tokensUsed: values.tokensUsed ?? 0,
    latencyMs: values.latencyMs ?? 0,
  }).$returningId();
  return { id: row.id, ...values, createdAt: new Date() };
}

// ── Agent Runs ────────────────────────────────────
export async function saveAgentRuns(runs: { agentName: string; status: string; model: string; latencyMs: number; inputTokens: number; outputTokens: number; cost: number; query: string; conversationId?: string }[]) {
  if (!hasDB()) return runs.map((r, i) => ({ id: `run-${Date.now()}-${i}`, ...r }));
  const db = await getDB();
  const traceId = `trace-${Date.now()}`;
  return Promise.all(runs.map((r) =>
    db.insert(agentRuns).values({
      traceId, agentName: r.agentName as any, status: r.status as any,
      model: r.model, latencyMs: r.latencyMs,
      inputTokens: r.inputTokens, outputTokens: r.outputTokens,
      cost: r.cost, query: r.query, conversationId: r.conversationId,
    }).$returningId().then((rows: any[]) => ({ id: rows[0]?.id, ...r }))
  ));
}

export async function getAgentRuns(limit = 20) {
  if (!hasDB()) return { data: mockAgentRuns.slice(0, limit), source: "mock" as const };
  const db = await getDB();
  const data = await db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(limit);
  return { data, source: "database" as const };
}

// ── Dashboard Stats ───────────────────────────────
export async function getDashboardStats() {
  const db = await getDB();
  if (!db) {
    return {
      totalDocuments: mockKPIs.totalDocuments, totalUsers: mockUsers.length,
      totalConversations: mockConversations.length, totalAgentRuns: mockAgentRuns.length,
      totalMessages: mockMessages.length, totalCost: mockKPIs.totalCost,
      avgLatencyMs: mockKPIs.avgLatencyMs, successRate: mockKPIs.successRate,
      source: "mock" as const,
    };
  }
  const [docCount] = await db.select({ count: count() }).from(documents);
  const [userCount] = await db.select({ count: count() }).from(users);
  const [convCount] = await db.select({ count: count() }).from(conversations);
  const [runStats] = await db.select({ count: count(), totalCost: sum(agentRuns.cost), avgLatencyMs: avg(agentRuns.latencyMs) }).from(agentRuns);
  const [msgCount] = await db.select({ count: count() }).from(messages);
  return {
    totalDocuments: docCount.count,
    totalUsers: userCount.count,
    totalConversations: convCount.count,
    totalAgentRuns: runStats.count,
    totalMessages: msgCount.count,
    totalCost: parseFloat(String(runStats.totalCost ?? 0)),
    avgLatencyMs: parseFloat(String(runStats.avgLatencyMs ?? 0)),
    source: "database" as const,
  };
}

// ── Users ─────────────────────────────────────────
export async function getUsers(opts: { search?: string; role?: string }) {
  if (!hasDB()) {
    let r = mockUsers as any[];
    if (opts.search) r = r.filter((u) => u.name.toLowerCase().includes(opts.search!.toLowerCase()) || u.email.includes(opts.search!));
    if (opts.role) r = r.filter((u) => u.role === opts.role);
    return { data: r, source: "mock" as const };
  }
  const db = await getDB();
  const conditions = [];
  if (opts.search) conditions.push(like(users.name, `%${opts.search}%`));
  if (opts.role) conditions.push(eq(users.role, opts.role as any));
  const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));
  return { data, source: "database" as const };
}

// ── Evaluations ───────────────────────────────────
export async function getEvaluations(opts: { passed?: boolean; dataset?: string }) {
  if (!hasDB()) {
    let r = mockEvaluations as any[];
    if (opts.passed !== undefined) r = r.filter((e) => e.passed === opts.passed);
    return { data: r, source: "mock" as const };
  }
  const db = await getDB();
  const conditions = [];
  if (opts.passed !== undefined) conditions.push(eq(evaluations.passed, opts.passed));
  if (opts.dataset) conditions.push(eq(evaluations.datasetName, opts.dataset));
  const data = await db.select().from(evaluations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(evaluations.createdAt));
  return { data, source: "database" as const };
}

// ── Notifications ─────────────────────────────────
export async function getNotifications(userId?: string) {
  if (!hasDB()) return { data: mockNotifications, source: "mock" as const };
  const db = await getDB();
  const data = await db.select().from(notifications)
    .where(userId ? eq(notifications.userId, userId) : undefined)
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return { data, source: "database" as const };
}
