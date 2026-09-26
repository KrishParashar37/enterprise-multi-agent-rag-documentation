-- ============================================================
-- Enterprise Multi-Agent RAG Platform — MySQL Database
-- Run this in MySQL Workbench / phpMyAdmin / CLI
-- Command: mysql -u root -p enterprise_rag < mysql_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS enterprise_rag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE enterprise_rag;

-- ── Drop tables if exist (fresh start) ─────────────────────
DROP TABLE IF EXISTS document_permissions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS agent_runs;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;

-- ── 1. Users ────────────────────────────────────────────────
CREATE TABLE users (
  id           CHAR(36)       NOT NULL DEFAULT (UUID()),
  email        VARCHAR(255)   NOT NULL UNIQUE,
  name         VARCHAR(255)   NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role         ENUM('ADMIN','MANAGER','ANALYST','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  tenant_id    VARCHAR(100)   NOT NULL DEFAULT 'default',
  is_active    TINYINT(1)     NOT NULL DEFAULT 1,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email    (email),
  INDEX idx_users_role     (role),
  INDEX idx_users_tenant   (tenant_id)
) ENGINE=InnoDB;

-- ── 2. Documents ─────────────────────────────────────────────
CREATE TABLE documents (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  name          VARCHAR(500)  NOT NULL,
  original_name VARCHAR(500)  NOT NULL,
  type          ENUM('PDF','DOCX','TXT','MD','CSV') NOT NULL,
  storage_path  VARCHAR(1000),
  owner_id      CHAR(36),
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
  INDEX idx_doc_status     (status),
  INDEX idx_doc_department (department),
  INDEX idx_doc_tenant     (tenant_id),
  FULLTEXT idx_doc_search  (name, description)
) ENGINE=InnoDB;

-- ── 3. Conversations ─────────────────────────────────────────
CREATE TABLE conversations (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36),
  title       VARCHAR(500)  NOT NULL DEFAULT 'New Conversation',
  is_pinned   TINYINT(1)    NOT NULL DEFAULT 0,
  is_archived TINYINT(1)    NOT NULL DEFAULT 0,
  category    VARCHAR(100),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_conv_user     (user_id),
  INDEX idx_conv_archived (is_archived),
  INDEX idx_conv_pinned   (is_pinned)
) ENGINE=InnoDB;

-- ── 4. Messages ──────────────────────────────────────────────
CREATE TABLE messages (
  id              CHAR(36)  NOT NULL DEFAULT (UUID()),
  conversation_id CHAR(36),
  role            ENUM('user','assistant','system') NOT NULL,
  content         LONGTEXT  NOT NULL,
  citations       JSON,
  agent_trace     JSON,
  feedback        TINYINT,
  tokens_used     INT       DEFAULT 0,
  latency_ms      INT       DEFAULT 0,
  created_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_msg_conv  (conversation_id),
  INDEX idx_msg_role  (role),
  INDEX idx_msg_date  (created_at)
) ENGINE=InnoDB;

-- ── 5. Agent Runs ────────────────────────────────────────────
CREATE TABLE agent_runs (
  id              CHAR(36)  NOT NULL DEFAULT (UUID()),
  trace_id        VARCHAR(100) NOT NULL,
  agent_name      ENUM('SUPERVISOR','RETRIEVAL','SQL','RESEARCH','REVIEWER') NOT NULL,
  status          ENUM('RUNNING','SUCCESS','FAILED','RETRYING') NOT NULL DEFAULT 'RUNNING',
  model           VARCHAR(100),
  input_tokens    INT       NOT NULL DEFAULT 0,
  output_tokens   INT       NOT NULL DEFAULT 0,
  latency_ms      INT       NOT NULL DEFAULT 0,
  cost            DECIMAL(10,6) NOT NULL DEFAULT 0,
  user_id         CHAR(36),
  conversation_id CHAR(36),
  query           TEXT,
  error           TEXT,
  run_metadata    JSON,
  created_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
  INDEX idx_run_trace    (trace_id),
  INDEX idx_run_agent    (agent_name),
  INDEX idx_run_status   (status),
  INDEX idx_run_date     (created_at)
) ENGINE=InnoDB;

-- ── 6. Evaluations ───────────────────────────────────────────
CREATE TABLE evaluations (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  message_id        CHAR(36),
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
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_eval_dataset (dataset_name),
  INDEX idx_eval_passed  (passed)
) ENGINE=InnoDB;

-- ── 7. Document Permissions ──────────────────────────────────
CREATE TABLE document_permissions (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  document_id  CHAR(36),
  user_id      CHAR(36),
  access_level ENUM('public','employee','manager','admin') NOT NULL DEFAULT 'employee',
  granted_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_doc_user (document_id, user_id)
) ENGINE=InnoDB;

