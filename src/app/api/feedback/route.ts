import { NextRequest, NextResponse } from "next/server";

// ── In-memory real-time feedback store ───────────────────────────────────────
export type FeedbackItem = {
  id: string;
  user: string;
  sentiment: "positive" | "negative" | "neutral";
  rating: number; // 1-5
  query: string;
  agent: string;
  comment: string;
  time: string;
  timestamp: number;
  resolved: boolean;
  category: string;
  sessionId: string;
};

let feedbackStore: FeedbackItem[] = [
  { id: "f-1", user: "rahul@enterprise.com",  sentiment: "positive", rating: 5, query: "What is the Q3 travel policy?",          agent: "HR Policy Agent", comment: "Very accurate and cited the exact PDF page.", time: "10 mins ago", timestamp: Date.now() - 600000,  resolved: false, category: "accuracy",  sessionId: "s-101" },
  { id: "f-2", user: "sarah@enterprise.com",  sentiment: "negative", rating: 2, query: "Summarize the latest sales data",         agent: "SQL Agent",       comment: "Data seems to be from last month, not current.", time: "1 hour ago",  timestamp: Date.now() - 3600000, resolved: false, category: "freshness", sessionId: "s-102" },
  { id: "f-3", user: "david@enterprise.com",  sentiment: "positive", rating: 5, query: "Deploy staging environment",              agent: "DevOps Agent",    comment: "Perfect! Saved me 30 mins of manual work.",      time: "3 hours ago", timestamp: Date.now() - 10800000,resolved: true,  category: "speed",    sessionId: "s-103" },
  { id: "f-4", user: "priya@enterprise.com",  sentiment: "neutral",  rating: 3, query: "Security compliance checklist",           agent: "Security Agent",  comment: "Missing some GDPR-specific items.",              time: "5 hours ago", timestamp: Date.now() - 18000000,resolved: false, category: "completeness", sessionId: "s-104" },
  { id: "f-5", user: "amit@enterprise.com",   sentiment: "positive", rating: 4, query: "What is the maternity leave policy?",    agent: "HR Policy Agent", comment: "Quick and clear answer with page references.",   time: "Yesterday",   timestamp: Date.now() - 86400000,resolved: true,  category: "accuracy",  sessionId: "s-105" },
  { id: "f-6", user: "meena@enterprise.com",  sentiment: "negative", rating: 1, query: "Forecast next quarter revenue",           agent: "SQL Agent",       comment: "Completely wrong numbers, needs review.",        time: "Yesterday",   timestamp: Date.now() - 90000000,resolved: false, category: "accuracy",  sessionId: "s-106" },
  { id: "f-7", user: "carlos@enterprise.com", sentiment: "positive", rating: 5, query: "Generate API documentation",              agent: "DevOps Agent",    comment: "Excellent structure, very professional.",         time: "2 days ago",  timestamp: Date.now() - 172800000,resolved: true, category: "quality",   sessionId: "s-107" },
];

// GET /api/feedback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sentiment = searchParams.get("sentiment");
  const resolved  = searchParams.get("resolved");
  const category  = searchParams.get("category");
  const since     = searchParams.get("since"); // timestamp ms

  let list = [...feedbackStore].sort((a, b) => b.timestamp - a.timestamp);
  if (sentiment && sentiment !== "All") list = list.filter((f) => f.sentiment === sentiment);
  if (resolved !== null && resolved !== "All") list = list.filter((f) => f.resolved === (resolved === "true"));
  if (category && category !== "All") list = list.filter((f) => f.category === category);
  if (since) list = list.filter((f) => f.timestamp > parseInt(since));

  const pos = feedbackStore.filter((f) => f.sentiment === "positive").length;
  const neg = feedbackStore.filter((f) => f.sentiment === "negative").length;
  const neu = feedbackStore.filter((f) => f.sentiment === "neutral").length;
  const avgRating = parseFloat((feedbackStore.reduce((s, f) => s + f.rating, 0) / feedbackStore.length).toFixed(1));

  // Trend data (last 7 days)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const trend = days.map((day, i) => ({
    date: day,
    up:   Math.floor(80 + Math.random() * 140),
    down: Math.floor(5  + Math.random() * 25),
  }));

  return NextResponse.json({
    feedback: list,
    total: feedbackStore.length,
    stats: { positive: pos, negative: neg, neutral: neu, avgRating, resolved: feedbackStore.filter((f) => f.resolved).length },
    trend,
    categories: ["accuracy","freshness","speed","completeness","quality","other"],
  });
}

// POST /api/feedback — submit new feedback
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user, sentiment, rating, query, agent, comment, category } = body;
  const item: FeedbackItem = {
    id:        `f-${Date.now()}`,
    user:      user || "anonymous",
    sentiment: sentiment || "neutral",
    rating:    rating || 3,
    query:     query || "",
    agent:     agent || "Unknown Agent",
    comment:   comment || "",
    time:      "Just now",
    timestamp: Date.now(),
    resolved:  false,
    category:  category || "other",
    sessionId: `s-${Date.now()}`,
  };
  feedbackStore.unshift(item);
  return NextResponse.json({ feedback: item }, { status: 201 });
}

// PATCH /api/feedback — resolve/update
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, resolved } = body;
  const idx = feedbackStore.findIndex((f) => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  feedbackStore[idx] = { ...feedbackStore[idx], resolved: resolved ?? feedbackStore[idx].resolved };
  return NextResponse.json({ feedback: feedbackStore[idx] });
}

// DELETE /api/feedback
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  feedbackStore = feedbackStore.filter((f) => f.id !== id);
  return NextResponse.json({ success: true });
}
