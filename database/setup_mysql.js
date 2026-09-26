/**
 * MySQL Database Setup Script
 * Run: node database/setup_mysql.js
 */
const mysql = require("mysql2/promise");
const crypto = require("crypto");

const CONFIG = {
  host: "127.0.0.1", port: 3306,
  user: "root", password: "Krish@1234",
  database: "enterprise_rag",
};

function uuid() {
  return crypto.randomUUID();
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function run() {
  const conn = await mysql.createConnection(CONFIG);
  console.log("✅ MySQL Connected!");

  // Disable FK checks for clean drop
  await conn.query("SET FOREIGN_KEY_CHECKS=0");

  // Drop all tables
  const drops = ["document_permissions","notifications","evaluations","agent_runs","messages","conversations","documents","users"];
  for (const t of drops) {
    await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`  Dropped: ${t}`);
  }
  await conn.query("SET FOREIGN_KEY_CHECKS=1");

  // ── CREATE TABLES ────────────────────────────────
  console.log("\n📋 Creating tables...");

  await conn.query(`
    CREATE TABLE users (
      id           VARCHAR(36)   NOT NULL,
      email        VARCHAR(255)  NOT NULL,
      name         VARCHAR(255)  NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role         ENUM('ADMIN','MANAGER','ANALYST','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
      tenant_id    VARCHAR(100)  NOT NULL DEFAULT 'default',
      is_active    TINYINT(1)    NOT NULL DEFAULT 1,
      created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ users");

  await conn.query(`
    CREATE TABLE documents (
      id            VARCHAR(36)   NOT NULL,
      name          VARCHAR(500)  NOT NULL,
      original_name VARCHAR(500)  NOT NULL,
      type          ENUM('PDF','DOCX','TXT','MD','CSV') NOT NULL,
      storage_path  VARCHAR(1000),
      owner_id      VARCHAR(36),
      tenant_id     VARCHAR(100)  NOT NULL DEFAULT 'default',
      version       VARCHAR(50)   NOT NULL DEFAULT '1.0',
      status        ENUM('UPLOADING','PROCESSING','INDEXED','FAILED') NOT NULL DEFAULT 'UPLOADING',
      category      VARCHAR(100),
      department    VARCHAR(100),
      tags          JSON,
      chunk_count   INT           NOT NULL DEFAULT 0,
      page_count    INT           NOT NULL DEFAULT 0,
      file_size     BIGINT        NOT NULL DEFAULT 0,
      access_level  ENUM('public','employee','manager','admin') NOT NULL DEFAULT 'employee',
      description   TEXT,
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_status (status),
      INDEX idx_dept (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ documents");

  await conn.query(`
    CREATE TABLE conversations (
      id          VARCHAR(36)   NOT NULL,
      user_id     VARCHAR(36),
      title       VARCHAR(500)  NOT NULL DEFAULT 'New Conversation',
      is_pinned   TINYINT(1)    NOT NULL DEFAULT 0,
      is_archived TINYINT(1)    NOT NULL DEFAULT 0,
      category    VARCHAR(100),
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_archived (is_archived)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ conversations");

  await conn.query(`
    CREATE TABLE messages (
      id              VARCHAR(36)  NOT NULL,
      conversation_id VARCHAR(36),
      role            ENUM('user','assistant','system') NOT NULL,
      content         LONGTEXT     NOT NULL,
      citations       JSON,
      agent_trace     JSON,
      feedback        TINYINT,
      tokens_used     INT          DEFAULT 0,
      latency_ms      INT          DEFAULT 0,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      INDEX idx_conv (conversation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ messages");

  await conn.query(`
    CREATE TABLE agent_runs (
      id              VARCHAR(36)   NOT NULL,
      trace_id        VARCHAR(100)  NOT NULL,
      agent_name      ENUM('SUPERVISOR','RETRIEVAL','SQL','RESEARCH','REVIEWER') NOT NULL,
      status          ENUM('RUNNING','SUCCESS','FAILED','RETRYING') NOT NULL DEFAULT 'RUNNING',
      model           VARCHAR(100),
      input_tokens    INT           NOT NULL DEFAULT 0,
      output_tokens   INT           NOT NULL DEFAULT 0,
      latency_ms      INT           NOT NULL DEFAULT 0,
      cost            DECIMAL(10,6) NOT NULL DEFAULT 0,
      user_id         VARCHAR(36),
      conversation_id VARCHAR(36),
      query_text      TEXT,
      error_msg       TEXT,
      created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_trace (trace_id),
      INDEX idx_agent (agent_name),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ agent_runs");

  await conn.query(`
    CREATE TABLE evaluations (
      id                VARCHAR(36)  NOT NULL,
      message_id        VARCHAR(36),
      dataset_name      VARCHAR(200),
      question          TEXT         NOT NULL,
      expected_answer   TEXT,
      generated_answer  TEXT         NOT NULL,
      faithfulness      FLOAT,
      answer_relevance  FLOAT,
      context_recall    FLOAT,
      citation_accuracy FLOAT,
      overall_score     FLOAT,
      passed            TINYINT(1),
      created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_dataset (dataset_name),
      INDEX idx_passed (passed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ evaluations");

  await conn.query(`
    CREATE TABLE document_permissions (
      id           VARCHAR(36) NOT NULL,
      document_id  VARCHAR(36),
      user_id      VARCHAR(36),
      access_level ENUM('public','employee','manager','admin') NOT NULL DEFAULT 'employee',
      granted_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ document_permissions");

  await conn.query(`
    CREATE TABLE notifications (
      id         VARCHAR(36)   NOT NULL,
      user_id    VARCHAR(36),
      title      VARCHAR(255)  NOT NULL,
      message    TEXT          NOT NULL,
      type       VARCHAR(50)   NOT NULL DEFAULT 'info',
      is_read    TINYINT(1)    NOT NULL DEFAULT 0,
      created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user   (user_id),
      INDEX idx_unread (is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("  ✅ notifications");

  // ── SEED DATA ────────────────────────────────────
  console.log("\n🌱 Seeding data...");

  // Users
  const adminId    = uuid();
  const managerId  = uuid();
  const analystId  = uuid();
  const employeeId = uuid();
  const pwd = sha256("password");

  await conn.query(`
    INSERT INTO users (id,email,name,password_hash,role) VALUES
    (?,?,?,?,'ADMIN'),
    (?,?,?,?,'MANAGER'),
    (?,?,?,?,'ANALYST'),
    (?,?,?,?,'EMPLOYEE')
  `, [
    adminId,    "admin@enterprise.com",    "Admin User",     pwd,
    managerId,  "manager@enterprise.com",  "Manager User",   pwd,
    analystId,  "analyst@enterprise.com",  "Analyst User",   pwd,
    employeeId, "employee@enterprise.com", "Employee User",  pwd,
  ]);
  console.log("  ✅ 4 users");

  // Documents
  const docs = [
    [uuid(), "Employee Handbook 2025",     "employee_handbook.pdf",   "PDF",  adminId,  "INDEXED",    "Human Resources", "HR",          482, 124, 4200000, "employee", "Complete HR policies for 2025",         '["hr","policy","handbook"]'],
    [uuid(), "Remote Work Policy",         "remote_work.pdf",         "PDF",  adminId,  "INDEXED",    "Human Resources", "HR",          82,  18,  890000,  "employee", "Remote work guidelines and requirements", '["remote","policy","hybrid"]'],
    [uuid(), "Q4 2024 Financial Report",   "q4_2024_financial.pdf",   "PDF",  managerId,"INDEXED",    "Finance",         "Finance",     290, 78,  6800000, "manager",  "Q4 2024 financial results and analysis",  '["finance","quarterly","report"]'],
    [uuid(), "API Architecture v3",        "api_architecture_v3.md",  "MD",   adminId,  "INDEXED",    "Technology",      "Engineering", 156, 42,  520000,  "employee", "API architecture and design decisions",   '["api","engineering","architecture"]'],
    [uuid(), "Security Compliance Policy", "security_compliance.pdf", "PDF",  adminId,  "INDEXED",    "IT Security",     "Security",    210, 56,  3100000, "admin",    "Enterprise security compliance",          '["security","compliance","iso27001"]'],
    [uuid(), "Sales Performance Q1 2025",  "sales_q1_2025.csv",       "CSV",  managerId,"INDEXED",    "Sales",           "Sales",       48,  1,   120000,  "manager",  "Q1 2025 sales performance by region",     '["sales","performance","q1"]'],
    [uuid(), "Employee Benefits Guide",    "benefits_guide.pdf",      "PDF",  adminId,  "PROCESSING", "Human Resources", "HR",          0,   34,  2400000, "employee", "Complete guide to employee benefits",     '["hr","benefits","insurance"]'],
    [uuid(), "Deployment Runbook",         "deployment_runbook.md",   "MD",   adminId,  "FAILED",     "Technology",      "Engineering", 0,   28,  380000,  "employee", "Step-by-step deployment procedures",     '["devops","deployment","engineering"]'],
  ];

  for (const d of docs) {
    await conn.query(
      `INSERT INTO documents (id,name,original_name,type,owner_id,status,department,category,chunk_count,page_count,file_size,access_level,description,tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, d
    );
  }
  console.log("  ✅ 8 documents");

  // Conversations
  const convId1 = uuid(); const convId2 = uuid(); const convId3 = uuid();
  await conn.query(`
    INSERT INTO conversations (id,user_id,title,is_pinned,category) VALUES
    (?,?,'Leave Policy Questions',1,'HR'),
    (?,?,'Remote Work Guidelines',0,'HR'),
    (?,?,'Q4 Financial Analysis',1,'Finance')
  `, [convId1, adminId, convId2, adminId, convId3, managerId]);
  console.log("  ✅ 3 conversations");

  // Messages
  const msgId1 = uuid(); const msgId2 = uuid();
  await conn.query(`
    INSERT INTO messages (id,conversation_id,role,content,tokens_used,latency_ms) VALUES
    (?,?,'user','What is our employee leave policy for 2025?',0,0),
    (?,?,'assistant','Based on the Employee Handbook 2025, employees receive **20 annual leave days** per calendar year. Sick leave: 12 days. Maternity: 26 weeks paid. Paternity: 4 weeks paid.',840,2840)
  `, [msgId1, convId1, msgId2, convId1]);
  console.log("  ✅ 2 messages");

  // Agent Runs
  const traceId = `trace-${Date.now()}`;
  const agentData = [
    ["SUPERVISOR", "SUCCESS",  "gpt-oss-120b",          420, 180, 180,  0.021],
    ["RETRIEVAL",  "SUCCESS",  "text-embedding-3-small", 280, 0,   420,  0.003],
    ["SQL",        "RETRYING", "gpt-oss-120b",           540, 220, 3200, 0.038],
    ["RESEARCH",   "SUCCESS",  "gpt-oss-120b",           380, 290, 2100, 0.018],
    ["REVIEWER",   "SUCCESS",  "gpt-oss-120b",           680, 120, 890,  0.012],
  ];
  for (const [agent, status, model, inp, out, lat, cost] of agentData) {
    await conn.query(
      `INSERT INTO agent_runs (id,trace_id,agent_name,status,model,input_tokens,output_tokens,latency_ms,cost,user_id,query_text)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uuid(), traceId, agent, status, model, inp, out, lat, cost, adminId, "What is the leave policy?"]
    );
  }
  console.log("  ✅ 5 agent runs");

  // Evaluations
  const evals = [
    [uuid(), "Enterprise QA v2", "What is the employee leave policy?", "20 annual leave days", "Employees receive 20 annual leave days per year.", 0.98, 0.99, 0.92, 1.00, 0.97, 1],
    [uuid(), "Enterprise QA v2", "What is the remote work policy?",    "3 days in office",     "Remote employees must attend office minimum 3 days/week.", 0.94, 0.96, 0.88, 0.95, 0.93, 1],
    [uuid(), "Enterprise QA v2", "What are the paternity leave days?", "4 weeks paid",         "The company offers 2 weeks of paternity leave.", 0.42, 0.91, 0.65, 0.40, 0.59, 0],
    [uuid(), "Enterprise QA v2", "What is the security policy?",       "ISO 27001 compliant",  "Our data security follows ISO 27001 with quarterly audits.", 0.96, 0.93, 0.91, 0.98, 0.94, 1],
  ];
  for (const e of evals) {
    await conn.query(
      `INSERT INTO evaluations (id,dataset_name,question,expected_answer,generated_answer,faithfulness,answer_relevance,context_recall,citation_accuracy,overall_score,passed)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`, e
    );
  }
  console.log("  ✅ 4 evaluations");

  // Notifications
  const notifs = [
    [uuid(), adminId, "Document Indexed",    "Employee Handbook 2025 successfully indexed (482 chunks)", "success", 0],
    [uuid(), adminId, "Ingestion Failed",    "Deployment Runbook failed to process. File may be corrupted.", "error", 0],
    [uuid(), adminId, "SQL Agent Retry",     "SQL Agent retried query 2 times before succeeding", "warning", 1],
    [uuid(), adminId, "Evaluation Complete", "Enterprise QA v2 evaluation completed. Score: 94.2%", "success", 1],
    [uuid(), adminId, "New User Added",      "Employee User has been added to the platform", "info", 1],
  ];
  for (const n of notifs) {
    await conn.query(
      "INSERT INTO notifications (id,user_id,title,message,type,is_read) VALUES (?,?,?,?,?,?)", n
    );
  }
  console.log("  ✅ 5 notifications");

  // Verify
  console.log("\n📊 Final counts:");
  const tables = ["users","documents","conversations","messages","agent_runs","evaluations","notifications"];
  for (const t of tables) {
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    console.log(`  ${t}: ${rows[0].cnt} rows`);
  }

  await conn.end();
  console.log("\n✅ MySQL database setup complete!");
  console.log("   Login: admin@enterprise.com / password");
}

run().catch((err) => { console.error("❌ Error:", err.message); process.exit(1); });
