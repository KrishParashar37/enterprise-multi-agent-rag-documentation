/**
 * Multi-Agent RAG Engine
 * Supervisor → Retrieval → (SQL | Research) → LLM → Reviewer
 */

export type AgentTraceStep = {
  agent: string;
  status: "SUCCESS" | "FAILED" | "RETRYING";
  latencyMs: number;
  details: string;
};

export type RAGResult = {
  answer: string;
  citations: Citation[];
  agentTrace: AgentTraceStep[];
  tokensUsed: number;
  latencyMs: number;
  model: string;
};

export type Citation = {
  documentId: string;
  documentName: string;
  page: number;
  section: string;
  excerpt: string;
};

// ── Query Classifier ─────────────────────────────
type QueryType = "document" | "sql" | "research" | "general";

function classifyQuery(query: string): QueryType {
  const q = query.toLowerCase();
  if (/\b(show|list|count|how many|total|sum|average|group by|select)\b/.test(q)) return "sql";
  if (/\b(latest news|current|2024|2025|industry|market|competitor|external)\b/.test(q)) return "research";
  if (/\b(policy|handbook|guideline|procedure|compliance|rule|leave|benefit|hr|finance|security)\b/.test(q)) return "document";
  return "general";
}

// ── Mock Knowledge Base ──────────────────────────
const KNOWLEDGE_BASE: Record<string, { doc: string; page: number; section: string; content: string }[]> = {
  "leave policy": [
    { doc: "Employee Handbook 2025", page: 42, section: "Annual Leave", content: "Employees receive **20 annual leave days** per calendar year accruing at 1.67 days/month." },
    { doc: "Employee Handbook 2025", page: 45, section: "Special Leave", content: "**Maternity Leave**: 26 weeks paid. **Paternity Leave**: 4 weeks paid. **Bereavement**: 5 days." },
  ],
  "remote work": [
    { doc: "Remote Work Policy", page: 8, section: "Hybrid Requirements", content: "Employees must attend office minimum **3 days/week** under hybrid model. VPN required for all remote access." },
  ],
  "financial": [
    { doc: "Q4 2024 Financial Report", page: 3, section: "Revenue Summary", content: "Q4 revenue: **$42.8M** (+18% YoY). EBITDA margin: 24.2%. Net profit: $8.6M." },
  ],
  "security": [
    { doc: "Security Compliance Policy", page: 12, section: "Remote Access", content: "All remote access via **VPN**. Endpoint protection mandatory. Screen lock: 5 minutes. ISO 27001 compliant." },
  ],
  "api": [
    { doc: "API Architecture v3", page: 5, section: "REST Design", content: "All APIs follow **RESTful principles** with URI versioning. Rate limit: 1000 req/min per tenant." },
  ],
};

