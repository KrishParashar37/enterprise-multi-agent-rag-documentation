import { NextRequest, NextResponse } from "next/server";

// ── In-memory store for prompts (real-time state) ─────────────────────────────
export type Prompt = {
  id: string;
  name: string;
  type: "System" | "Agent" | "Tool" | "Eval" | "Custom";
  version: string;
  tokens: number;
  successRate: number;
  content: string;
  tags: string[];
  deployedAt: string;
  createdAt: string;
  updatedAt: string;
  status: "production" | "draft" | "testing" | "archived";
  runCount: number;
  avgLatencyMs: number;
  lastTestResult: "pass" | "fail" | null;
  abTestScore?: number;
};

let promptsStore: Prompt[] = [
  { id: "P-101", name: "System RAG Prompt",    type: "System", version: "v2.1", tokens: 420, successRate: 96, content: `You are a helpful enterprise assistant.\nUse the following pieces of retrieved context to answer the user's question.\n\n<context>\n{{ retrieved_documents }}\n</context>\n\nIf you don't know the answer, just say that you don't know. Don't make up an answer.\n\n<question>\n{{ user_query }}\n</question>`, tags: ["rag","production","system"], deployedAt: "2025-05-01", createdAt: "2025-01-10", updatedAt: "2025-05-01", status: "production", runCount: 18342, avgLatencyMs: 240, lastTestResult: "pass", abTestScore: 96 },
  { id: "P-102", name: "SQL Agent Extractor",  type: "Agent",  version: "v1.4", tokens: 150, successRate: 88, content: `Extract a SQL query from the user's natural language request.\nReturn only the SQL query, no explanation.\n\nRequest: {{ user_request }}`, tags: ["sql","agent","extractor"], deployedAt: "2025-03-15", createdAt: "2025-02-01", updatedAt: "2025-04-10", status: "production", runCount: 5821, avgLatencyMs: 110, lastTestResult: "pass", abTestScore: 88 },
  { id: "P-103", name: "Summarization Tool",   type: "Tool",   version: "v1.0", tokens:  80, successRate: 92, content: `Summarize the following document in 3-5 bullet points.\nFocus on key facts, numbers, and decisions.\n\nDocument: {{ document_text }}`, tags: ["summary","tool"], deployedAt: "2025-04-01", createdAt: "2025-03-01", updatedAt: "2025-04-01", status: "production", runCount: 9120, avgLatencyMs: 180, lastTestResult: "pass", abTestScore: 92 },
  { id: "P-104", name: "Guardrails Evaluator", type: "Eval",   version: "v3.0", tokens: 550, successRate: 99, content: `Evaluate if the following answer is safe, accurate, and grounded.\nScore: faithfulness, toxicity, hallucination.\n\nAnswer: {{ generated_answer }}\nContext: {{ context }}`, tags: ["guardrails","safety","eval"], deployedAt: "2025-04-20", createdAt: "2025-01-20", updatedAt: "2025-04-20", status: "production", runCount: 18342, avgLatencyMs: 320, lastTestResult: "pass", abTestScore: 99 },
];

const versionHistory = [
  { version: "v1.0", successRate: 85, date: "2025-01-10" },
  { version: "v1.1", successRate: 88, date: "2025-02-01" },
  { version: "v1.2", successRate: 82, date: "2025-03-01" },
  { version: "v2.0", successRate: 94, date: "2025-04-01" },
  { version: "v2.1", successRate: 96, date: "2025-05-01" },
];

// GET /api/prompts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  if (id) {
    const prompt = promptsStore.find((p) => p.id === id);
    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prompt, versionHistory });
  }

  let list = [...promptsStore];
  if (type && type !== "All") list = list.filter((p) => p.type === type);
  if (status && status !== "All") list = list.filter((p) => p.status === status);

  return NextResponse.json({
    prompts: list,
    total: list.length,
    stats: {
      total: promptsStore.length,
      production: promptsStore.filter((p) => p.status === "production").length,
      avgSuccessRate: parseFloat((promptsStore.reduce((s, p) => s + p.successRate, 0) / promptsStore.length).toFixed(1)),
      totalRuns: promptsStore.reduce((s, p) => s + p.runCount, 0),
    },
    versionHistory,
  });
}

// POST /api/prompts — create new prompt
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, content, tags, status } = body;
  if (!name || !content) return NextResponse.json({ error: "name and content required" }, { status: 400 });

  const newPrompt: Prompt = {
    id: `P-${Date.now()}`,
    name, type: type || "Custom", version: "v1.0",
    tokens: Math.ceil(content.split(/\s+/).length * 1.3),
    successRate: 0, content,
    tags: tags || [],
    deployedAt: "", createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: status || "draft",
    runCount: 0, avgLatencyMs: 0, lastTestResult: null,
  };
  promptsStore.push(newPrompt);
  return NextResponse.json({ prompt: newPrompt }, { status: 201 });
}

// PATCH /api/prompts — update prompt
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const idx = promptsStore.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  promptsStore[idx] = { ...promptsStore[idx], ...updates, updatedAt: new Date().toISOString() };
  return NextResponse.json({ prompt: promptsStore[idx] });
}

// DELETE /api/prompts
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  promptsStore = promptsStore.filter((p) => p.id !== id);
  return NextResponse.json({ success: true });
}
