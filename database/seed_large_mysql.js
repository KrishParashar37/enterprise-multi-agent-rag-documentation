/**
 * Industry-scale MySQL demo data seed.
 * Run: npm run db:seed:large
 * Deterministic IDs make this safe to run repeatedly with INSERT IGNORE.
 */

const mysql = require("mysql2/promise");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const uri = process.env.DATABASE_URL;
if (!uri || !uri.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must be a mysql:// connection string");
}

const pool = mysql.createPool({ uri, waitForConnections: true, connectionLimit: 10 });
const BATCH_SIZE = 100;
const departments = ["Human Resources", "Finance", "Technology", "Sales", "IT Security", "Operations", "Legal", "Customer Success"];
const roles = ["EMPLOYEE", "ANALYST", "MANAGER", "ADMIN"];
const categories = ["Policy", "Report", "Technical", "Runbook", "Compliance", "Research"];
const agents = ["SUPERVISOR", "RETRIEVAL", "SQL", "RESEARCH", "REVIEWER"];
const types = ["PDF", "DOCX", "MD", "CSV", "TXT"];
const firstNames = ["Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Meera", "Neel", "Priya", "Rahul", "Riya", "Vikram", "Zoya", "Aditi", "Kabir", "Maya"];
const lastNames = ["Sharma", "Patel", "Singh", "Gupta", "Kumar", "Mehta", "Verma", "Reddy", "Kapoor", "Nair", "Joshi", "Malhotra"];