-- ── 8. Notifications ─────────────────────────────────────────
CREATE TABLE notifications (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36),
  title      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user   (user_id),
  INDEX idx_notif_unread (is_read)
) ENGINE=InnoDB;


-- ============================================================
-- SEED DATA — Initial admin user + sample data
-- ============================================================

-- Admin user (password = "password" hashed with SHA2)
INSERT INTO users (id, email, name, password_hash, role) VALUES
  (UUID(), 'admin@enterprise.com',   'Admin User',    SHA2('password', 256), 'ADMIN'),
  (UUID(), 'manager@enterprise.com', 'Manager User',  SHA2('password', 256), 'MANAGER'),
  (UUID(), 'analyst@enterprise.com', 'Analyst User',  SHA2('password', 256), 'ANALYST'),
  (UUID(), 'employee@enterprise.com','Employee User', SHA2('password', 256), 'EMPLOYEE');

-- Sample documents
INSERT INTO documents (id, name, original_name, type, status, department, category, chunk_count, page_count, file_size, access_level, description, tags) VALUES
  (UUID(), 'Employee Handbook 2025',    'employee_handbook.pdf',    'PDF',  'INDEXED',    'Human Resources', 'HR',          482, 124, 4200000, 'employee', 'Complete HR policies for 2025',           JSON_ARRAY('hr','policy','handbook')),
  (UUID(), 'Remote Work Policy',        'remote_work_policy.pdf',   'PDF',  'INDEXED',    'Human Resources', 'HR',          82,  18,  890000,  'employee', 'Guidelines for remote work',              JSON_ARRAY('remote','policy','hybrid')),
  (UUID(), 'Q4 2024 Financial Report',  'q4_2024_financial.pdf',    'PDF',  'INDEXED',    'Finance',         'Finance',     290, 78,  6800000, 'manager',  'Q4 2024 financial results and analysis',  JSON_ARRAY('finance','quarterly','report')),
  (UUID(), 'API Architecture v3',       'api_architecture_v3.md',   'MD',   'INDEXED',    'Technology',      'Engineering', 156, 42,  520000,  'employee', 'API architecture and design decisions',   JSON_ARRAY('api','engineering','architecture')),
  (UUID(), 'Security Compliance Policy','security_compliance.pdf',  'PDF',  'INDEXED',    'IT Security',     'Security',    210, 56,  3100000, 'admin',    'Enterprise security compliance',          JSON_ARRAY('security','compliance','iso27001')),
  (UUID(), 'Sales Performance Q1 2025', 'sales_q1_2025.csv',        'CSV',  'INDEXED',    'Sales',           'Sales',       48,  1,   120000,  'manager',  'Q1 2025 sales performance by region',     JSON_ARRAY('sales','performance','q1')),
  (UUID(), 'Employee Benefits Guide',   'benefits_guide_2025.pdf',  'PDF',  'PROCESSING', 'Human Resources', 'HR',          0,   34,  2400000, 'employee', 'Complete guide to employee benefits',     JSON_ARRAY('hr','benefits','insurance')),
  (UUID(), 'Deployment Runbook',        'deployment_runbook.md',    'MD',   'FAILED',     'Technology',      'Engineering', 0,   28,  380000,  'employee', 'Step-by-step deployment procedures',      JSON_ARRAY('devops','deployment','engineering'));


-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Get all documents with owner info
-- SELECT d.*, u.name as owner_name FROM documents d LEFT JOIN users u ON d.owner_id = u.id ORDER BY d.created_at DESC;

-- Get conversation with message count
-- SELECT c.*, COUNT(m.id) as message_count FROM conversations c LEFT JOIN messages m ON c.id = m.conversation_id GROUP BY c.id ORDER BY c.updated_at DESC;

-- Get agent performance stats
-- SELECT agent_name, COUNT(*) as total_runs, AVG(latency_ms) as avg_latency, SUM(cost) as total_cost, SUM(CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END)/COUNT(*)*100 as success_rate FROM agent_runs GROUP BY agent_name;

-- Dashboard KPIs
-- SELECT (SELECT COUNT(*) FROM documents) as total_docs, (SELECT COUNT(*) FROM users WHERE is_active=1) as active_users, (SELECT COUNT(*) FROM conversations) as total_convs, (SELECT COALESCE(SUM(cost),0) FROM agent_runs) as total_cost, (SELECT COALESCE(AVG(latency_ms),0) FROM agent_runs) as avg_latency_ms;

-- Recent agent runs
-- SELECT ar.*, u.name as user_name FROM agent_runs ar LEFT JOIN users u ON ar.user_id = u.id ORDER BY ar.created_at DESC LIMIT 20;

-- Evaluation summary
-- SELECT dataset_name, COUNT(*) as total, SUM(passed) as passed, AVG(overall_score)*100 as avg_score, AVG(faithfulness)*100 as avg_faith FROM evaluations GROUP BY dataset_name;
