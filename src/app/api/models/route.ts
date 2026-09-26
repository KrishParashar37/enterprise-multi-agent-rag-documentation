import { NextRequest, NextResponse } from "next/server";

// ── In-memory models store ────────────────────────────────────────────────────
export type ModelConfig = {
  id: string;
  provider: "OpenAI" | "Anthropic" | "Google" | "Meta" | "Mistral" | "Custom";
  status: "active" | "inactive" | "testing" | "deprecated";
  latencyMs: number;
  costPer1M: number;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  topP: number;
  requests7d: number;
  tokens7d: number;
  cost7d: number;
  errorRate: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  tags: string[];
  addedAt: string;
};

let modelsStore: ModelConfig[] = [
  { id: "gpt-4o",           provider: "OpenAI",    status: "active",   latencyMs: 240, costPer1M: 5.00, contextWindow: 128000, maxTokens: 4096, temperature: 0.7, topP: 1.0, requests7d: 12400, tokens7d: 620000,  cost7d: 3.10, errorRate: 0.2, p50LatencyMs: 220, p99LatencyMs: 800,  tags: ["primary","rag"],              addedAt: "2025-01-01" },
  { id: "gpt-3.5-turbo",    provider: "OpenAI",    status: "inactive", latencyMs: 110, costPer1M: 0.50, contextWindow: 16385,  maxTokens: 4096, temperature: 0.7, topP: 1.0, requests7d:  2100, tokens7d: 105000,  cost7d: 0.05, errorRate: 0.5, p50LatencyMs: 100, p99LatencyMs: 400,  tags: ["legacy","fast"],              addedAt: "2025-01-01" },
  { id: "claude-3-5-sonnet", provider: "Anthropic", status: "active",  latencyMs: 280, costPer1M: 3.00, contextWindow: 200000, maxTokens: 8192, temperature: 0.6, topP: 0.9, requests7d:  8200, tokens7d: 410000,  cost7d: 1.23, errorRate: 0.1, p50LatencyMs: 260, p99LatencyMs: 900,  tags: ["fallback","long-context"],    addedAt: "2025-02-01" },
  { id: "gemini-1.5-pro",    provider: "Google",    status: "active",  latencyMs: 310, costPer1M: 3.50, contextWindow: 1000000,maxTokens: 8192, temperature: 0.7, topP: 1.0, requests7d:  5800, tokens7d: 290000,  cost7d: 1.02, errorRate: 0.3, p50LatencyMs: 290, p99LatencyMs: 1100, tags: ["multimodal","search"],         addedAt: "2025-03-01" },
  { id: "llama-3-70b",       provider: "Meta",      status: "testing", latencyMs:  80, costPer1M: 0.60, contextWindow: 131072, maxTokens: 4096, temperature: 0.7, topP: 0.9, requests7d:   800, tokens7d:  40000,  cost7d: 0.02, errorRate: 1.2, p50LatencyMs:  75, p99LatencyMs: 320,  tags: ["open-source","fast","testing"],addedAt: "2025-04-01" },
];

// GET /api/models
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const model = modelsStore.find((m) => m.id === id);
    if (!model) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ model });
  }

  const activeModels = modelsStore.filter((m) => m.status === "active");
  const totalTokens  = modelsStore.reduce((s, m) => s + m.tokens7d, 0);
  const totalCost    = modelsStore.reduce((s, m) => s + m.cost7d, 0);
  const avgLatency   = parseFloat((activeModels.reduce((s, m) => s + m.latencyMs, 0) / (activeModels.length || 1)).toFixed(0));

  // Simulate real-time usage spikes
  const usageData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => ({
    date: d,
    gpt4:   Math.floor(80000  + Math.random() * 140000),
    claude: Math.floor(50000  + Math.random() * 90000),
    gemini: Math.floor(20000  + Math.random() * 50000),
    llama:  Math.floor(5000   + Math.random() * 20000),
  }));

  return NextResponse.json({
    models: modelsStore,
    stats: {
      activeCount:  activeModels.length,
      totalTokens,
      totalCost:    parseFloat(totalCost.toFixed(2)),
      avgLatencyMs: avgLatency,
    },
    usageData,
  });
}

// POST /api/models — add model
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, provider, costPer1M, contextWindow } = body;
  if (!id || !provider) return NextResponse.json({ error: "id and provider required" }, { status: 400 });
  if (modelsStore.find((m) => m.id === id)) return NextResponse.json({ error: "Model already exists" }, { status: 409 });

  const newModel: ModelConfig = {
    id, provider, status: "testing",
    latencyMs: 200, costPer1M: costPer1M || 1.0,
    contextWindow: contextWindow || 8192,
    maxTokens: 4096, temperature: 0.7, topP: 1.0,
    requests7d: 0, tokens7d: 0, cost7d: 0, errorRate: 0,
    p50LatencyMs: 0, p99LatencyMs: 0, tags: ["new"],
    addedAt: new Date().toISOString(),
  };
  modelsStore.push(newModel);
  return NextResponse.json({ model: newModel }, { status: 201 });
}

// PATCH /api/models — update config
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const idx = modelsStore.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  modelsStore[idx] = { ...modelsStore[idx], ...updates };
  return NextResponse.json({ model: modelsStore[idx] });
}

// DELETE /api/models
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  modelsStore = modelsStore.filter((m) => m.id !== id);
  return NextResponse.json({ success: true });
}
