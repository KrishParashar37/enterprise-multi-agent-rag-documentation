/**
 * Industry-scale demo data seed.
 * Run: npm run db:seed:large
 * All IDs and emails are deterministic, so this is safe to run repeatedly.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { hashPassword } from "@/lib/auth";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed demo data");

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool, { schema });
const BATCH_SIZE = 200;

const departments = ["Human Resources", "Finance", "Technology", "Sales", "IT Security", "Operations", "Legal", "Customer Success"];
const roles = ["EMPLOYEE", "ANALYST", "MANAGER", "ADMIN"] as const;
const categories = ["Policy", "Report", "Technical", "Runbook", "Compliance", "Research"];
const agentNames = ["SUPERVISOR", "RETRIEVAL", "SQL", "RESEARCH", "REVIEWER"] as const;
const documentTypes = ["PDF", "DOCX", "MD", "CSV", "TXT"] as const;
const firstNames = ["Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Meera", "Neel", "Priya", "Rahul", "Riya", "Vikram", "Zoya", "Aditi", "Kabir", "Maya"];
const lastNames = ["Sharma", "Patel", "Singh", "Gupta", "Kumar", "Mehta", "Verma", "Reddy", "Kapoor", "Nair", "Joshi", "Malhotra"];

function id(prefix: number, value: number) {
    return `${prefix.toString(16).padStart(8, "0")}-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

function dateOffset(daysAgo: number, extraMinutes = 0) {
    return new Date(Date.now() - daysAgo * 86400000 - extraMinutes * 60000);
}

function chunks<T>(items: T[]) {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) result.push(items.slice(i, i + BATCH_SIZE));
    return result;
}

async function insertBatches<T>(items: T[], insert: (batch: T[]) => Promise<unknown>) {
    for (const batch of chunks(items)) {
        if (batch.length) await insert(batch);
    }
}

async function seedLarge() {
    console.log("Seeding industry-scale demo data...");
    const passwordHash = await hashPassword("password");

    const users = Array.from({ length: 500 }, (_, index) => {
        const first = firstNames[index % firstNames.length];
        const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
        return {
            id: id(1, index + 1),
            email: `demo.user${String(index + 1).padStart(4, "0")}@enterprise.demo`,
            name: `${first} ${last} ${index + 1}`,
            passwordHash,
            role: roles[index % roles.length],
            tenantId: `tenant-${(index % 12) + 1}`,
            isActive: index % 37 !== 0,
            createdAt: dateOffset(720 - (index % 700)),
            updatedAt: dateOffset(index % 30),
        };
    });
    await insertBatches(users, (batch) => db.insert(schema.users).values(batch).onConflictDoNothing());
    console.log(`  users: ${users.length}`);

    const documents = Array.from({ length: 250 }, (_, index) => {
        const department = departments[index % departments.length];
        const type = documentTypes[index % documentTypes.length];
        const status = index % 29 === 0 ? "FAILED" : index % 11 === 0 ? "PROCESSING" : "INDEXED";
        return {
            id: id(2, index + 1),
            name: `${department} ${categories[index % categories.length]} ${2023 + (index % 3)} ${index + 1}`,
            originalName: `enterprise_${index + 1}.${type.toLowerCase()}`,
            type,
            ownerId: users[index % users.length].id,
            tenantId: users[index % users.length].tenantId,
            version: `${1 + (index % 4)}.${index % 10}`,
            status,
            category: categories[index % categories.length],
            department,
            tags: [department.toLowerCase().replaceAll(" ", "-"), categories[index % categories.length].toLowerCase(), "enterprise"],
            chunkCount: status === "INDEXED" ? 80 + ((index * 47) % 720) : 0,
            pageCount: 8 + ((index * 13) % 180),
            fileSize: 180000 + ((index * 73111) % 7800000),
            accessLevel: index % 17 === 0 ? "admin" : index % 7 === 0 ? "manager" : "employee",
            description: `${categories[index % categories.length]} documentation for ${department} operations and governance.`,
            createdAt: dateOffset(650 - (index % 620)),
            updatedAt: dateOffset(index % 90),
        };
    });
    await insertBatches(documents, (batch) => db.insert(schema.documents).values(batch).onConflictDoNothing());
    console.log(`  documents: ${documents.length}`);

    const conversations = Array.from({ length: 1200 }, (_, index) => ({
        id: id(3, index + 1),
        userId: users[index % users.length].id,
        title: `${categories[index % categories.length]} workspace discussion ${index + 1}`,
        isPinned: index % 23 === 0,
        isArchived: index % 19 === 0,
        category: categories[index % categories.length],
        createdAt: dateOffset(360 - (index % 350)),
        updatedAt: dateOffset(index % 60),
    }));
    await insertBatches(conversations, (batch) => db.insert(schema.conversations).values(batch).onConflictDoNothing());
    console.log(`  conversations: ${conversations.length}`);

    const messages = Array.from({ length: 4800 }, (_, index) => {
        const conversation = conversations[index % conversations.length];
        const isUser = index % 2 === 0;
        const category = conversation.category;
        return {
            id: id(4, index + 1),
            conversationId: conversation.id,
            role: isUser ? "user" : "assistant",
            content: isUser
                ? `Can you summarize the latest ${category.toLowerCase()} guidance for my team?`
                : `Based on the indexed enterprise knowledge base, the ${category.toLowerCase()} guidance is available with verified citations and department-specific controls.`,
            citations: isUser ? [] : [{ documentId: documents[index % documents.length].id, documentName: documents[index % documents.length].name, page: (index % 30) + 1, section: category, excerpt: "Verified enterprise source excerpt." }],
            agentTrace: isUser ? [] : [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 80 }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 310 }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 140 }],
            feedback: isUser ? null : (index % 17 === 0 ? -1 : 1),
            tokensUsed: isUser ? 24 + (index % 80) : 180 + (index % 620),
            latencyMs: isUser ? 0 : 700 + (index % 2600),
            createdAt: dateOffset(index % 180, index % 1440),
        };
    });
    await insertBatches(messages, (batch) => db.insert(schema.messages).values(batch).onConflictDoNothing());
    console.log(`  messages: ${messages.length}`);

    const agentRuns = Array.from({ length: 6000 }, (_, index) => ({
        id: id(5, index + 1),
        traceId: `demo-trace-${Math.floor(index / 5) + 1}`,
        agentName: agentNames[index % agentNames.length],
        status: index % 41 === 0 ? "FAILED" : index % 23 === 0 ? "RETRYING" : "SUCCESS",
        model: index % 3 === 0 ? "openai/gpt-oss-120b" : "llama-3.1-8b-instant",
        inputTokens: 80 + (index % 620),
        outputTokens: 30 + (index % 420),
        latencyMs: 90 + (index * 37) % 2800,
        cost: Number((0.001 + ((index * 17) % 900) / 100000).toFixed(6)),
        userId: users[index % users.length].id,
        conversationId: conversations[index % conversations.length].id,
        query: `Enterprise ${categories[index % categories.length].toLowerCase()} analysis request ${index + 1}`,
        error: index % 41 === 0 ? "Provider timeout after retry budget" : null,
        metadata: { source: "large-demo-seed", region: ["us-east", "eu-west", "ap-south"][index % 3] },
        createdAt: dateOffset(index % 180, index % 1440),
    }));
    await insertBatches(agentRuns, (batch) => db.insert(schema.agentRuns).values(batch).onConflictDoNothing());
    console.log(`  agent runs: ${agentRuns.length}`);

    const evaluations = Array.from({ length: 500 }, (_, index) => {
        const score = Number((0.78 + ((index * 13) % 220) / 1000).toFixed(2));
        return {
            id: id(6, index + 1),
            messageId: messages[(index * 2 + 1) % messages.length].id,
            datasetName: index % 3 === 0 ? "Enterprise QA v3" : "Production RAG Quality",
            question: `Evaluation question ${index + 1}: summarize the approved enterprise policy.`,
            expectedAnswer: "A grounded answer with a valid source citation.",
            generatedAnswer: "The response is grounded in approved enterprise documentation and includes a source citation.",
            faithfulness: score,
            answerRelevance: Math.min(0.99, score + 0.03),
            contextRecall: Math.max(0.7, score - 0.04),
            citationAccuracy: Math.min(0.99, score + 0.01),
            overallScore: score,
            passed: score >= 0.85,
            createdAt: dateOffset(index % 180),
        };
    });
    await insertBatches(evaluations, (batch) => db.insert(schema.evaluations).values(batch).onConflictDoNothing());
    console.log(`  evaluations: ${evaluations.length}`);

    const notifications = Array.from({ length: 1000 }, (_, index) => ({
        id: id(7, index + 1),
        userId: users[index % users.length].id,
        title: ["Document Indexed", "Evaluation Complete", "Agent Retry", "New Workspace Activity"][index % 4],
        message: `Enterprise platform activity event ${index + 1} has been recorded for the assigned team.`,
        type: ["success", "info", "warning"][index % 3],
        isRead: index % 5 !== 0,
        createdAt: dateOffset(index % 120),
    }));
    await insertBatches(notifications, (batch) => db.insert(schema.notifications).values(batch).onConflictDoNothing());
    console.log(`  notifications: ${notifications.length}`);

    console.log("\nLarge demo dataset inserted successfully.");
    console.log("Demo users use: demo.user0001@enterprise.demo / password");
    await pool.end();
}

seedLarge().catch(async (error) => {
    console.error("Large seed failed:", error);
    await pool.end();
    process.exit(1);
});
