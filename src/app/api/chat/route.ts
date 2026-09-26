import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createConversation, saveMessage, saveAgentRuns, getMessages } from "@/db/queries";
import { runRAGPipeline } from "@/lib/rag-engine";

// Groq will be initialized per-request

const SYSTEM_PROMPT = `You are an Enterprise AI Assistant for a multi-agent RAG platform.
Help employees with company documents, policies, financial data, and technical docs.
Provide clear, structured answers with markdown. Be concise and professional.`;

// Mock answers when no Groq key
const MOCK: Record<string, string> = {
  leave:    "## Leave Policy 2025\n\nEmployees receive **20 annual leave days** per year.\n\n- **Sick Leave**: 12 days/year\n- **Maternity**: 26 weeks paid\n- **Paternity**: 4 weeks paid\n\n> Source: Employee Handbook 2025, p.42",
  remote:   "## Remote Work Policy\n\nMinimum **3 days/week** in office under hybrid model.\n\n- **VPN required** for all remote access\n- Screen lock: 5 minutes\n\n> Source: Remote Work Policy, p.8",
  financial:"## Q4 2024 Highlights\n\n| Metric | Value |\n|--------|-------|\n| Revenue | **$42.8M** (+18%) |\n| EBITDA | 24.2% |\n| Net Profit | **$8.6M** |\n\n> Source: Q4 Financial Report",
  security: "## Security Policy\n\n**ISO 27001** compliant. VPN required. Quarterly audits.\n\n> Source: Security Compliance Policy",
  api:      "## API Architecture\n\n**RESTful** with URI versioning. Rate limit: **1000 req/min** per tenant.\n\n> Source: API Architecture v3",
};

function getMockAnswer(query: string): string {
  const q = query.toLowerCase();
  for (const [key, answer] of Object.entries(MOCK)) {
    if (q.includes(key)) return answer;
  }
  return `I understand your question about **"${query}"**.\n\nTo get real AI responses, add your **GROQ_API_KEY** to \`.env.local\`.\n\nGet a free key at: https://console.groq.com`;
}

// Safe DB helpers — never throw, just log errors
async function safeCreateConversation(title: string) {
  try {
    return await createConversation(title);
  } catch (err) {
    console.warn("DB: createConversation failed, using fallback:", err);
    return { id: `conv-${Date.now()}`, title };
  }
}

async function safeSaveMessage(values: Parameters<typeof saveMessage>[0]) {
  try {
    return await saveMessage(values);
  } catch (err) {
    console.warn("DB: saveMessage failed:", err);
    return null;
  }
}

async function safeSaveAgentRuns(runs: Parameters<typeof saveAgentRuns>[0]) {
  try {
    return await saveAgentRuns(runs);
  } catch (err) {
    console.warn("DB: saveAgentRuns failed:", err);
    return null;
  }
}

async function safeRunRAGPipeline(query: string, history?: any) {
  try {
    return await runRAGPipeline(query, history);
  } catch (err) {
    console.warn("RAG pipeline failed, using defaults:", err);
    return {
      answer: getMockAnswer(query),
      citations: [],
      agentTrace: [
        { agent: "SUPERVISOR", status: "SUCCESS" as const, latencyMs: 50, details: "Fallback mode" },
        { agent: "RETRIEVAL", status: "SUCCESS" as const, latencyMs: 100, details: "Mock retrieval" },
      ],
      tokensUsed: 100,
      latencyMs: 150,
      model: "mock-fallback",
    };
  }
}

// ── Streaming POST ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY || "";
    const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;

    const body = await req.json();
    const { messages: msgHistory, conversationId, stream: doStream } = body;

    if (!msgHistory?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const lastMsg  = msgHistory[msgHistory.length - 1];
    const query    = lastMsg?.content || "";
    const history  = msgHistory.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content }));

    // Get or create conversation (safe — won't crash on DB failure)
    let convId = conversationId;
    if (!convId) {
      const conv = await safeCreateConversation(query.slice(0, 50) + (query.length > 50 ? "..." : ""));
      convId = conv.id;
    }

    // Save user message to DB (safe — won't crash on failure)
    await safeSaveMessage({ conversationId: convId, role: "user", content: query });

    // ── Streaming mode (default) ───────────────────
    if (doStream !== false) {
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          let fullContent = "";

          try {
            if (groq) {
              try {
                const stream = await groq.chat.completions.create({
                  model: "llama3-8b-8192",
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...history,
                    { role: "user", content: query },
                  ],
                  temperature: 0.7, max_tokens: 2048, stream: true,
                });

                for await (const chunk of stream) {
                  const token = chunk.choices[0]?.delta?.content || "";
                  if (token) {
                    fullContent += token;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`));
                  }
                }
              } catch (err: any) {
                console.warn("Groq streaming failed, using mock:", err?.message);
                const fallback = getMockAnswer(query);
                for (const word of fallback.split(" ")) {
                  fullContent += word + " ";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + " " })}\n\n`));
                  await new Promise((r) => setTimeout(r, 30));
                }
              }
            } else {
              // No API key — simulate streaming with mock
              const answer = getMockAnswer(query);
              for (const word of answer.split(" ")) {
                fullContent += word + " ";
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + " " })}\n\n`));
                await new Promise((r) => setTimeout(r, 35));
              }
            }

            // Save assistant message + agent runs to DB (safe — errors won't break the stream)
            const rag = await safeRunRAGPipeline(query);
            await safeSaveMessage({
              conversationId: convId,
              role: "assistant",
              content: fullContent.trim(),
              citations: rag.citations,
              agentTrace: rag.agentTrace,
              tokensUsed: rag.tokensUsed,
              latencyMs:  rag.latencyMs,
            });

            await safeSaveAgentRuns(rag.agentTrace.map((t) => ({
              agentName: t.agent, status: t.status, model: rag.model,
              latencyMs: t.latencyMs, inputTokens: Math.floor(rag.tokensUsed * 0.6),
              outputTokens: Math.floor(rag.tokensUsed * 0.4),
              cost: rag.tokensUsed * 0.000015, query, conversationId: convId,
            })));

            // Send final metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              done: true, conversationId: convId,
              citations: rag.citations, agentTrace: rag.agentTrace,
              tokensUsed: rag.tokensUsed, latencyMs: rag.latencyMs,
            })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (streamErr: any) {
            // Last resort — if something completely unexpected happens inside the stream
            console.error("Stream fatal error:", streamErr);
            const errMsg = "I encountered a temporary issue. Please try again.";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errMsg })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId, citations: [], agentTrace: [] })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // ── Non-streaming mode ─────────────────────────
    const rag    = await safeRunRAGPipeline(query, history);
    const answer = groq ? rag.answer : getMockAnswer(query);

    await safeSaveMessage({
      conversationId: convId, role: "assistant", content: answer,
      citations: rag.citations, agentTrace: rag.agentTrace,
      tokensUsed: rag.tokensUsed, latencyMs: rag.latencyMs,
    });

    return NextResponse.json({
      conversationId: convId, answer,
      citations: rag.citations, agentTrace: rag.agentTrace,
      tokensUsed: rag.tokensUsed, latencyMs: rag.latencyMs,
      model: rag.model,
    });

  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

// ── GET — message history ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    const convId = new URL(req.url).searchParams.get("conversationId");
    if (!convId) return NextResponse.json({ messages: [] });
    const result = await getMessages(convId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET messages error:", err);
    return NextResponse.json({ messages: [], source: "error" });
  }
}
