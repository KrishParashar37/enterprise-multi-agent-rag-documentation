-- Migration 0001 — align the database with src/db/schema.ts
--
-- Dialect: MySQL 8 (the configured DATABASE_URL is mysql://…).
-- PostgreSQL equivalents are noted in comments; adjust types if you switch dialects.
--
-- This migration is ADDITIVE and IDEMPOTENT. It only adds new columns, tables and
-- indexes — it never drops or rewrites existing data. The database already holds
-- production-like rows (504 users, 258 documents, 4802 messages), so every
-- statement is written to be safe to re-run.
--
-- Apply with:
--   mysql -h 127.0.0.1 -u root -p enterprise_rag < src/db/migrations/0001_align_schema.sql
--
-- Review notes (plan item 49):
--   * `conversations.tenant_id` is added with a DEFAULT so existing rows backfill
--     without a separate UPDATE and without locking the table.
--   * `messages.is_bookmarked` likewise.
--   * `documents.parent_id` / `documents.is_latest` support version history.
--     Existing rows are marked is_latest = 1 so nothing disappears from listings.
--   * Indexes target the exact ORDER BY / WHERE shapes used by src/db/queries.ts.

-- ─────────────────────────────
-- 1. conversations — tenant scoping for isolation
-- ─────────────────────────────
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) NOT NULL DEFAULT 'default';

-- ─────────────────────────────
-- 2. messages — persistent bookmarks (plan item 22)
-- ─────────────────────────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_bookmarked TINYINT(1) NOT NULL DEFAULT 0;

-- ─────────────────────────────
-- 3. documents — version history (plan item 33)
-- ─────────────────────────────
-- Split into one statement per column: the runner resolves `IF NOT EXISTS`
-- per column, and MySQL has no multi-column `ADD COLUMN IF NOT EXISTS` form.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36) NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_latest TINYINT(1) NOT NULL DEFAULT 1;

-- Existing documents are all treated as their own latest revision.
UPDATE documents SET is_latest = 1 WHERE is_latest IS NULL;

-- ─────────────────────────────
-- 4. user_settings — per-user preference persistence (items 43, 44)
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id         VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  `key`      VARCHAR(100) NOT NULL,
  value      JSON         NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_settings_user_key (user_id, `key`),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────
-- 5. Indexes for the paginated list queries (plan item 49)
-- ─────────────────────────────
-- Users directory: tenant + active filter, newest-first ordering.
CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_desc  ON users (created_at DESC);

-- Documents directory: the dominant predicate set.
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status_created
  ON documents (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_dept
  ON documents (tenant_id, department);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents (parent_id);

-- Conversations memory view: owner + archived + recency, and pinned-first.
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived_updated
  ON conversations (user_id, is_archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_pinned
  ON conversations (user_id, is_pinned);

-- Message history for a conversation, in order.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_bookmarked ON messages (is_bookmarked);

-- Agent run / trace listings.
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_desc ON agent_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trace        ON agent_runs (trace_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_status ON agent_runs (agent_name, status);

-- Retrieval + processing job lookups.
CREATE TABLE IF NOT EXISTS document_chunks (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  document_id VARCHAR(36),
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  page_number INT DEFAULT 1,
  section_title VARCHAR(500),
  token_count INT DEFAULT 0,
  char_count INT DEFAULT 0,
  embedding_provider VARCHAR(100),
  embedding_model VARCHAR(150),
  embedding JSON,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS retrieval_results (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  message_id VARCHAR(36),
  chunk_id VARCHAR(36),
  rank_position INT NOT NULL DEFAULT 0,
  similarity_score FLOAT,
  retrieval_method VARCHAR(20) NOT NULL DEFAULT 'HYBRID',
  rerank_score FLOAT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS document_processing_jobs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  document_id VARCHAR(36),
  job_type VARCHAR(20) NOT NULL DEFAULT 'INDEX',
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  progress_percent FLOAT NOT NULL DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_retrieval_message_rank
  ON retrieval_results (message_id, rank_position);
CREATE INDEX IF NOT EXISTS idx_chunks_document_index
  ON document_chunks (document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_jobs_document_status
  ON document_processing_jobs (document_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created
  ON document_processing_jobs (status, created_at);

-- Audit + feedback + notifications.
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(36),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chat_feedback (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  message_id VARCHAR(36),
  user_id VARCHAR(36),
  rating VARCHAR(10) NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_audit_created_desc ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message   ON chat_feedback (message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at DESC);

-- ─────────────────────────────
-- 6. Duplicate/scratch tables
-- ─────────────────────────────
-- The live database contains `users1` and `users3` (0 rows, not referenced by any
-- code path). They are intentionally NOT dropped here: removing tables is a
-- destructive decision that should be made deliberately, not by a schema-align
-- migration. Investigate their origin, then drop them in a separate migration.