function id(prefix, value) {
    return `${prefix.toString(16).padStart(8, "0")}-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}
function date(daysAgo) {
    return new Date(Date.now() - daysAgo * 86400000);
}
function passwordHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(`${password}${salt}`, salt, 100000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
}
async function insert(table, columns, rows) {
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const values = batch.map((row) => `(${columns.map(() => "?").join(",")})`).join(",");
        await pool.query(`INSERT IGNORE INTO ${table} (${columns.join(",")}) VALUES ${values}`, batch.flat());
    }
}

async function run() {
    console.log("Seeding industry-scale MySQL demo data...");
    const hash = passwordHash("password");

    const users = Array.from({ length: 500 }, (_, i) => {
        const index = i + 1;
        return [id(1, index), `demo.user${String(index).padStart(4, "0")}@enterprise.demo`, `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]} ${index}`, hash, roles[i % roles.length], `tenant-${(i % 12) + 1}`, i % 37 !== 0, date(720 - (i % 700)), date(i % 30)];
    });
    await insert("users", ["id", "email", "name", "password_hash", "role", "tenant_id", "is_active", "created_at", "updated_at"], users);
    console.log(`  users: ${users.length}`);

    const documents = Array.from({ length: 250 }, (_, i) => {
        const index = i + 1;
        const department = departments[i % departments.length];
        const type = types[i % types.length];
        const status = i % 29 === 0 ? "FAILED" : i % 11 === 0 ? "PROCESSING" : "INDEXED";
        return [id(2, index), `${department} ${categories[i % categories.length]} ${2023 + (i % 3)} ${index}`, `enterprise_${index}.${type.toLowerCase()}`, type, id(1, (i % 500) + 1), status, department, categories[i % categories.length], 80 + ((i * 47) % 720), 8 + ((i * 13) % 180), 180000 + ((i * 73111) % 7800000), i % 17 === 0 ? "admin" : i % 7 === 0 ? "manager" : "employee", `${categories[i % categories.length]} documentation for ${department} operations and governance.`, JSON.stringify([department.toLowerCase().replaceAll(" ", "-"), categories[i % categories.length].toLowerCase(), "enterprise"]), date(650 - (i % 620)), date(i % 90)];
    });
    await insert("documents", ["id", "name", "original_name", "type", "owner_id", "status", "department", "category", "chunk_count", "page_count", "file_size", "access_level", "description", "tags", "created_at", "updated_at"], documents);
    console.log(`  documents: ${documents.length}`);

    const conversations = Array.from({ length: 1200 }, (_, i) => {
        const index = i + 1;
        return [id(3, index), id(1, (i % 500) + 1), `${categories[i % categories.length]} workspace discussion ${index}`, i % 23 === 0, i % 19 === 0, categories[i % categories.length], date(360 - (i % 350)), date(i % 60)];
    });
    await insert("conversations", ["id", "user_id", "title", "is_pinned", "is_archived", "category", "created_at", "updated_at"], conversations);
    console.log(`  conversations: ${conversations.length}`);

    const messages = Array.from({ length: 4800 }, (_, i) => {
        const index = i + 1;
        const conversationId = id(3, (i % 1200) + 1);
        const isUser = i % 2 === 0;
        const category = categories[i % categories.length];
        return [id(4, index), conversationId, isUser ? "user" : "assistant", isUser ? `Can you summarize the latest ${category.toLowerCase()} guidance for my team?` : `Based on the indexed enterprise knowledge base, the ${category.toLowerCase()} guidance is available with verified citations and department-specific controls.`, JSON.stringify(isUser ? [] : [{ documentId: id(2, (i % 250) + 1), page: (i % 30) + 1, section: category }]), JSON.stringify(isUser ? [] : [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 80 }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 310 }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 140 }]), isUser ? null : (i % 17 === 0 ? -1 : 1), isUser ? 24 + (i % 80) : 180 + (i % 620), isUser ? 0 : 700 + (i % 2600), date(i % 180)];
    });
    await insert("messages", ["id", "conversation_id", "role", "content", "citations", "agent_trace", "feedback", "tokens_used", "latency_ms", "created_at"], messages);
    console.log(`  messages: ${messages.length}`);

    const runs = Array.from({ length: 6000 }, (_, i) => {
        const index = i + 1;
        const failed = i % 41 === 0;
        return [id(5, index), `demo-trace-${Math.floor(i / 5) + 1}`, agents[i % agents.length], failed ? "FAILED" : (i % 23 === 0 ? "RETRYING" : "SUCCESS"), i % 3 === 0 ? "openai/gpt-oss-120b" : "llama-3.1-8b-instant", 80 + (i % 620), 30 + (i % 420), 90 + ((i * 37) % 2800), Number((0.001 + ((i * 17) % 900) / 100000).toFixed(6)), id(1, (i % 500) + 1), `Enterprise ${categories[i % categories.length].toLowerCase()} analysis request ${index}`, failed ? "Provider timeout after retry budget" : null, date(i % 180)];
    });
    await insert("agent_runs", ["id", "trace_id", "agent_name", "status", "model", "input_tokens", "output_tokens", "latency_ms", "cost", "user_id", "query_text", "error_msg", "created_at"], runs);
    console.log(`  agent runs: ${runs.length}`);

    const evaluations = Array.from({ length: 500 }, (_, i) => {
        const index = i + 1;
        const score = Number((0.78 + ((i * 13) % 220) / 1000).toFixed(2));
        return [id(6, index), `Enterprise QA ${i % 3 === 0 ? "v3" : "Production"}`, `Evaluation question ${index}: summarize the approved enterprise policy.`, "A grounded answer with a valid source citation.", "The response is grounded in approved enterprise documentation and includes a source citation.", score, Math.min(0.99, score + 0.03), Math.max(0.7, score - 0.04), Math.min(0.99, score + 0.01), score, score >= 0.85, date(i % 180)];
    });
    await insert("evaluations", ["id", "dataset_name", "question", "expected_answer", "generated_answer", "faithfulness", "answer_relevance", "context_recall", "citation_accuracy", "overall_score", "passed", "created_at"], evaluations);
    console.log(`  evaluations: ${evaluations.length}`);

    const notifications = Array.from({ length: 1000 }, (_, i) => [id(7, i + 1), id(1, (i % 500) + 1), ["Document Indexed", "Evaluation Complete", "Agent Retry", "New Workspace Activity"][i % 4], `Enterprise platform activity event ${i + 1} has been recorded for the assigned team.`, ["success", "info", "warning"][i % 3], i % 5 !== 0, date(i % 120)]);
    await insert("notifications", ["id", "user_id", "title", "message", "type", "is_read", "created_at"], notifications);
    console.log(`  notifications: ${notifications.length}`);

    const tables = ["users", "documents", "conversations", "messages", "agent_runs", "evaluations", "notifications"];
    console.log("\nFinal counts:");
    for (const table of tables) {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
        console.log(`  ${table}: ${rows[0].count}`);
    }
    console.log("\nLarge demo dataset inserted successfully.");
    console.log("Demo login: demo.user0001@enterprise.demo / password");
    await pool.end();
}

run().catch(async (error) => {
    console.error("Large MySQL seed failed:", error.message);
    await pool.end();
    process.exit(1);
});
