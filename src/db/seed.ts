/**
 * Database Seed Script — baseline demo data.
 * Run: npx tsx src/db/seed.ts
 * Seeds users, documents, conversations, messages, agent runs, evaluations and
 * notifications.
 *
 * Plan item 48: SAFE TO RE-RUN and deliberately bounded. It uses the project's
 * configured driver (MySQL or PostgreSQL) instead of hardcoding `pg`, which
 * previously made `npm run db:seed` crash against a mysql:// URL.
 */

// dotenv must load before ./index, which reads DATABASE_URL at module scope.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });

import { getDB, getPool, getDBType } from "./index";
import * as schema from "./schema";
import { hashPassword } from "@/lib/auth";

let db: any;
import dotenv from "dotenv";
// (duplicate env load removed — configured in the new header)

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
// (db is resolved inside seed())

async function seed() {
  // Resolve the connection through the project's own DB layer so this script
  // honours DATABASE_URL's dialect (MySQL or PostgreSQL) and the bounded pool
  // settings. Previously this file hardcoded the `pg` driver and crashed on MySQL.
  db = await getDB();
  if (!db) {
    console.error(
      "❌ No database connection. Check DATABASE_URL in .env.local, then run `npm run db:check`.",
    );
    process.exit(1);
  }
  const dialect = getDBType();
  console.log(`🌱 Seeding database (${dialect})...`);

  // ── 1. Users ────────────────────────────────────
  console.log("  Creating users...");
  const usersData = [
    { email: "rahul@enterprise.com",  name: "Rahul Sharma",  role: "ADMIN"    as const, password: "password" },
    { email: "priya@enterprise.com",  name: "Priya Singh",   role: "MANAGER"  as const, password: "password" },
    { email: "amit@enterprise.com",   name: "Amit Kumar",    role: "ANALYST"  as const, password: "password" },
    { email: "sneha@enterprise.com",  name: "Sneha Gupta",   role: "EMPLOYEE" as const, password: "password" },
    { email: "vikram@enterprise.com", name: "Vikram Patel",  role: "EMPLOYEE" as const, password: "password" },
    { email: "ananya@enterprise.com", name: "Ananya Roy",    role: "ANALYST"  as const, password: "password" },
  ];

  const insertedUsers = await Promise.all(usersData.map(async (u) => {
    const passwordHash = await hashPassword(u.password);
    const [user] = await db
      .insert(schema.users)
      .values({ email: u.email, name: u.name, role: u.role, passwordHash })
      .onConflictDoNothing()
      .returning();
    return user;
  }));
  const adminUser = insertedUsers[0];
  console.log(`  ✅ ${insertedUsers.filter(Boolean).length} users created`);

  // ── 2. Documents ─────────────────────────────────
  console.log("  Creating documents...");
  const docsData = [
    { name: "Employee Handbook 2025",    originalName: "employee_handbook_2025.pdf",   type: "PDF" as const, category: "HR",          department: "Human Resources", status: "INDEXED"    as const, chunkCount: 482, pageCount: 124, fileSize: 4200000, accessLevel: "employee" as const, version: "2025.1", tags: ["policy","hr","handbook"],       description: "Complete employee handbook covering all HR policies for 2025" },
    { name: "Remote Work Policy",        originalName: "remote_work_policy.pdf",        type: "PDF" as const, category: "HR",          department: "Human Resources", status: "INDEXED"    as const, chunkCount: 82,  pageCount: 18,  fileSize: 890000,  accessLevel: "employee" as const, version: "2025.2", tags: ["policy","remote","work"],        description: "Guidelines for remote work arrangements" },
    { name: "Q4 2024 Financial Report",  originalName: "q4_2024_financial.pdf",         type: "PDF" as const, category: "Finance",     department: "Finance",         status: "INDEXED"    as const, chunkCount: 290, pageCount: 78,  fileSize: 6800000, accessLevel: "manager" as const,  version: "1.0",    tags: ["finance","quarterly","report"], description: "Q4 2024 financial results and analysis" },
    { name: "API Architecture v3",       originalName: "api_architecture_v3.md",         type: "MD"  as const, category: "Engineering", department: "Technology",       status: "INDEXED"    as const, chunkCount: 156, pageCount: 42,  fileSize: 520000,  accessLevel: "employee" as const, version: "3.0",    tags: ["engineering","api","arch"],     description: "Current API architecture and design decisions" },
    { name: "Security Compliance Policy",originalName: "security_compliance_2025.pdf",  type: "PDF" as const, category: "Security",    department: "IT Security",     status: "INDEXED"    as const, chunkCount: 210, pageCount: 56,  fileSize: 3100000, accessLevel: "admin"    as const, version: "2025.1", tags: ["security","compliance"],        description: "Enterprise security compliance requirements" },
    { name: "Employee Benefits Guide",   originalName: "benefits_guide_2025.pdf",        type: "PDF" as const, category: "HR",          department: "Human Resources", status: "PROCESSING" as const, chunkCount: 0,   pageCount: 34,  fileSize: 2400000, accessLevel: "employee" as const, version: "2025.1", tags: ["hr","benefits","insurance"],    description: "Complete guide to employee benefits and enrollment" },
    { name: "Sales Performance Q1 2025", originalName: "sales_q1_2025.csv",             type: "CSV" as const, category: "Sales",       department: "Sales",           status: "INDEXED"    as const, chunkCount: 48,  pageCount: 1,   fileSize: 120000,  accessLevel: "manager" as const,  version: "1.0",    tags: ["sales","performance","data"],   description: "Q1 2025 sales performance data by region" },
    { name: "Deployment Runbook",        originalName: "deployment_runbook.md",          type: "MD"  as const, category: "Engineering", department: "Technology",       status: "FAILED"     as const, chunkCount: 0,   pageCount: 28,  fileSize: 380000,  accessLevel: "employee" as const, version: "2.1",    tags: ["engineering","devops"],         description: "Step-by-step deployment procedures" },
  ];

  const insertedDocs = await Promise.all(docsData.map(async (d) => {
    const [doc] = await db
      .insert(schema.documents)
      .values({ ...d, ownerId: adminUser?.id })
      .onConflictDoNothing()
      .returning();
    return doc;
  }));
  console.log(`  ✅ ${insertedDocs.filter(Boolean).length} documents created`);

  // ── 3. Conversations + Messages ──────────────────
  console.log("  Creating conversations and messages...");
  const convsData = [
    { title: "Leave Policy Questions",   category: "HR",          isPinned: true },
    { title: "Remote Work Guidelines",   category: "HR",          isPinned: false },
    { title: "Q4 Financial Analysis",    category: "Finance",     isPinned: true },
    { title: "API Architecture Review",  category: "Engineering", isPinned: false },
    { title: "Security Compliance Audit",category: "Security",    isPinned: false, isArchived: true },
  ];

  for (const c of convsData) {
    const [conv] = await db.insert(schema.conversations)
      .values({ ...c, userId: adminUser?.id })
      .onConflictDoNothing()
      .returning();

    if (!conv) continue;

    // User message
    await db.insert(schema.messages).values({
      conversationId: conv.id,
      role: "user",
      content: `What is the ${c.category} policy for our organization?`,
    }).onConflictDoNothing();

    // Assistant message with citations
    await db.insert(schema.messages).values({
      conversationId: conv.id,
      role: "assistant",
      content: `Based on the enterprise knowledge base, here is what I found about ${c.category} policies:\n\nThe relevant documentation provides comprehensive guidelines that apply across all departments. Key points include clear procedures, regular reviews, and cross-team alignment.\n\n> Please refer to the source documents for complete details.`,
      citations: [{ documentId: "doc-001", documentName: "Employee Handbook 2025", page: 42, section: "General Policy", excerpt: "All policies are documented and accessible..." }],
      agentTrace: [
        { agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 180, details: "Query classified and routed" },
        { agent: "RETRIEVAL",  status: "SUCCESS", latencyMs: 420, details: "Retrieved 4 relevant chunks" },
        { agent: "REVIEWER",   status: "SUCCESS", latencyMs: 310, details: "Faithfulness: 0.96" },
      ],
      tokensUsed: 840, latencyMs: 2840,
    }).onConflictDoNothing();
  }
  console.log(`  ✅ ${convsData.length} conversations with messages created`);

  // ── 4. Agent Runs ─────────────────────────────────
  console.log("  Creating agent runs...");
  const agentRunsData = [
    { agentName: "SUPERVISOR" as const, status: "SUCCESS" as const,  model: "gpt-oss-120b", inputTokens: 420,  outputTokens: 180, latencyMs: 180,  cost: 0.021, query: "What is our leave policy?"       },
    { agentName: "RETRIEVAL"  as const, status: "SUCCESS" as const,  model: "text-embedding-3-small", inputTokens: 280, outputTokens: 0, latencyMs: 420, cost: 0.003, query: "Remote work policy guidelines"  },
    { agentName: "SQL"        as const, status: "RETRYING" as const, model: "gpt-oss-120b", inputTokens: 540,  outputTokens: 220, latencyMs: 3200, cost: 0.038, query: "Show Q1 sales by region"           },
    { agentName: "RESEARCH"   as const, status: "SUCCESS" as const,  model: "gpt-oss-120b", inputTokens: 380,  outputTokens: 290, latencyMs: 2100, cost: 0.018, query: "Industry compliance standards 2025" },
    { agentName: "REVIEWER"   as const, status: "SUCCESS" as const,  model: "gpt-oss-120b", inputTokens: 680,  outputTokens: 120, latencyMs: 890,  cost: 0.012, query: "Validate answer accuracy"         },
    { agentName: "SUPERVISOR" as const, status: "FAILED"  as const,  model: "gpt-oss-120b", inputTokens: 0,    outputTokens: 0,   latencyMs: 5000, cost: 0.000, query: "Complex multi-doc analysis", error: "Timeout after 5s" },
  ];

  for (const run of agentRunsData) {
    await db.insert(schema.agentRuns)
      .values({ ...run, traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`, userId: adminUser?.id })
      .onConflictDoNothing();
  }
  console.log(`  ✅ ${agentRunsData.length} agent runs created`);

  // ── 5. Evaluations ────────────────────────────────
  console.log("  Creating evaluations...");
  const evalData = [
    { datasetName: "Enterprise QA v2", question: "What is the employee leave policy?",     expectedAnswer: "20 annual leave days", generatedAnswer: "Employees receive 20 annual leave days per calendar year.", faithfulness: 0.98, answerRelevance: 0.99, contextRecall: 0.92, citationAccuracy: 1.0,  overallScore: 0.97, passed: true  },
    { datasetName: "Enterprise QA v2", question: "What is the remote work policy?",         expectedAnswer: "Hybrid work minimum 3 days office", generatedAnswer: "Remote employees must attend office minimum 3 days per week.", faithfulness: 0.94, answerRelevance: 0.96, contextRecall: 0.88, citationAccuracy: 0.95, overallScore: 0.93, passed: true  },
    { datasetName: "Enterprise QA v2", question: "What are the paternity leave days?",      expectedAnswer: "4 weeks paid paternity leave", generatedAnswer: "The company offers 2 weeks of paternity leave.", faithfulness: 0.42, answerRelevance: 0.91, contextRecall: 0.65, citationAccuracy: 0.40, overallScore: 0.59, passed: false },
    { datasetName: "Enterprise QA v2", question: "What is the data security policy?",       expectedAnswer: "ISO 27001 compliant", generatedAnswer: "Our data security follows ISO 27001 standards with quarterly audits.", faithfulness: 0.96, answerRelevance: 0.93, contextRecall: 0.91, citationAccuracy: 0.98, overallScore: 0.94, passed: true  },
  ];

  for (const ev of evalData) {
    await db.insert(schema.evaluations).values(ev).onConflictDoNothing();
  }
  console.log(`  ✅ ${evalData.length} evaluations created`);

  // ── 6. Notifications ──────────────────────────────
  console.log("  Creating notifications...");
  const notifData = [
    { title: "Document Indexed",     message: "Employee Handbook 2025 successfully indexed (482 chunks)", type: "success", isRead: false },
    { title: "Ingestion Failed",     message: "Deployment Runbook failed to process. File may be corrupted.", type: "error", isRead: false },
    { title: "SQL Agent Retry",      message: "SQL Agent retried query 2 times before succeeding", type: "warning", isRead: true },
    { title: "New User Added",       message: "Ananya Roy has been added as an Analyst", type: "info", isRead: true },
    { title: "Evaluation Complete",  message: "Enterprise QA v2 evaluation completed. Overall score: 94.2%", type: "success", isRead: true },
  ];

  for (const n of notifData) {
    await db.insert(schema.notifications).values({ ...n, userId: adminUser?.id }).onConflictDoNothing();
  }
  console.log(`  ✅ ${notifData.length} notifications created`);

  console.log("\n✅ Database seeded successfully!");
  console.log("   Login: rahul@enterprise.com / password");
}

/** Close the shared pool so the process can exit cleanly. */
async function shutdown() {
  const pool = await getPool();
  await pool?.end?.();
}

seed()
  .then(shutdown)
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    await shutdown().catch(() => {});
    process.exit(1);
  });
