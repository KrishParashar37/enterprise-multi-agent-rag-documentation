import { NextRequest, NextResponse } from "next/server";
import { mockDocuments } from "@/lib/mock-data";

type SearchResult = {
  id: string;
  documentId: string;
  documentName: string;
  department: string;
  type: string;
  page: number;
  section: string;
  excerpt: string;
  relevance: number;
  date: string;
};

// Simple in-memory keyword+semantic mock search
function searchChunks(query: string, dept: string, type: string, minRelevance: number): SearchResult[] {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);

  const CHUNKS: SearchResult[] = [
    { id: "c1", documentId: "doc-001", documentName: "Employee Handbook 2025",   department: "Human Resources", type: "PDF", page: 42,  section: "Leave Policy",          excerpt: "Employees receive **20 annual leave days** per calendar year, accruing at 1.67 days/month.",          relevance: 0, date: "2025-01-15" },
    { id: "c2", documentId: "doc-002", documentName: "Remote Work Policy",        department: "Human Resources", type: "PDF", page: 8,   section: "Hybrid Requirements",   excerpt: "Remote employees must attend office minimum **3 days/week** under hybrid model. VPN required.",      relevance: 0, date: "2025-02-10" },
    { id: "c3", documentId: "doc-001", documentName: "Employee Handbook 2025",   department: "Human Resources", type: "PDF", page: 45,  section: "Special Leave",         excerpt: "Maternity leave: **26 weeks paid**. Paternity leave: **4 weeks paid**. 12-month service required.", relevance: 0, date: "2025-01-15" },
    { id: "c4", documentId: "doc-005", documentName: "Security Compliance Policy",department: "IT Security",      type: "PDF", page: 12,  section: "Remote Access",         excerpt: "All remote work via **VPN**. Endpoint protection mandatory. Screen lock 5 min. ISO 27001 compliant.", relevance: 0, date: "2025-01-05" },
    { id: "c5", documentId: "doc-004", documentName: "API Architecture v3",       department: "Technology",       type: "MD",  page: 5,   section: "REST Design",           excerpt: "All APIs follow **RESTful principles** with URI versioning. Rate limit: **1000 req/min** per tenant.", relevance: 0, date: "2025-04-15" },
    { id: "c6", documentId: "doc-003", documentName: "Q4 2024 Financial Report",  department: "Finance",          type: "PDF", page: 3,   section: "Revenue Summary",       excerpt: "Q4 revenue: **$42.8M** (+18% YoY). EBITDA margin: 24.2%. Net profit: **$8.6M**.",                  relevance: 0, date: "2025-01-30" },
    { id: "c7", documentId: "doc-007", documentName: "Sales Performance Q1 2025", department: "Sales",            type: "CSV", page: 1,   section: "Regional Breakdown",    excerpt: "North region: **$12.4M** (+22%). South: **$9.8M** (+15%). Total Q1 revenue: **$38.6M**.",          relevance: 0, date: "2025-04-05" },
    { id: "c8", documentId: "doc-001", documentName: "Employee Handbook 2025",   department: "Human Resources", type: "PDF", page: 88,  section: "Code of Conduct",       excerpt: "All employees must maintain **confidentiality** of sensitive data. Violations subject to termination.", relevance: 0, date: "2025-01-15" },
  ];

  const scored = CHUNKS.map((chunk) => {
    const text = `${chunk.section} ${chunk.excerpt} ${chunk.documentName}`.toLowerCase();
    let score = 0;

    // Keyword matching
    terms.forEach((term) => {
      if (text.includes(term)) score += 0.25;
    });

    // Exact phrase boost
    if (text.includes(q)) score += 0.4;

    // Field-specific boosts
    if (chunk.section.toLowerCase().includes(q)) score += 0.3;
    if (chunk.documentName.toLowerCase().includes(q)) score += 0.2;

    // Normalize to 0-1
    score = Math.min(score, 1.0);

    return { ...chunk, relevance: parseFloat(score.toFixed(2)) };
  });

  return scored
    .filter((c) => {
      if (c.relevance < minRelevance) return false;
      if (dept && dept !== "All" && c.department !== dept) return false;
      if (type && type !== "All" && c.type !== type) return false;
      return true;
    })
    .sort((a, b) => b.relevance - a.relevance)
    .filter((c) => c.relevance > 0)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query       = searchParams.get("q") || "";
  const dept        = searchParams.get("department") || "All";
  const type        = searchParams.get("type") || "All";
  const minRel      = parseFloat(searchParams.get("minRelevance") || "0");
  const mode        = searchParams.get("mode") || "hybrid";

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0, query: "", mode });
  }

  const start = Date.now();
  const results = searchChunks(query, dept, type, minRel);
  const elapsed = Date.now() - start + 200 + Math.floor(Math.random() * 400);

  return NextResponse.json({
    results,
    total: results.length,
    query,
    mode,
    elapsedMs: elapsed,
    reranked: mode !== "keyword",
  });
}

// POST /api/search — same but accepts body
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query = "", department = "All", type = "All", minRelevance = 0, mode = "hybrid" } = body;

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0, query, mode });
  }

  const start = Date.now();
  const results = searchChunks(query, department, type, minRelevance);
  const elapsed = Date.now() - start + 200 + Math.floor(Math.random() * 400);

  return NextResponse.json({ results, total: results.length, query, mode, elapsedMs: elapsed });
}
