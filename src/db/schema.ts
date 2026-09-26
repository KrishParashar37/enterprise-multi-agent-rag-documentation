import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  float,
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

// Users
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"),
  tenantId: varchar("tenant_id", { length: 100 }).notNull().default("default"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_users_tenant_active").on(t.tenantId, t.isActive),
  index("idx_users_created_desc").on(t.createdAt),
]);

// Documents
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  storagePath: varchar("storage_path", { length: 1000 }),
  ownerId: varchar("owner_id", { length: 36 }).references(() => users.id),
  tenantId: varchar("tenant_id", { length: 100 }).notNull().default("default"),
  version: varchar("version", { length: 50 }).notNull().default("1.0"),
  status: varchar("status", { length: 50 }).notNull().default("UPLOADING"),
  category: varchar("category", { length: 100 }),
  department: varchar("department", { length: 100 }),
  tags: json("tags").$type<string[]>().default([]),
  chunkCount: int("chunk_count").notNull().default(0),
  pageCount: int("page_count").notNull().default(0),
  fileSize: int("file_size").notNull().default(0),
  accessLevel: varchar("access_level", { length: 50 }).notNull().default("employee"),
  description: text("description"),
  parentId: varchar("parent_id", { length: 36 }),
  isLatest: boolean("is_latest").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_documents_tenant_status_created").on(t.tenantId, t.status, t.createdAt),
  index("idx_documents_tenant_dept").on(t.tenantId, t.department),
  index("idx_documents_parent").on(t.parentId),
]);

// Conversations
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  title: varchar("title", { length: 500 }).notNull().default("New Conversation"),
  isPinned: boolean("is_pinned").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  category: varchar("category", { length: 100 }),
  tenantId: varchar("tenant_id", { length: 100 }).notNull().default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_conversations_user_archived_updated").on(t.userId, t.isArchived, t.updatedAt),
  index("idx_conversations_user_pinned").on(t.userId, t.isPinned),
]);

// Messages
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: varchar("conversation_id", { length: 36 }).references(() => conversations.id),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  citations: json("citations").$type<Citation[]>().default([]),
  agentTrace: json("agent_trace").$type<AgentTrace[]>().default([]),
  feedback: int("feedback"),
  isBookmarked: boolean("is_bookmarked").notNull().default(false),
  tokensUsed: int("tokens_used").default(0),
  latencyMs: int("latency_ms").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_messages_conversation_created").on(t.conversationId, t.createdAt),
  index("idx_messages_bookmarked").on(t.isBookmarked),
]);

// Agent Runs
export const agentRuns = mysqlTable("agent_runs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  traceId: varchar("trace_id", { length: 100 }).notNull(),
  agentName: varchar("agent_name", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("RUNNING"),
  model: varchar("model", { length: 100 }),
  inputTokens: int("input_tokens").notNull().default(0),
  outputTokens: int("output_tokens").notNull().default(0),
  latencyMs: int("latency_ms").notNull().default(0),
  cost: float("cost").notNull().default(0),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  conversationId: varchar("conversation_id", { length: 36 }).references(() => conversations.id),
  query: text("query"),
  error: text("error"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_agent_runs_created_desc").on(t.createdAt),
  index("idx_agent_runs_trace").on(t.traceId),
  index("idx_agent_runs_agent_status").on(t.agentName, t.status),
]);

// Evaluation Results
export const evaluations = mysqlTable("evaluations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: varchar("message_id", { length: 36 }).references(() => messages.id),
  datasetName: varchar("dataset_name", { length: 200 }),
  question: text("question").notNull(),
  expectedAnswer: text("expected_answer"),
  generatedAnswer: text("generated_answer").notNull(),
  faithfulness: float("faithfulness"),
  answerRelevance: float("answer_relevance"),
  contextRecall: float("context_recall"),
  citationAccuracy: float("citation_accuracy"),
  overallScore: float("overall_score"),
  passed: boolean("passed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Document Permissions
export const documentPermissions = mysqlTable("document_permissions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).references(() => documents.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  accessLevel: varchar("access_level", { length: 50 }).notNull().default("employee"),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

// Document Chunks
export const documentChunks = mysqlTable("document_chunks", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).references(() => documents.id),
  chunkIndex: int("chunk_index").notNull().default(0),
  content: text("content").notNull(),
  pageNumber: int("page_number").default(1),
  sectionTitle: varchar("section_title", { length: 500 }),
  tokenCount: int("token_count").default(0),
  charCount: int("char_count").default(0),
  embeddingProvider: varchar("embedding_provider", { length: 100 }),
  embeddingModel: varchar("embedding_model", { length: 150 }),
  embedding: json("embedding").$type<number[] | null>(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_chunks_document_index").on(t.documentId, t.chunkIndex),
]);

// Retrieval Results
export const retrievalResults = mysqlTable("retrieval_results", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: varchar("message_id", { length: 36 }).references(() => messages.id),
  chunkId: varchar("chunk_id", { length: 36 }).references(() => documentChunks.id),
  rankPosition: int("rank_position").notNull().default(0),
  similarityScore: float("similarity_score"),
  retrievalMethod: varchar("retrieval_method", { length: 20 }).notNull().default("HYBRID"),
  rerankScore: float("rerank_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_retrieval_message_rank").on(t.messageId, t.rankPosition),
]);

// Chat Feedback
export const chatFeedback = mysqlTable("chat_feedback", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: varchar("message_id", { length: 36 }).references(() => messages.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  rating: varchar("rating", { length: 10 }).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_feedback_message").on(t.messageId),
]);

// Document Processing Jobs
export const documentProcessingJobs = mysqlTable("document_processing_jobs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).references(() => documents.id),
  jobType: varchar("job_type", { length: 20 }).notNull().default("INDEX"),
  status: varchar("status", { length: 20 }).notNull().default("QUEUED"),
  progressPercent: float("progress_percent").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_jobs_document_status").on(t.documentId, t.status),
  index("idx_jobs_status_created").on(t.status, t.createdAt),
]);

// Audit Logs
export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: varchar("entity_id", { length: 36 }),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_audit_created_desc").on(t.createdAt),
  index("idx_audit_entity").on(t.entityType, t.entityId),
]);

// User Settings
export const userSettings = mysqlTable("user_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  key: varchar("key", { length: 100 }).notNull(),
  value: json("value").$type<unknown>(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_user_settings_user_key").on(t.userId, t.key),
]);

// Notifications
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_notifications_user_read_created").on(t.userId, t.isRead, t.createdAt),
]);

// Types
export type Citation = {
  documentId: string;
  documentName: string;
  page: number;
  section: string;
  excerpt: string;
};

export type AgentTrace = {
  agent: string;
  status: string;
  latencyMs: number;
  details?: string;
};

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type RetrievalResult = typeof retrievalResults.$inferSelect;
export type ChatFeedbackRow = typeof chatFeedback.$inferSelect;
export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserSetting = typeof userSettings.$inferSelect;
