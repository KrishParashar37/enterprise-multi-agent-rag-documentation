// Shared types used across all pages

export type UserRole = "ADMIN" | "MANAGER" | "ANALYST" | "EMPLOYEE";
export type DocStatus = "UPLOADING" | "PROCESSING" | "INDEXED" | "FAILED";
export type DocType = "PDF" | "DOCX" | "TXT" | "MD" | "CSV";
export type AgentName = "SUPERVISOR" | "RETRIEVAL" | "SQL" | "RESEARCH" | "REVIEWER";
export type AgentStatus = "RUNNING" | "SUCCESS" | "FAILED" | "RETRYING";
export type MsgRole = "user" | "assistant" | "system";

export interface User {
  id: string; email: string; name: string; role: UserRole;
  isActive: boolean; createdAt: Date | string; updatedAt?: Date | string;
  tenantId?: string;
}

export interface Document {
  id: string; name: string; originalName: string; type: DocType;
  storagePath?: string; ownerId?: string; tenantId?: string;
  version: string; status: DocStatus; category?: string;
  department?: string; tags: string[]; chunkCount: number;
  pageCount: number; fileSize: number; accessLevel: string;
  description?: string; createdAt: Date | string; updatedAt: Date | string;
}

export interface Conversation {
  id: string; userId?: string; title: string; isPinned: boolean;
  isArchived: boolean; category?: string;
  createdAt: Date | string; updatedAt: Date | string;
  messageCount?: number;
}

export interface Message {
  id: string; conversationId?: string; role: MsgRole;
  content: string; citations?: Citation[]; agentTrace?: AgentTrace[];
  feedback?: number; tokensUsed?: number; latencyMs?: number;
  createdAt: Date | string;
}

export interface Citation {
  documentId: string; documentName: string; page: number;
  section: string; excerpt: string;
}

export interface AgentTrace {
  agent: string; status: string; latencyMs: number; details?: string;
}

export interface AgentRun {
  id: string; traceId: string; agentName: AgentName; status: AgentStatus;
  model?: string; inputTokens: number; outputTokens: number;
  latencyMs: number; cost: number; userId?: string;
  conversationId?: string; query?: string; error?: string;
  createdAt: Date | string;
}

export interface Evaluation {
  id: string; messageId?: string; datasetName?: string;
  question: string; expectedAnswer?: string; generatedAnswer: string;
  faithfulness?: number; answerRelevance?: number; contextRecall?: number;
  citationAccuracy?: number; overallScore?: number; passed?: boolean;
  createdAt: Date | string;
}

export interface Notification {
  id: string; userId?: string; title: string; message: string;
  type: string; isRead: boolean; createdAt: Date | string;
}

export interface AgentStat {
  name: string; runs: number; success: number; avgLatency: number; color: string;
}

export interface TraceStep {
  agent: string; status: string; latencyMs: number; tokens: number; details: string;
}

export interface Trace {
  traceId: string; query: string; user: string; totalLatencyMs: number;
  totalCost: number; totalTokens: number; status: string;
  steps: TraceStep[]; createdAt: Date | string;
}

export interface DashKPIs {
  totalDocuments: number; totalUsers: number; totalConversations: number;
  totalAgentRuns: number; totalMessages: number; totalCost: number;
  avgLatencyMs: number; successRate?: number; source: string;
}
