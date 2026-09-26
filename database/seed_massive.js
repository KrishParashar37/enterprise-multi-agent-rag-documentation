const mysql = require("mysql2/promise");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const uri = process.env.DATABASE_URL;
if (!uri || !uri.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must be a mysql:// connection string");
}

const pool = mysql.createPool({ uri, waitForConnections: true, connectionLimit: 10 });
const BATCH_SIZE = 1000;

function uuid() { return crypto.randomUUID(); }
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
        const values = batch.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
        await pool.query(`INSERT IGNORE INTO ${table} (${columns.join(",")}) VALUES ${values}`, batch.flat());
        if (start % 5000 === 0 && start > 0) console.log(`  Inserted ${start} rows into ${table}...`);
    }
}

async function run() {
    console.log("Seeding MASSIVE demo data across all tables...");
    const hash = passwordHash("password");

    // 1. users
    const usersCount = 2000;
    const users = Array.from({ length: usersCount }, (_, i) => {
        const index = i + 1;
        return [id(1, index), `user${index}@massive.demo`, `Massive User ${index}`, hash, "EMPLOYEE", "default", 1, date(30), date(1)];
    });
    await insert("users", ["id", "email", "name", "password_hash", "role", "tenant_id", "is_active", "created_at", "updated_at"], users);
    console.log(`✅ users: ${users.length}`);

    // 2. documents (100,000)
    const docsCount = 100000;
    const statuses = ['UPLOADING', 'PROCESSING', 'INDEXED', 'FAILED'];
    const documents = Array.from({ length: docsCount }, (_, i) => {
        const index = i + 1;
        const randomStatus = statuses[i % 4]; // Distribute evenly among the 4 statuses
        return [id(2, index), `Document ${index}`, `doc_${index}.pdf`, "PDF", id(1, (i % usersCount) + 1), randomStatus, "IT", "Tech", 100, 10, 50000, "employee", "Massive doc", "[]", date(20), date(1)];
    });
    await insert("documents", ["id", "name", "original_name", "type", "owner_id", "status", "department", "category", "chunk_count", "page_count", "file_size", "access_level", "description", "tags", "created_at", "updated_at"], documents);
    console.log(`✅ documents: ${documents.length}`);

    // 3. document_chunks (1000)
    const chunks = Array.from({ length: 1000 }, (_, i) => {
        return [uuid(), id(2, (i % docsCount) + 1), i, `This is chunk data ${i} for testing massive indexing`, 1, `Section ${i}`, 15, 100, "openai", "text-embedding-3", "[]", "{}", date(10)];
    });
    await insert("document_chunks", ["id", "document_id", "chunk_index", "content", "page_number", "section_title", "token_count", "char_count", "embedding_provider", "embedding_model", "embedding", "metadata", "created_at"], chunks);
    console.log(`✅ document_chunks: ${chunks.length}`);

    // 4. document_permissions (1000)
    const perms = Array.from({ length: 1000 }, (_, i) => {
        return [uuid(), id(2, (i % docsCount) + 1), id(1, (i % usersCount) + 1), "employee", date(10)];
    });
    await insert("document_permissions", ["id", "document_id", "user_id", "access_level", "granted_at"], perms);
    console.log(`✅ document_permissions: ${perms.length}`);

    // 5. document_processing_jobs (500)
    const jobs = Array.from({ length: 500 }, (_, i) => {
        return [uuid(), id(2, i + 1), "INDEX", "SUCCESS", 100, date(5), date(4), null, "{}", date(5)];
    });
    await insert("document_processing_jobs", ["id", "document_id", "job_type", "status", "progress_percent", "started_at", "completed_at", "error_message", "metadata", "created_at"], jobs);
    console.log(`✅ document_processing_jobs: ${jobs.length}`);

    // 6. conversations & messages (20000 each)
    const convCount = 20000;
    const conversations = Array.from({ length: convCount }, (_, i) => {
        return [id(3, i + 1), id(1, (i % usersCount) + 1), `Massive Conv ${i}`, 0, 0, "General", date(15), date(2)];
    });
    await insert("conversations", ["id", "user_id", "title", "is_pinned", "is_archived", "category", "created_at", "updated_at"], conversations);
    
    const messagesCount = 20000;
    const messages = Array.from({ length: messagesCount }, (_, i) => {
        return [id(4, i + 1), id(3, (i % convCount) + 1), i % 2 === 0 ? "user" : "assistant", `Message content ${i}`, "[]", "[]", i % 10 === 0 ? 1 : null, 50, 100, date(14)];
    });
    await insert("messages", ["id", "conversation_id", "role", "content", "citations", "agent_trace", "feedback", "tokens_used", "latency_ms", "created_at"], messages);
    console.log(`✅ conversations: ${conversations.length}, messages: ${messages.length}`);

    // 7. chat_feedback (1000)
    const feedback = Array.from({ length: 1000 }, (_, i) => {
        return [uuid(), id(4, (i % messagesCount) + 1), id(1, (i % usersCount) + 1), i % 2 === 0 ? "LIKE" : "DISLIKE", `Comment ${i}`, date(5)];
    });
    await insert("chat_feedback", ["id", "message_id", "user_id", "rating", "comment", "created_at"], feedback);
    console.log(`✅ chat_feedback: ${feedback.length}`);

    // 8. retrieval_results (2000)
    const retrievals = Array.from({ length: 2000 }, (_, i) => {
        return [uuid(), id(4, (i % messagesCount) + 1), uuid(), i % 5, 0.85, "HYBRID", 0.9, date(2)];
    });
    await insert("retrieval_results", ["id", "message_id", "chunk_id", "rank_position", "similarity_score", "retrieval_method", "rerank_score", "created_at"], retrievals);
    console.log(`✅ retrieval_results: ${retrievals.length}`);

    // 9. audit_logs (2000)
    const audits = Array.from({ length: 2000 }, (_, i) => {
        return [uuid(), id(1, (i % usersCount) + 1), "VIEW_DOC", "document", id(2, (i % docsCount) + 1), "Viewed document", "127.0.0.1", "Mozilla/5.0", "{}", date(1)];
    });
    await insert("audit_logs", ["id", "user_id", "action", "entity_type", "entity_id", "description", "ip_address", "user_agent", "metadata", "created_at"], audits);
    console.log(`✅ audit_logs: ${audits.length}`);

    // 10. user_settings (1000)
    // FIX: Using backticks for `key` because it is a reserved word in MySQL!
    const settings = Array.from({ length: 1000 }, (_, i) => {
        return [uuid(), id(1, (i % usersCount) + 1), "theme", '"dark"', date(10)];
    });
    await insert("user_settings", ["id", "user_id", "`key`", "value", "updated_at"], settings);
    console.log(`✅ user_settings: ${settings.length}`);

    // 11. agent_runs (20000 - VERY LARGE QUANTITY)
    const runsCount = 20000;
    const runs = Array.from({ length: runsCount }, (_, i) => {
        return [id(5, i + 1), `massive-trace-${i}`, "SUPERVISOR", "SUCCESS", "gpt-oss-120b", 100, 50, 1500, 0.005, id(1, (i % usersCount) + 1), `Test query ${i}`, null, date(10)];
    });
    await insert("agent_runs", ["id", "trace_id", "agent_name", "status", "model", "input_tokens", "output_tokens", "latency_ms", "cost", "user_id", "query_text", "error_msg", "created_at"], runs);
    console.log(`✅ agent_runs: ${runs.length}`);
    
    // 12. evaluations (20000 - VERY LARGE QUANTITY)
    const evalCount = 20000;
    const evals = Array.from({ length: evalCount }, (_, i) => {
        return [uuid(), id(4, (i % messagesCount) + 1), "Massive Dataset", `Eval Question ${i}`, "Expected Answer", "Generated Answer", 0.9, 0.9, 0.8, 0.95, 0.9, 1, date(2)];
    });
    await insert("evaluations", ["id", "message_id", "dataset_name", "question", "expected_answer", "generated_answer", "faithfulness", "answer_relevance", "context_recall", "citation_accuracy", "overall_score", "passed", "created_at"], evals);
    console.log(`✅ evaluations: ${evals.length}`);
    
    // 13. notifications (20000 - VERY LARGE QUANTITY)
    const notifsCount = 20000;
    const notifs = Array.from({ length: notifsCount }, (_, i) => {
        return [uuid(), id(1, (i % usersCount) + 1), "Massive Notification", `This is notification ${i}`, "info", i % 3 === 0 ? 1 : 0, date(1)];
    });
    await insert("notifications", ["id", "user_id", "title", "message", "type", "is_read", "created_at"], notifs);
    console.log(`✅ notifications: ${notifs.length}`);

    console.log("\n🚀 Massive data seeding complete!");
    await pool.end();
}

run().catch(async (error) => {
    console.error("Massive seed failed:", error);
    await pool.end();
    process.exit(1);
});