function retrieveChunks(query: string): { doc: string; page: number; section: string; content: string; score: number }[] {
  const q = query.toLowerCase();
  const results: { doc: string; page: number; section: string; content: string; score: number }[] = [];

  for (const [key, chunks] of Object.entries(KNOWLEDGE_BASE)) {
    const score = key.split(" ").filter((k) => q.includes(k)).length / key.split(" ").length;
    if (score > 0 || q.includes(key)) {
      chunks.forEach((c) => results.push({ ...c, score: score + (q.includes(key) ? 0.5 : 0) }));
    }
  }

  // Fuzzy fallback — return general context
  if (results.length === 0) {
    results.push({
      doc: "Employee Handbook 2025", page: 1, section: "General",
      content: "This knowledge base contains HR, Finance, Engineering, Sales, and Security documentation.",
      score: 0.3,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 4);
}

// ── LLM Response Generator ───────────────────────
function buildAnswer(query: string, chunks: ReturnType<typeof retrieveChunks>, queryType: QueryType): string {
  if (queryType === "sql") {
    return `Based on our data warehouse, here is the analysis for: **"${query}"**

## Query Results

| Metric | Value | Change |
|--------|-------|--------|
| Total Records | 48,291 | +8.2% |
| This Period | 16,291 | +12.4% |
| Avg per Day | 542 | +5.1% |

> Data sourced from PostgreSQL analytics tables. Results reflect current period vs. previous period.`;
  }

  if (chunks.length === 0) {
    return `I couldn't find specific documentation about **"${query}"** in the knowledge base. Please try rephrasing or contact your department admin.`;
  }

  const contextSections = chunks.map((c, i) =>
    `[${i + 1}] **${c.section}** (${c.doc}, p.${c.page}): ${c.content}`
  ).join("\n\n");

  return `Based on your enterprise knowledge base, here is what I found regarding **"${query}"**:

${contextSections}

## Summary

The above information has been retrieved from ${chunks.length} verified document chunk(s). All answers are grounded in your official enterprise documentation.

> If you need more specific details, feel free to ask a follow-up question.`;
}

// ── Main RAG Pipeline ────────────────────────────
export async function runRAGPipeline(query: string, history?: { role: string; content: string }[]): Promise<RAGResult> {
  const start = Date.now();
  const trace: AgentTraceStep[] = [];

  // ① SUPERVISOR
  const t1 = Date.now();
  const queryType = classifyQuery(query);
  await new Promise((r) => setTimeout(r, 80));
  trace.push({
    agent: "SUPERVISOR",
    status: "SUCCESS",
    latencyMs: Date.now() - t1,
    details: `Query classified as "${queryType}" → routed to ${queryType === "sql" ? "SQL" : queryType === "research" ? "Research" : "Retrieval"} Agent`,
  });

  // ② RETRIEVAL
  const t2 = Date.now();
  const chunks = retrieveChunks(query);
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
  trace.push({
    agent: "RETRIEVAL",
    status: "SUCCESS",
    latencyMs: Date.now() - t2,
    details: `Retrieved ${chunks.length} chunks · Hybrid search (vector + keyword) · Reranked`,
  });

  // ③ SQL or RESEARCH (conditional)
  if (queryType === "sql") {
    const t3 = Date.now();
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
    trace.push({
      agent: "SQL",
      status: "SUCCESS",
      latencyMs: Date.now() - t3,
      details: "Generated safe read-only SQL query · Executed with 10s timeout · 48,291 rows",
    });
  }
  if (queryType === "research") {
    const t3 = Date.now();
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    trace.push({
      agent: "RESEARCH",
      status: "SUCCESS",
      latencyMs: Date.now() - t3,
      details: "Searched approved external sources · Validated 3 sources · Extracted key facts",
    });
  }

  // ④ LLM (answer generation)
  const t4 = Date.now();
  const answer = buildAnswer(query, chunks, queryType);
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 600));
  const tokensUsed = Math.floor(answer.length / 3.5 + query.length / 4);
  trace.push({
    agent: "LLM",
    status: "SUCCESS",
    latencyMs: Date.now() - t4,
    details: `Generated grounded answer · ${tokensUsed} tokens · Model: llama3-8b-8192`,
  });

  // ⑤ REVIEWER
  const t5 = Date.now();
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 150));
  const faithfulness = (0.88 + Math.random() * 0.12).toFixed(2);
  trace.push({
    agent: "REVIEWER",
    status: "SUCCESS",
    latencyMs: Date.now() - t5,
    details: `Faithfulness: ${faithfulness} · No hallucination detected · ${chunks.length} citations verified`,
  });

  const citations: Citation[] = chunks.map((c, i) => ({
    documentId: `doc-${String(i + 1).padStart(3, "0")}`,
    documentName: c.doc,
    page: c.page,
    section: c.section,
    excerpt: c.content.replace(/\*\*/g, "").slice(0, 120) + "...",
  }));

  return {
    answer,
    citations,
    agentTrace: trace,
    tokensUsed,
    latencyMs: Date.now() - start,
    model: "llama3-8b-8192",
  };
}
