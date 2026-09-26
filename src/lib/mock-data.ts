// ✅ MASSIVE enterprise demo data — powers the entire platform
import type {
  User, Document, Conversation, Message, AgentRun, Evaluation,
  Notification, AgentStat, Trace, DashKPIs
} from "./types";

// ─── Dashboard KPIs ───
export const mockKPIs: DashKPIs = {
  totalDocuments: 847, totalUsers: 156, totalConversations: 2341,
  totalAgentRuns: 18492, totalMessages: 48291, totalCost: 127.85,
  avgLatencyMs: 1240, successRate: 96.4, source: "mock",
};

// ─── Query Trends (12 months) ───
export const mockQueryTrend: { date: string; queries: number; cost: number }[] = [
  { date: "Jan", queries: 2400, cost: 8.2 }, { date: "Feb", queries: 3100, cost: 10.8 },
  { date: "Mar", queries: 2800, cost: 9.6 }, { date: "Apr", queries: 4200, cost: 14.5 },
  { date: "May", queries: 3800, cost: 13.2 }, { date: "Jun", queries: 5100, cost: 17.6 },
  { date: "Jul", queries: 4600, cost: 15.9 }, { date: "Aug", queries: 6200, cost: 21.4 },
  { date: "Sep", queries: 5800, cost: 20.1 }, { date: "Oct", queries: 7100, cost: 24.5 },
  { date: "Nov", queries: 8400, cost: 29.0 }, { date: "Dec", queries: 9200, cost: 31.8 },
];

// ─── Agent Stats ───
export const mockAgentStats: AgentStat[] = [
  { name: "SUPERVISOR", runs: 18492, success: 99.2, avgLatency: 82,  color: "#7c3aed" },
  { name: "RETRIEVAL",  runs: 17340, success: 97.8, avgLatency: 340, color: "#c026d3" },
  { name: "SQL",        runs: 4210,  success: 94.1, avgLatency: 520, color: "#0d9488" },
  { name: "RESEARCH",   runs: 2890,  success: 91.5, avgLatency: 780, color: "#059669" },
  { name: "REVIEWER",   runs: 16200, success: 98.6, avgLatency: 190, color: "#d97706" },
];

// ─── 50+ Users ───
const depts = ["Engineering","HR","Finance","Sales","Marketing","Legal","Product","Support","Data Science","Operations"];
const roles: ("ADMIN"|"MANAGER"|"ANALYST"|"EMPLOYEE")[] = ["ADMIN","MANAGER","ANALYST","EMPLOYEE"];
const firstNames = ["Rahul","Priya","Amit","Sneha","Ananya","Vikram","Neha","Arjun","Kavita","Sanjay","Deepika","Rohan","Meera","Kunal","Pooja","Rajesh","Divya","Aditya","Nisha","Varun","Ishita","Gaurav","Ritika","Manish","Simran","Akash","Tanvi","Harsh","Swati","Nikhil","Shruti","Vivek","Pallavi","Karan","Anjali","Siddharth","Rani","Dev","Geeta","Suresh","Monica","Ashish","Lakshmi","Ravi","Bhavna","Tushar","Sarika","Pranav","Madhuri","Yash"];
const lastNames = ["Sharma","Singh","Kumar","Gupta","Roy","Patel","Verma","Joshi","Reddy","Malhotra","Iyer","Nair","Kapoor","Mishra","Rao","Choudhury","Dutta","Chauhan","Bose","Agarwal","Saxena","Thakur","Rastogi","Pillai","Das","Sinha","Menon","Banerjee","Mehta","Kulkarni","Shah","Tiwari","Pandey","Desai","Mukherjee","Chakraborty","Hegde","Kaur","Rajan","Shukla","Chopra","Gandhi","Bhatt","Yadav","Trivedi","Bhat","Khanna","Lal","Arora","Sethi"];
export const mockUsers: User[] = firstNames.map((fn, i) => ({
  id: `user-${String(i+1).padStart(3,"0")}`, email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@enterprise.com`,
  name: `${fn} ${lastNames[i]}`, role: roles[i % roles.length], isActive: i < 45,
  createdAt: new Date(2024, Math.floor(i/5), 10+i%20).toISOString(), updatedAt: new Date(2025, 7, 20-i%15).toISOString(),
}));

// ─── 30 Documents ───
export const mockDocuments: Document[] = [
  { id: "doc-001", name: "Employee Handbook 2025",       originalName: "Employee_Handbook_2025.pdf",       type: "PDF",  version: "3.2", status: "INDEXED",     category: "Policy",    department: "Human Resources",  tags: ["policy","hr","leave","benefits"],       chunkCount: 482,  pageCount: 156, fileSize: 4820000,  accessLevel: "employee", description: "Complete employee handbook with policies, benefits, and guidelines", createdAt: "2025-01-15T10:00:00Z", updatedAt: "2025-06-01T14:30:00Z" },
  { id: "doc-002", name: "Remote Work Policy",            originalName: "Remote_Work_Policy.pdf",            type: "PDF",  version: "2.1", status: "INDEXED",     category: "Policy",    department: "Human Resources",  tags: ["remote","vpn","hybrid"],               chunkCount: 128,  pageCount: 42,  fileSize: 1280000,  accessLevel: "employee", description: "Guidelines for remote and hybrid work arrangements",              createdAt: "2025-02-10T09:00:00Z", updatedAt: "2025-05-15T11:20:00Z" },
  { id: "doc-003", name: "Q4 2024 Financial Report",      originalName: "Q4_2024_Financial_Report.pdf",      type: "PDF",  version: "1.0", status: "INDEXED",     category: "Report",    department: "Finance",          tags: ["finance","quarterly","revenue"],        chunkCount: 218,  pageCount: 68,  fileSize: 3450000,  accessLevel: "manager",  description: "Quarterly financial performance and analysis",                    createdAt: "2025-01-30T08:00:00Z", updatedAt: "2025-01-30T08:00:00Z" },
  { id: "doc-004", name: "API Architecture v3",           originalName: "API_Architecture_v3.md",            type: "MD",   version: "3.0", status: "INDEXED",     category: "Technical", department: "Technology",        tags: ["api","rest","architecture"],            chunkCount: 342,  pageCount: 95,  fileSize: 890000,   accessLevel: "employee", description: "REST API design patterns and microservice architecture",          createdAt: "2025-04-15T14:00:00Z", updatedAt: "2025-07-22T16:45:00Z" },
  { id: "doc-005", name: "Security Compliance Policy",    originalName: "Security_Compliance.pdf",           type: "PDF",  version: "4.1", status: "INDEXED",     category: "Policy",    department: "IT Security",      tags: ["security","iso27001","compliance"],     chunkCount: 265,  pageCount: 78,  fileSize: 2640000,  accessLevel: "employee", description: "Information security policies and compliance requirements",        createdAt: "2025-01-05T07:30:00Z", updatedAt: "2025-08-10T09:15:00Z" },
  { id: "doc-006", name: "Benefits Guide 2025",           originalName: "Benefits_Guide_2025.pdf",           type: "PDF",  version: "1.0", status: "PROCESSING", category: "Policy",    department: "Human Resources",  tags: ["benefits","insurance","retirement"],    chunkCount: 0,    pageCount: 84,  fileSize: 3100000,  accessLevel: "employee", description: "Complete employee benefits guide including health and retirement", createdAt: "2025-08-20T12:00:00Z", updatedAt: "2025-08-20T12:00:00Z" },
  { id: "doc-007", name: "Sales Performance Q1 2025",     originalName: "Sales_Q1_2025.csv",                 type: "CSV",  version: "1.0", status: "INDEXED",     category: "Report",    department: "Sales",            tags: ["sales","quarterly","revenue"],          chunkCount: 156,  pageCount: 1,   fileSize: 420000,   accessLevel: "manager",  description: "Q1 2025 sales performance data by region and product",           createdAt: "2025-04-05T10:00:00Z", updatedAt: "2025-04-05T10:00:00Z" },
  { id: "doc-008", name: "Deployment Runbook",            originalName: "Deployment_Runbook.md",             type: "MD",   version: "2.3", status: "FAILED",      category: "Technical", department: "Technology",        tags: ["devops","deployment","runbook"],        chunkCount: 0,    pageCount: 45,  fileSize: 560000,   accessLevel: "admin",    description: "Production deployment procedures and rollback guide",            createdAt: "2025-05-20T15:00:00Z", updatedAt: "2025-05-20T15:30:00Z" },
  { id: "doc-009", name: "Customer Support Handbook",     originalName: "Support_Handbook.pdf",              type: "PDF",  version: "1.5", status: "INDEXED",     category: "Policy",    department: "Customer Success", tags: ["support","escalation","sla"],           chunkCount: 198,  pageCount: 62,  fileSize: 2100000,  accessLevel: "employee", description: "Support processes, SLAs, and escalation procedures",             createdAt: "2025-03-12T09:00:00Z", updatedAt: "2025-07-01T11:00:00Z" },
  { id: "doc-010", name: "Data Privacy Regulation Guide", originalName: "Data_Privacy_Guide.pdf",            type: "PDF",  version: "2.0", status: "INDEXED",     category: "Legal",     department: "Legal",            tags: ["privacy","gdpr","ccpa"],                chunkCount: 312,  pageCount: 94,  fileSize: 3800000,  accessLevel: "manager",  description: "Comprehensive guide to data privacy regulations and compliance", createdAt: "2025-02-28T08:00:00Z", updatedAt: "2025-06-15T14:00:00Z" },
  { id: "doc-011", name: "Marketing Strategy 2025",       originalName: "Marketing_Strategy_2025.pdf",       type: "PDF",  version: "1.0", status: "INDEXED",     category: "Strategy",  department: "Marketing",        tags: ["marketing","strategy","growth"],        chunkCount: 245,  pageCount: 72,  fileSize: 2890000,  accessLevel: "manager",  description: "Annual marketing strategy and growth plan",                       createdAt: "2025-01-20T11:00:00Z", updatedAt: "2025-03-15T09:00:00Z" },
  { id: "doc-012", name: "Product Roadmap H1 2025",       originalName: "Product_Roadmap_H1.pdf",            type: "PDF",  version: "2.0", status: "INDEXED",     category: "Strategy",  department: "Product",          tags: ["product","roadmap","features"],         chunkCount: 189,  pageCount: 48,  fileSize: 1560000,  accessLevel: "employee", description: "Product roadmap and feature priorities for H1 2025",             createdAt: "2025-01-10T08:00:00Z", updatedAt: "2025-04-22T16:00:00Z" },
  { id: "doc-013", name: "Onboarding Checklist",          originalName: "Onboarding_Checklist.docx",         type: "DOCX", version: "1.3", status: "INDEXED",     category: "Policy",    department: "Human Resources",  tags: ["onboarding","new-hire","checklist"],    chunkCount: 67,   pageCount: 15,  fileSize: 340000,   accessLevel: "employee", description: "Step-by-step onboarding checklist for new employees",            createdAt: "2025-02-05T10:00:00Z", updatedAt: "2025-06-10T14:30:00Z" },
  { id: "doc-014", name: "Cloud Infrastructure Guide",    originalName: "Cloud_Infrastructure.md",           type: "MD",   version: "4.2", status: "INDEXED",     category: "Technical", department: "Technology",        tags: ["aws","cloud","infrastructure"],         chunkCount: 410,  pageCount: 112, fileSize: 980000,   accessLevel: "employee", description: "AWS infrastructure architecture and best practices",              createdAt: "2025-03-01T09:00:00Z", updatedAt: "2025-08-15T11:00:00Z" },
  { id: "doc-015", name: "Vendor Procurement Policy",     originalName: "Vendor_Procurement.pdf",            type: "PDF",  version: "1.1", status: "INDEXED",     category: "Policy",    department: "Operations",       tags: ["procurement","vendor","budget"],        chunkCount: 142,  pageCount: 38,  fileSize: 1120000,  accessLevel: "manager",  description: "Vendor evaluation and procurement procedures",                   createdAt: "2025-04-12T08:30:00Z", updatedAt: "2025-07-20T10:00:00Z" },
  { id: "doc-016", name: "Data Science Best Practices",   originalName: "DS_Best_Practices.md",              type: "MD",   version: "2.0", status: "INDEXED",     category: "Technical", department: "Data Science",     tags: ["ml","data-science","best-practices"],  chunkCount: 298,  pageCount: 82,  fileSize: 720000,   accessLevel: "employee", description: "Machine learning and data science methodology guide",             createdAt: "2025-05-10T14:00:00Z", updatedAt: "2025-08-01T09:30:00Z" },
  { id: "doc-017", name: "Quarterly Business Review Q2",  originalName: "QBR_Q2_2025.pdf",                   type: "PDF",  version: "1.0", status: "INDEXED",     category: "Report",    department: "Sales",            tags: ["sales","quarterly","review"],           chunkCount: 176,  pageCount: 52,  fileSize: 2340000,  accessLevel: "manager",  description: "Q2 2025 quarterly business review and pipeline analysis",        createdAt: "2025-07-05T10:00:00Z", updatedAt: "2025-07-10T15:00:00Z" },
  { id: "doc-018", name: "Brand Guidelines v4",           originalName: "Brand_Guidelines_v4.pdf",           type: "PDF",  version: "4.0", status: "INDEXED",     category: "Policy",    department: "Marketing",        tags: ["brand","design","guidelines"],          chunkCount: 134,  pageCount: 64,  fileSize: 8200000,  accessLevel: "employee", description: "Brand identity, logo usage, and design system guidelines",        createdAt: "2025-02-15T09:00:00Z", updatedAt: "2025-06-20T11:00:00Z" },
  { id: "doc-019", name: "SOC 2 Compliance Report",       originalName: "SOC2_Report_2025.pdf",              type: "PDF",  version: "1.0", status: "INDEXED",     category: "Legal",     department: "IT Security",      tags: ["soc2","audit","compliance"],            chunkCount: 387,  pageCount: 120, fileSize: 5100000,  accessLevel: "admin",    description: "SOC 2 Type II compliance audit report and controls",             createdAt: "2025-06-01T08:00:00Z", updatedAt: "2025-06-30T16:00:00Z" },
  { id: "doc-020", name: "Customer Success Playbook",     originalName: "CS_Playbook.pdf",                   type: "PDF",  version: "2.1", status: "INDEXED",     category: "Policy",    department: "Customer Success", tags: ["cs","playbook","retention"],            chunkCount: 223,  pageCount: 58,  fileSize: 1890000,  accessLevel: "employee", description: "Customer success strategies and retention playbook",              createdAt: "2025-03-20T10:00:00Z", updatedAt: "2025-08-05T14:00:00Z" },
  { id: "doc-021", name: "Incident Response Plan",        originalName: "Incident_Response.pdf",             type: "PDF",  version: "3.0", status: "INDEXED",     category: "Policy",    department: "IT Security",      tags: ["incident","security","response"],       chunkCount: 178,  pageCount: 46,  fileSize: 1450000,  accessLevel: "employee", description: "Incident response procedures and escalation matrix",             createdAt: "2025-01-25T09:00:00Z", updatedAt: "2025-07-15T10:30:00Z" },
  { id: "doc-022", name: "Engineering OKRs Q3 2025",      originalName: "Engineering_OKRs_Q3.md",            type: "MD",   version: "1.0", status: "INDEXED",     category: "Strategy",  department: "Technology",        tags: ["okr","engineering","goals"],            chunkCount: 89,   pageCount: 22,  fileSize: 280000,   accessLevel: "employee", description: "Engineering team objectives and key results for Q3",              createdAt: "2025-07-01T08:00:00Z", updatedAt: "2025-07-01T08:00:00Z" },
  { id: "doc-023", name: "Competitive Analysis 2025",     originalName: "Competitive_Analysis.pdf",          type: "PDF",  version: "1.0", status: "PROCESSING", category: "Strategy",  department: "Sales",            tags: ["competitive","market","analysis"],      chunkCount: 0,    pageCount: 86,  fileSize: 4200000,  accessLevel: "manager",  description: "Market landscape and competitive positioning analysis",           createdAt: "2025-08-18T12:00:00Z", updatedAt: "2025-08-18T12:00:00Z" },
  { id: "doc-024", name: "Database Migration Guide",      originalName: "DB_Migration_Guide.md",             type: "MD",   version: "1.2", status: "INDEXED",     category: "Technical", department: "Technology",        tags: ["database","migration","postgres"],      chunkCount: 156,  pageCount: 38,  fileSize: 420000,   accessLevel: "admin",    description: "Step-by-step database migration and rollback procedures",         createdAt: "2025-05-15T14:00:00Z", updatedAt: "2025-08-12T09:00:00Z" },
  { id: "doc-025", name: "Revenue Forecasting Model",     originalName: "Revenue_Forecast_Model.csv",        type: "CSV",  version: "1.0", status: "INDEXED",     category: "Report",    department: "Finance",          tags: ["forecast","revenue","model"],           chunkCount: 98,   pageCount: 1,   fileSize: 890000,   accessLevel: "admin",    description: "Financial forecasting model with scenario analysis",              createdAt: "2025-06-20T10:00:00Z", updatedAt: "2025-08-01T16:00:00Z" },
  { id: "doc-026", name: "Employee Training Manual",      originalName: "Training_Manual.pdf",               type: "PDF",  version: "2.0", status: "INDEXED",     category: "Policy",    department: "Human Resources",  tags: ["training","learning","development"],    chunkCount: 334,  pageCount: 98,  fileSize: 3200000,  accessLevel: "employee", description: "Comprehensive training and professional development guide",        createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-07-30T11:00:00Z" },
  { id: "doc-027", name: "Partnership Agreement Template",originalName: "Partnership_Template.docx",         type: "DOCX", version: "1.0", status: "INDEXED",     category: "Legal",     department: "Legal",            tags: ["legal","partnership","template"],       chunkCount: 112,  pageCount: 28,  fileSize: 580000,   accessLevel: "admin",    description: "Standard partnership agreement template with legal terms",         createdAt: "2025-04-01T09:00:00Z", updatedAt: "2025-04-15T14:00:00Z" },
  { id: "doc-028", name: "Social Media Policy",           originalName: "Social_Media_Policy.pdf",           type: "PDF",  version: "1.5", status: "INDEXED",     category: "Policy",    department: "Marketing",        tags: ["social-media","policy","guidelines"],   chunkCount: 78,   pageCount: 20,  fileSize: 620000,   accessLevel: "employee", description: "Employee social media usage guidelines and policy",               createdAt: "2025-03-10T10:00:00Z", updatedAt: "2025-06-25T09:00:00Z" },
  { id: "doc-029", name: "IT Asset Management Policy",    originalName: "IT_Asset_Management.pdf",           type: "PDF",  version: "2.2", status: "INDEXED",     category: "Policy",    department: "Operations",       tags: ["assets","inventory","management"],      chunkCount: 145,  pageCount: 36,  fileSize: 980000,   accessLevel: "employee", description: "IT asset tracking, management, and disposal procedures",          createdAt: "2025-01-18T08:00:00Z", updatedAt: "2025-08-08T10:00:00Z" },
  { id: "doc-030", name: "Annual Budget 2025-26",         originalName: "Annual_Budget_2025_26.pdf",         type: "PDF",  version: "1.0", status: "FAILED",      category: "Report",    department: "Finance",          tags: ["budget","annual","planning"],           chunkCount: 0,    pageCount: 142, fileSize: 6800000,  accessLevel: "admin",    description: "Annual operating and capital budget for fiscal year 2025-26",     createdAt: "2025-08-15T12:00:00Z", updatedAt: "2025-08-15T12:30:00Z" },
];

// ─── Conversations ───
export const mockConversations: Conversation[] = [
  { id: "conv-001", userId: "user-001", title: "Leave policy clarification",             isPinned: true,  isArchived: false, category: "HR",        createdAt: "2025-08-20T10:30:00Z", updatedAt: "2025-08-20T11:15:00Z", messageCount: 6 },
  { id: "conv-002", userId: "user-001", title: "Q4 revenue analysis deep dive",          isPinned: true,  isArchived: false, category: "Finance",   createdAt: "2025-08-19T14:00:00Z", updatedAt: "2025-08-19T15:30:00Z", messageCount: 8 },
  { id: "conv-003", userId: "user-002", title: "Remote work VPN requirements",           isPinned: false, isArchived: false, category: "IT",        createdAt: "2025-08-18T09:00:00Z", updatedAt: "2025-08-18T09:45:00Z", messageCount: 4 },
  { id: "conv-004", userId: "user-003", title: "API rate limiting configuration",        isPinned: false, isArchived: false, category: "Technical", createdAt: "2025-08-17T16:00:00Z", updatedAt: "2025-08-17T17:20:00Z", messageCount: 10 },
  { id: "conv-005", userId: "user-001", title: "Security audit preparation checklist",   isPinned: false, isArchived: false, category: "Security",  createdAt: "2025-08-16T11:00:00Z", updatedAt: "2025-08-16T12:30:00Z", messageCount: 5 },
  { id: "conv-006", userId: "user-004", title: "Benefits enrollment process",            isPinned: false, isArchived: false, category: "HR",        createdAt: "2025-08-15T08:30:00Z", updatedAt: "2025-08-15T09:00:00Z", messageCount: 3 },
  { id: "conv-007", userId: "user-002", title: "Sales regional breakdown Q1",            isPinned: false, isArchived: true,  category: "Sales",     createdAt: "2025-07-10T10:00:00Z", updatedAt: "2025-07-10T11:00:00Z", messageCount: 7 },
  { id: "conv-008", userId: "user-005", title: "Cloud infrastructure cost optimization", isPinned: true,  isArchived: false, category: "Technical", createdAt: "2025-08-12T14:00:00Z", updatedAt: "2025-08-12T16:00:00Z", messageCount: 12 },
  { id: "conv-009", userId: "user-003", title: "Data privacy GDPR compliance check",     isPinned: false, isArchived: false, category: "Legal",     createdAt: "2025-08-10T09:00:00Z", updatedAt: "2025-08-10T11:00:00Z", messageCount: 6 },
  { id: "conv-010", userId: "user-006", title: "Marketing campaign budget allocation",   isPinned: false, isArchived: false, category: "Marketing", createdAt: "2025-08-08T10:00:00Z", updatedAt: "2025-08-08T12:00:00Z", messageCount: 9 },
];

// ─── Messages ───
export const mockMessages: Message[] = [
  { id: "msg-001", conversationId: "conv-001", role: "user",      content: "What is our company's annual leave policy?", createdAt: "2025-08-20T10:30:00Z" },
  { id: "msg-002", conversationId: "conv-001", role: "assistant", content: "## Annual Leave Policy\n\nEmployees receive **20 annual leave days** per calendar year, accruing at 1.67 days/month.\n\n### Special Leave\n- **Maternity Leave**: 26 weeks paid\n- **Paternity Leave**: 4 weeks paid\n- **Bereavement**: 5 days\n- **Sick Leave**: 12 days/year\n\n> Source: Employee Handbook 2025, p.42-45", citations: [{ documentId: "doc-001", documentName: "Employee Handbook 2025", page: 42, section: "Annual Leave", excerpt: "Employees receive 20 annual leave days per calendar year accruing at 1.67 days/month." }], agentTrace: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 80 }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 320 }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 150 }], tokensUsed: 245, latencyMs: 1240, createdAt: "2025-08-20T10:30:05Z" },
  { id: "msg-003", conversationId: "conv-001", role: "user",      content: "How many sick days do new employees get?", createdAt: "2025-08-20T10:35:00Z" },
  { id: "msg-004", conversationId: "conv-001", role: "assistant", content: "New employees receive the **full 12 sick days** from their start date, prorated for the remaining calendar year.\n\n> Source: Employee Handbook 2025, p.48", citations: [{ documentId: "doc-001", documentName: "Employee Handbook 2025", page: 48, section: "Sick Leave", excerpt: "New employees receive 12 sick days prorated for the remaining calendar year." }], agentTrace: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 65 }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 280 }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 120 }], tokensUsed: 180, latencyMs: 980, createdAt: "2025-08-20T10:35:04Z" },
  { id: "msg-005", conversationId: "conv-002", role: "user",      content: "Show me the Q4 2024 revenue breakdown", createdAt: "2025-08-19T14:00:00Z" },
  { id: "msg-006", conversationId: "conv-002", role: "assistant", content: "## Q4 2024 Financial Highlights\n\n| Metric | Value | YoY Change |\n|--------|-------|------------|\n| Revenue | **$42.8M** | +18% |\n| EBITDA Margin | **24.2%** | +2.1pp |\n| Net Profit | **$8.6M** | +22% |\n| Operating Cash Flow | **$11.2M** | +15% |\n\n> Source: Q4 2024 Financial Report, p.3", citations: [{ documentId: "doc-003", documentName: "Q4 2024 Financial Report", page: 3, section: "Revenue Summary", excerpt: "Q4 revenue: $42.8M (+18% YoY). EBITDA margin: 24.2%." }], agentTrace: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 75 }, { agent: "SQL", status: "SUCCESS", latencyMs: 480 }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 350 }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 160 }], tokensUsed: 320, latencyMs: 1580, createdAt: "2025-08-19T14:00:06Z" },
];

// ─── Agent Runs (expanded) ───
export const mockAgentRuns: AgentRun[] = [
  { id: "run-001", traceId: "trace-001", agentName: "SUPERVISOR", status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 120, outputTokens: 45,  latencyMs: 82,   cost: 0.0012, userId: "user-001", conversationId: "conv-001", query: "Leave policy question",  createdAt: "2025-08-20T10:30:01Z" },
  { id: "run-002", traceId: "trace-001", agentName: "RETRIEVAL",  status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 180, outputTokens: 320, latencyMs: 340,  cost: 0.0036, userId: "user-001", conversationId: "conv-001", query: "Leave policy question",  createdAt: "2025-08-20T10:30:02Z" },
  { id: "run-003", traceId: "trace-001", agentName: "REVIEWER",   status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 420, outputTokens: 60,  latencyMs: 150,  cost: 0.0018, userId: "user-001", conversationId: "conv-001", query: "Leave policy question",  createdAt: "2025-08-20T10:30:03Z" },
  { id: "run-004", traceId: "trace-002", agentName: "SUPERVISOR", status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 150, outputTokens: 50,  latencyMs: 75,   cost: 0.0014, userId: "user-001", conversationId: "conv-002", query: "Q4 revenue breakdown",  createdAt: "2025-08-19T14:00:01Z" },
  { id: "run-005", traceId: "trace-002", agentName: "SQL",        status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 200, outputTokens: 180, latencyMs: 480,  cost: 0.0028, userId: "user-001", conversationId: "conv-002", query: "Q4 revenue breakdown",  createdAt: "2025-08-19T14:00:02Z" },
  { id: "run-006", traceId: "trace-002", agentName: "RETRIEVAL",  status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 220, outputTokens: 380, latencyMs: 350,  cost: 0.0042, userId: "user-001", conversationId: "conv-002", query: "Q4 revenue breakdown",  createdAt: "2025-08-19T14:00:03Z" },
  { id: "run-007", traceId: "trace-002", agentName: "REVIEWER",   status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 580, outputTokens: 80,  latencyMs: 160,  cost: 0.0022, userId: "user-001", conversationId: "conv-002", query: "Q4 revenue breakdown",  createdAt: "2025-08-19T14:00:04Z" },
  { id: "run-008", traceId: "trace-003", agentName: "SUPERVISOR", status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 100, outputTokens: 40,  latencyMs: 68,   cost: 0.0010, userId: "user-002", conversationId: "conv-003", query: "VPN requirements",      createdAt: "2025-08-18T09:00:01Z" },
  { id: "run-009", traceId: "trace-003", agentName: "RETRIEVAL",  status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 160, outputTokens: 290, latencyMs: 310,  cost: 0.0032, userId: "user-002", conversationId: "conv-003", query: "VPN requirements",      createdAt: "2025-08-18T09:00:02Z" },
  { id: "run-010", traceId: "trace-004", agentName: "SUPERVISOR", status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 140, outputTokens: 55,  latencyMs: 90,   cost: 0.0013, userId: "user-003", conversationId: "conv-004", query: "API rate limiting",      createdAt: "2025-08-17T16:00:01Z" },
  { id: "run-011", traceId: "trace-004", agentName: "RETRIEVAL",  status: "FAILED",  model: "llama-3.1-8b-instant", inputTokens: 190, outputTokens: 0,   latencyMs: 2100, cost: 0.0008, userId: "user-003", conversationId: "conv-004", query: "API rate limiting", error: "Timeout after 2000ms", createdAt: "2025-08-17T16:00:02Z" },
  { id: "run-012", traceId: "trace-004", agentName: "RETRIEVAL",  status: "SUCCESS", model: "llama-3.1-8b-instant", inputTokens: 190, outputTokens: 350, latencyMs: 420,  cost: 0.0038, userId: "user-003", conversationId: "conv-004", query: "API rate limiting (retry)", createdAt: "2025-08-17T16:00:04Z" },
];

// ─── Evaluations ───
export const mockEvaluations: Evaluation[] = [
  { id: "eval-001", messageId: "msg-002", datasetName: "Enterprise QA v2", question: "What is the annual leave policy?",       expectedAnswer: "20 days per year",     generatedAnswer: "Employees receive 20 annual leave days per calendar year, accruing at 1.67 days/month.", faithfulness: 0.96, answerRelevance: 0.94, contextRecall: 0.92, citationAccuracy: 0.98, overallScore: 0.95, passed: true,  createdAt: "2025-08-20T10:31:00Z" },
  { id: "eval-002", messageId: "msg-004", datasetName: "Enterprise QA v2", question: "How many sick days for new employees?", expectedAnswer: "12 days prorated",     generatedAnswer: "New employees receive the full 12 sick days prorated for the remaining calendar year.", faithfulness: 0.94, answerRelevance: 0.96, contextRecall: 0.90, citationAccuracy: 0.95, overallScore: 0.94, passed: true,  createdAt: "2025-08-20T10:36:00Z" },
  { id: "eval-003", messageId: "msg-006", datasetName: "Enterprise QA v2", question: "What was Q4 2024 revenue?",             expectedAnswer: "$42.8M",               generatedAnswer: "Q4 revenue was $42.8M, representing an 18% year-over-year increase.", faithfulness: 0.98, answerRelevance: 0.97, contextRecall: 0.95, citationAccuracy: 0.99, overallScore: 0.97, passed: true,  createdAt: "2025-08-19T14:01:00Z" },
  { id: "eval-004", datasetName: "Enterprise QA v2", question: "What is the VPN policy for contractors?",  expectedAnswer: "VPN required via SSL",  generatedAnswer: "All remote access requires VPN. Contractors must use SSL-VPN with 2FA.", faithfulness: 0.88, answerRelevance: 0.85, contextRecall: 0.78, citationAccuracy: 0.82, overallScore: 0.83, passed: false, createdAt: "2025-08-18T09:46:00Z" },
  { id: "eval-005", datasetName: "Enterprise QA v2", question: "What is the paternity leave duration?",    expectedAnswer: "4 weeks paid",          generatedAnswer: "Paternity leave is 4 weeks paid, requiring 12-month service.", faithfulness: 0.97, answerRelevance: 0.95, contextRecall: 0.93, citationAccuracy: 0.96, overallScore: 0.95, passed: true,  createdAt: "2025-08-17T12:00:00Z" },
  { id: "eval-006", datasetName: "Enterprise QA v2", question: "API rate limit per tenant?",               expectedAnswer: "1000 req/min",          generatedAnswer: "Rate limit is 1000 requests per minute per tenant with URI versioning.", faithfulness: 0.95, answerRelevance: 0.93, contextRecall: 0.91, citationAccuracy: 0.94, overallScore: 0.93, passed: true,  createdAt: "2025-08-16T15:00:00Z" },
  { id: "eval-007", datasetName: "Enterprise QA v2", question: "What is the EBITDA margin for Q4 2024?",   expectedAnswer: "24.2%",                 generatedAnswer: "EBITDA margin was 24.2%, up 2.1 percentage points year-over-year.", faithfulness: 0.99, answerRelevance: 0.98, contextRecall: 0.96, citationAccuracy: 0.97, overallScore: 0.98, passed: true,  createdAt: "2025-08-15T10:00:00Z" },
  { id: "eval-008", datasetName: "Enterprise QA v2", question: "Employee code of conduct summary?",        expectedAnswer: "Confidentiality rules",  generatedAnswer: "All employees must maintain confidentiality of sensitive data.", faithfulness: 0.91, answerRelevance: 0.88, contextRecall: 0.84, citationAccuracy: 0.90, overallScore: 0.88, passed: true,  createdAt: "2025-08-14T14:00:00Z" },
];

// ─── Traces ───
export const mockTraces: Trace[] = [
  { traceId: "trace-001", query: "What is the annual leave policy?", user: "Rahul Sharma", totalLatencyMs: 1240, totalCost: 0.0066, totalTokens: 965, status: "SUCCESS", steps: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 82, tokens: 165, details: "Query classified as 'document' → routed to Retrieval Agent" }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 340, tokens: 500, details: "Retrieved 4 chunks · Hybrid search · Reranked" }, { agent: "LLM", status: "SUCCESS", latencyMs: 668, tokens: 245, details: "Generated grounded answer · 245 tokens" }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 150, tokens: 55, details: "Faithfulness: 0.96 · No hallucination detected" }], createdAt: "2025-08-20T10:30:00Z" },
  { traceId: "trace-002", query: "Q4 2024 revenue breakdown", user: "Rahul Sharma", totalLatencyMs: 1580, totalCost: 0.0106, totalTokens: 1490, status: "SUCCESS", steps: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 75, tokens: 200, details: "Query classified as 'sql' → routed to SQL + Retrieval" }, { agent: "SQL", status: "SUCCESS", latencyMs: 480, tokens: 380, details: "Generated safe read-only SQL · 48,291 rows" }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 350, tokens: 600, details: "Financial reports section matched" }, { agent: "LLM", status: "SUCCESS", latencyMs: 515, tokens: 230, details: "Generated grounded answer · 230 tokens" }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 160, tokens: 80, details: "Faithfulness: 0.98 · Cross-validated with SQL" }], createdAt: "2025-08-19T14:00:00Z" },
  { traceId: "trace-003", query: "VPN requirements for remote work", user: "Priya Singh", totalLatencyMs: 980, totalCost: 0.0042, totalTokens: 690, status: "SUCCESS", steps: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 68, tokens: 140, details: "Query classified as 'document'" }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 310, tokens: 450, details: "Retrieved 2 chunks from Security + Remote Work" }, { agent: "LLM", status: "SUCCESS", latencyMs: 482, tokens: 180, details: "Generated answer with 2 citations" }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 120, tokens: 40, details: "Faithfulness: 0.94 · All facts verified" }], createdAt: "2025-08-18T09:00:00Z" },
  { traceId: "trace-004", query: "API rate limiting configuration", user: "Amit Kumar", totalLatencyMs: 2690, totalCost: 0.0059, totalTokens: 925, status: "SUCCESS", steps: [{ agent: "SUPERVISOR", status: "SUCCESS", latencyMs: 90, tokens: 195, details: "Query classified as 'document'" }, { agent: "RETRIEVAL", status: "FAILED", latencyMs: 2100, tokens: 190, details: "Timeout after 2000ms — retrying..." }, { agent: "RETRIEVAL", status: "SUCCESS", latencyMs: 420, tokens: 540, details: "Retry successful · 3 chunks from API Architecture" }, { agent: "REVIEWER", status: "SUCCESS", latencyMs: 80, tokens: 35, details: "Faithfulness: 0.92" }], createdAt: "2025-08-17T16:00:00Z" },
];

// ─── Notifications ───
export const mockNotifications: Notification[] = [
  { id: "notif-001", userId: "user-001", title: "Document Indexed",       message: "Employee Handbook 2025 indexed with 482 chunks.",          type: "success", isRead: false, createdAt: "2025-08-20T10:15:00Z" },
  { id: "notif-002", userId: "user-001", title: "RAG Query Completed",    message: "Leave policy answered with 96% faithfulness.",              type: "success", isRead: false, createdAt: "2025-08-20T10:31:00Z" },
  { id: "notif-003", userId: "user-001", title: "Agent Retry Detected",   message: "SQL Agent retried 2x for Q1 sales query.",                  type: "warning", isRead: false, createdAt: "2025-08-20T09:45:00Z" },
  { id: "notif-004", userId: "user-001", title: "New Document Uploaded",  message: "Benefits Guide 2025 is being processed.",                   type: "info",    isRead: true,  createdAt: "2025-08-20T08:30:00Z" },
  { id: "notif-005", userId: "user-001", title: "Ingestion Failed",       message: "Deployment Runbook parse error in section 4.",               type: "error",   isRead: true,  createdAt: "2025-08-19T16:00:00Z" },
  { id: "notif-006", userId: "user-001", title: "Evaluation Complete",    message: "Enterprise QA v2 overall score: 94.2% (7/8 passed).",       type: "success", isRead: true,  createdAt: "2025-08-19T14:30:00Z" },
  { id: "notif-007", userId: "user-001", title: "New User Added",         message: "Ananya Roy (Analyst) has been added.",                       type: "info",    isRead: true,  createdAt: "2025-08-18T15:00:00Z" },
  { id: "notif-008", userId: "user-001", title: "Security Audit Reminder",message: "Quarterly security audit due in 5 days.",                   type: "warning", isRead: true,  createdAt: "2025-08-17T09:00:00Z" },
];

// ─── Evaluation Summary ───
export const mockEvalSummary = {
  datasetName: "Enterprise QA v2", totalQuestions: 120, evaluated: 108,
  faithfulness: 0.94, answerRelevance: 0.93, contextRecall: 0.90,
  citationAccuracy: 0.95, overallScore: 0.93, passRate: 87.5,
};

// ─── Latency Distribution ───
export const mockLatencyDistribution: { range: string; count: number }[] = [
  { range: "0-200ms",  count: 1240 }, { range: "200-500ms", count: 3820 },
  { range: "500-1s",   count: 6450 }, { range: "1-2s",      count: 4890 },
  { range: "2-3s",     count: 1560 }, { range: "3-5s",      count: 420  },
  { range: "5s+",      count: 112  },
];

// ─── Token Usage by Model ───
export const mockTokenUsage: { model: string; tokens: number; cost: number; percentage: number }[] = [
  { model: "llama-3.1-8b-instant",  tokens: 2840000, cost: 42.60, percentage: 58.2 },
  { model: "llama-3.1-70b",         tokens: 1280000, cost: 51.20, percentage: 26.2 },
  { model: "mixtral-8x7b",          tokens: 620000,  cost: 24.80, percentage: 12.7 },
  { model: "gemma-7b",              tokens: 140000,  cost: 9.25,  percentage: 2.9  },
];

// ═══════════════════════════════════════════════════
// NEW LARGE-VOLUME DATA FOR ALL PAGES
// ═══════════════════════════════════════════════════

// ─── 500+ System Logs ───
const logLevels = ["INFO","WARN","ERROR","DEBUG"] as const;
const logSources = ["api-gateway","auth-service","rag-engine","vector-db","llm-proxy","scheduler","ingestion","webhook","billing","monitoring"];
const logMessages: Record<string, string[]> = {
  INFO:  ["Request processed successfully","Document chunk indexed","User session started","Agent run completed","Cache hit for query","Health check passed","Webhook delivered","API key validated","Model response cached","Batch ingestion completed"],
  WARN:  ["Rate limit approaching threshold","High memory usage detected","Slow query detected (>2s)","Deprecated API version used","Certificate expiring in 30 days","Connection pool near capacity","Retry attempt 2 of 3","Token quota 80% utilized","Stale cache entry evicted","Disk usage above 75%"],
  ERROR: ["Connection timeout to vector DB","LLM API returned 503","Document parse failed","Authentication token expired","Out of memory exception","Database connection refused","SSL handshake failed","Queue overflow detected","Webhook delivery failed","Index corruption detected"],
  DEBUG: ["Cache miss for embedding","Query plan generated","Chunk similarity score: 0.89","Agent routing decision logged","Token count: 1,247","Reranker score distribution","Vector search latency: 45ms","Memory allocation: 2.4GB","Thread pool status: 8/16","GC cycle completed in 12ms"],
};
export const mockLogs = Array.from({ length: 500 }, (_, i) => {
  const level = logLevels[i < 300 ? 0 : i < 400 ? 3 : i < 460 ? 1 : i % logLevels.length];
  const source = logSources[i % logSources.length];
  const msgs = logMessages[level];
  return {
    id: `log-${String(i+1).padStart(4,"0")}`, timestamp: new Date(2025, 7, 20, 0, 0, 0, 0).getTime() - i * 60000 * (1 + Math.random()),
    level, source, message: msgs[i % msgs.length], requestId: `req-${Math.random().toString(36).slice(2,10)}`, userId: `user-${String((i % 50)+1).padStart(3,"0")}`,
    metadata: { duration: Math.floor(Math.random() * 2000), statusCode: level === "ERROR" ? 500 : level === "WARN" ? 429 : 200 }
  };
});

// ─── 50 API Keys ───
export const mockApiKeys = Array.from({ length: 50 }, (_, i) => ({
  id: `key-${String(i+1).padStart(3,"0")}`, name: `${["Production","Staging","Development","Testing","CI/CD"][i%5]} Key ${Math.floor(i/5)+1}`,
  prefix: `ent_${Math.random().toString(36).slice(2,6)}`, secret: `sk-ent-${Math.random().toString(36).slice(2,34)}`,
  scopes: [["read","write","admin"],["read","write"],["read"],["read","write","admin","billing"],["read","write"]][i%5],
  status: i < 40 ? "active" : i < 45 ? "revoked" : "expired", createdBy: mockUsers[i % mockUsers.length]?.name || "System",
  createdAt: new Date(2025, i%12, 1+i%28).toISOString(), lastUsed: new Date(2025, 7, 20-i%15).toISOString(),
  requestsToday: Math.floor(Math.random() * 5000), requestsTotal: Math.floor(Math.random() * 500000),
  rateLimit: [1000, 5000, 10000, 500, 2000][i%5],
}));

// ─── Billing / Invoices ───
export const mockInvoices = Array.from({ length: 24 }, (_, i) => ({
  id: `inv-${String(i+1).padStart(3,"0")}`, period: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i%12]} 20${24+Math.floor(i/12)}`,
  amount: +(50 + Math.random() * 200).toFixed(2), status: i < 22 ? "paid" : i === 22 ? "pending" : "overdue",
  tokensUsed: Math.floor(1000000 + Math.random() * 4000000), apiCalls: Math.floor(10000 + Math.random() * 50000),
  paidAt: i < 22 ? new Date(2024+Math.floor(i/12), i%12+1, 5).toISOString() : null,
}));

export const mockBillingPlan = {
  name: "Enterprise Pro", seats: { used: 42, limit: 50 }, storage: { used: 18.4, limit: 50, unit: "GB" },
  tokensMonthly: { used: 3200000, limit: 5000000 }, apiCallsMonthly: { used: 42000, limit: 100000 },
  pricePerMonth: 299, features: ["Unlimited documents","Multi-agent RAG","SOC 2 compliance","Priority support","Custom models","SSO/SAML","Audit logs","API access"],
};

// ─── Models Configuration ───
export const mockModels = [
  { id: "m-001", name: "llama-3.1-8b-instant", provider: "Groq",   status: "active",  maxTokens: 8192,  costPer1k: 0.015, avgLatency: 340,  requests24h: 12400, successRate: 99.2, description: "Fast inference model for RAG queries" },
  { id: "m-002", name: "llama-3.1-70b",        provider: "Groq",   status: "active",  maxTokens: 8192,  costPer1k: 0.040, avgLatency: 890,  requests24h: 4200,  successRate: 98.8, description: "High-quality model for complex reasoning" },
  { id: "m-003", name: "mixtral-8x7b",         provider: "Groq",   status: "active",  maxTokens: 32768, costPer1k: 0.040, avgLatency: 620,  requests24h: 2100,  successRate: 97.5, description: "MoE model for diverse query handling" },
  { id: "m-004", name: "gemma-7b",             provider: "Groq",   status: "testing", maxTokens: 8192,  costPer1k: 0.066, avgLatency: 450,  requests24h: 890,   successRate: 96.1, description: "Google's open model for evaluation" },
  { id: "m-005", name: "gpt-4-turbo",          provider: "OpenAI", status: "inactive",maxTokens: 128000,costPer1k: 0.030, avgLatency: 1200, requests24h: 0,     successRate: 0,    description: "OpenAI flagship (disabled — cost optimization)" },
  { id: "m-006", name: "claude-3.5-sonnet",    provider: "Anthropic",status: "testing",maxTokens: 200000,costPer1k: 0.015, avgLatency: 980,  requests24h: 340,   successRate: 99.1, description: "Anthropic's latest for complex analysis" },
];

// ─── Integrations ───
export const mockIntegrations = [
  { id: "int-001", name: "Slack",       category: "Communication",    status: "connected",    lastSync: "2 mins ago",  icon: "💬", eventsToday: 342,  syncErrors: 0, webhookUrl: "https://hooks.slack.com/..." },
  { id: "int-002", name: "Notion",      category: "Knowledge Base",   status: "connected",    lastSync: "15 mins ago", icon: "📓", eventsToday: 128,  syncErrors: 0, webhookUrl: "https://api.notion.com/..." },
  { id: "int-003", name: "Jira",        category: "Project Mgmt",     status: "disconnected", lastSync: "Never",       icon: "🎫", eventsToday: 0,    syncErrors: 0, webhookUrl: null },
  { id: "int-004", name: "GitHub",      category: "Code Repository",  status: "error",        lastSync: "1 hour ago",  icon: "🐙", eventsToday: 89,   syncErrors: 3, webhookUrl: "https://api.github.com/..." },
  { id: "int-005", name: "Salesforce",  category: "CRM",              status: "disconnected", lastSync: "Never",       icon: "☁️", eventsToday: 0,    syncErrors: 0, webhookUrl: null },
  { id: "int-006", name: "Confluence",  category: "Knowledge Base",   status: "connected",    lastSync: "5 mins ago",  icon: "📄", eventsToday: 256,  syncErrors: 0, webhookUrl: "https://confluence.atlassian.net/..." },
  { id: "int-007", name: "Google Drive",category: "Storage",          status: "connected",    lastSync: "30 mins ago", icon: "📁", eventsToday: 67,   syncErrors: 1, webhookUrl: "https://drive.google.com/..." },
  { id: "int-008", name: "Microsoft Teams",category: "Communication", status: "connected",    lastSync: "1 min ago",   icon: "💼", eventsToday: 198,  syncErrors: 0, webhookUrl: "https://graph.microsoft.com/..." },
  { id: "int-009", name: "Zendesk",     category: "Support",          status: "connected",    lastSync: "10 mins ago", icon: "🎧", eventsToday: 412,  syncErrors: 2, webhookUrl: "https://api.zendesk.com/..." },
  { id: "int-010", name: "HubSpot",     category: "CRM",              status: "testing",      lastSync: "2 hours ago", icon: "🧲", eventsToday: 34,   syncErrors: 0, webhookUrl: "https://api.hubapi.com/..." },
];

// ─── Feedback Data ───
export const mockFeedbackEntries = Array.from({ length: 100 }, (_, i) => ({
  id: `fb-${String(i+1).padStart(3,"0")}`, userId: `user-${String((i%50)+1).padStart(3,"0")}`,
  userName: mockUsers[i % mockUsers.length]?.name || "Anonymous",
  messageId: `msg-${String((i%6)+1).padStart(3,"0")}`, rating: Math.random() > 0.25 ? 1 : -1,
  comment: [
    "Very accurate response, exactly what I needed!","The citation was spot on.","Could have been more detailed.",
    "Incorrect information about the policy dates.","Great multi-agent breakdown!","Response was too slow.",
    "Loved the tabular format!","Missing context from the latest update.","Perfect summary of the document.",
    "The SQL query results were very helpful.","","","","",""
  ][i % 15] || null,
  query: ["Leave policy","Revenue Q4","VPN setup","API limits","Benefits enrollment","Security audit"][i%6],
  createdAt: new Date(2025, 7, 20, 0, 0, 0).getTime() - i * 3600000,
}));

export const mockFeedbackTrends = Array.from({ length: 30 }, (_, i) => ({
  date: `Aug ${i+1}`, thumbsUp: Math.floor(20 + Math.random() * 30), thumbsDown: Math.floor(2 + Math.random() * 8),
}));

// ─── Prompts Library ───
export const mockPrompts = [
  { id: "p-001", name: "System RAG Prompt", description: "Main system prompt for retrieval-augmented generation", version: "2.1", status: "deployed", model: "llama-3.1-8b-instant", deployedAt: "2025-08-15", successRate: 96.4, avgLatency: 1240, usageCount: 18492, template: "You are an enterprise AI assistant. Answer using ONLY the provided context. Cite sources with [DocName, p.X]." },
  { id: "p-002", name: "SQL Agent Prompt", description: "Generates safe read-only SQL queries from natural language", version: "1.8", status: "deployed", model: "llama-3.1-70b", deployedAt: "2025-07-20", successRate: 94.1, avgLatency: 520, usageCount: 4210, template: "Generate a safe, read-only SQL query. Use only SELECT statements. Apply LIMIT 1000. Never use DELETE, UPDATE, or DROP." },
  { id: "p-003", name: "Document Summarizer", description: "Summarizes long documents into key points", version: "3.0", status: "deployed", model: "mixtral-8x7b", deployedAt: "2025-08-01", successRate: 97.2, avgLatency: 780, usageCount: 2890, template: "Summarize the following document in 5 bullet points. Focus on key decisions, metrics, and action items." },
  { id: "p-004", name: "Reviewer Prompt", description: "Reviews AI responses for hallucination and accuracy", version: "1.5", status: "deployed", model: "llama-3.1-8b-instant", deployedAt: "2025-06-15", successRate: 98.6, avgLatency: 190, usageCount: 16200, template: "Review the AI response against source documents. Check for: 1) Hallucination 2) Missing citations 3) Factual accuracy." },
  { id: "p-005", name: "Conversational Search", description: "Handles multi-turn conversational queries", version: "1.0", status: "testing", model: "llama-3.1-70b", deployedAt: null, successRate: 91.8, avgLatency: 1450, usageCount: 456, template: "You are in a multi-turn conversation. Use conversation history to resolve pronouns and references." },
  { id: "p-006", name: "Code Analysis Prompt", description: "Analyzes code snippets and provides explanations", version: "1.2", status: "draft", model: "claude-3.5-sonnet", deployedAt: null, successRate: 0, avgLatency: 0, usageCount: 0, template: "Analyze the following code. Identify bugs, suggest improvements, and explain the logic clearly." },
];

// ─── Memory Entries ───
export const mockMemoryEntries = Array.from({ length: 80 }, (_, i) => ({
  id: `mem-${String(i+1).padStart(3,"0")}`, conversationId: `conv-${String((i%10)+1).padStart(3,"0")}`,
  key: ["user_preferences","context_window","entity_memory","conversation_summary","tool_outputs"][i%5],
  value: ["Prefers tabular format for financial data","Last 5 messages retained for context","Entity: Employee Handbook → doc-001","User asked about leave policy, then benefits","SQL query returned 48,291 rows"][i%5],
  tokenCount: Math.floor(50 + Math.random() * 500), ttlMinutes: [30, 60, 120, 1440, null][i%5] as number | null,
  createdAt: new Date(2025, 7, 20, 0, 0, 0).getTime() - i * 300000,
}));

// ─── Observability Metrics ───
export const mockObservabilityMetrics = {
  uptime: 99.97, p50Latency: 420, p95Latency: 1850, p99Latency: 3200,
  errorRate: 1.8, throughput: 142, activeConnections: 89, queueDepth: 12,
  cpuUsage: 42.5, memoryUsage: 68.2, diskUsage: 34.8, networkIO: 125.4,
};

export const mockHealthChecks = [
  { service: "PostgreSQL", status: "healthy", latency: 12, uptime: 99.99, lastCheck: "10s ago" },
  { service: "Qdrant Vector DB", status: "healthy", latency: 45, uptime: 99.95, lastCheck: "10s ago" },
  { service: "Redis Cache", status: "healthy", latency: 3, uptime: 99.99, lastCheck: "10s ago" },
  { service: "LLM Gateway (Groq)", status: "degraded", latency: 380, uptime: 99.82, lastCheck: "10s ago" },
  { service: "Auth Service", status: "healthy", latency: 8, uptime: 100, lastCheck: "10s ago" },
  { service: "Ingestion Pipeline", status: "healthy", latency: 120, uptime: 99.91, lastCheck: "30s ago" },
  { service: "Webhook Delivery", status: "healthy", latency: 95, uptime: 99.88, lastCheck: "30s ago" },
  { service: "Search Index", status: "healthy", latency: 28, uptime: 99.97, lastCheck: "10s ago" },
];

// ─── Analytics Data ───
export const mockAnalyticsTopQueries = [
  { query: "Annual leave policy", count: 342, avgLatency: 1100, satisfaction: 94 },
  { query: "Q4 2024 revenue", count: 256, avgLatency: 1580, satisfaction: 97 },
  { query: "VPN setup instructions", count: 198, avgLatency: 980, satisfaction: 89 },
  { query: "Employee benefits guide", count: 187, avgLatency: 1050, satisfaction: 92 },
  { query: "Security compliance checklist", count: 156, avgLatency: 1320, satisfaction: 91 },
  { query: "API rate limiting", count: 134, avgLatency: 2690, satisfaction: 85 },
  { query: "Onboarding process", count: 128, avgLatency: 890, satisfaction: 96 },
  { query: "Sales performance Q1", count: 112, avgLatency: 1450, satisfaction: 88 },
  { query: "Data privacy GDPR", count: 98, avgLatency: 1200, satisfaction: 93 },
  { query: "Deployment procedures", count: 87, avgLatency: 1680, satisfaction: 82 },
];

export const mockAnalyticsUserActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2,"0")}:00`, queries: Math.floor(i >= 9 && i <= 18 ? 80 + Math.random() * 120 : 5 + Math.random() * 20),
  users: Math.floor(i >= 9 && i <= 18 ? 20 + Math.random() * 30 : 1 + Math.random() * 5),
}));

export const mockAnalyticsDeptUsage = [
  { department: "Engineering", queries: 4820, cost: 48.20, users: 38 },
  { department: "HR", queries: 3100, cost: 31.00, users: 24 },
  { department: "Sales", queries: 2890, cost: 28.90, users: 29 },
  { department: "Finance", queries: 2340, cost: 23.40, users: 15 },
  { department: "Legal", queries: 1560, cost: 15.60, users: 11 },
  { department: "Marketing", queries: 1890, cost: 18.90, users: 19 },
  { department: "Product", queries: 1240, cost: 12.40, users: 12 },
  { department: "Support", queries: 652, cost: 6.52, users: 8 },
];

// ─── Settings ───
export const mockSettings = {
  profile: { name: "Rahul Sharma", email: "rahul@enterprise.com", role: "ADMIN", avatar: null, timezone: "Asia/Kolkata", language: "en" },
  notifications: { email: true, slack: true, inApp: true, digest: "daily", alertOnError: true, alertOnNewDoc: true },
  security: { mfaEnabled: true, sessionTimeout: 30, ipWhitelist: ["192.168.1.0/24","10.0.0.0/8"], lastPasswordChange: "2025-06-15" },
  api: { defaultModel: "llama-3.1-8b-instant", maxTokens: 4096, temperature: 0.7, topP: 0.9, frequencyPenalty: 0.0 },
  appearance: { theme: "system", compactMode: false, animationsEnabled: true, fontSize: "medium" },
};

// ─── Admin Console Data ───
export const mockAdminTenants = [
  { id: "t-001", name: "Acme Corp", plan: "Enterprise Pro", users: 42, docs: 847, storage: "18.4 GB", status: "active", createdAt: "2024-01-15" },
  { id: "t-002", name: "TechStart Inc", plan: "Business", users: 15, docs: 234, storage: "5.2 GB", status: "active", createdAt: "2024-06-01" },
  { id: "t-003", name: "DataFlow Labs", plan: "Enterprise Pro", users: 68, docs: 1240, storage: "32.1 GB", status: "active", createdAt: "2024-03-20" },
  { id: "t-004", name: "CloudNine Solutions", plan: "Starter", users: 5, docs: 45, storage: "1.1 GB", status: "trial", createdAt: "2025-08-01" },
];

export const mockFeatureFlags = [
  { id: "ff-001", name: "multi_agent_rag", description: "Enable multi-agent RAG pipeline", enabled: true, rollout: 100 },
  { id: "ff-002", name: "sql_agent", description: "Allow SQL query generation agent", enabled: true, rollout: 100 },
  { id: "ff-003", name: "research_agent", description: "Enable research/web search agent", enabled: true, rollout: 75 },
  { id: "ff-004", name: "voice_input", description: "Voice-to-text input in chat", enabled: false, rollout: 0 },
  { id: "ff-005", name: "advanced_analytics", description: "Show advanced analytics dashboard", enabled: true, rollout: 100 },
  { id: "ff-006", name: "custom_models", description: "Allow custom model uploads", enabled: false, rollout: 0 },
  { id: "ff-007", name: "auto_archive", description: "Auto-archive stale documents", enabled: true, rollout: 50 },
  { id: "ff-008", name: "dark_mode", description: "Dark mode UI theme", enabled: true, rollout: 100 },
];

export const mockAuditLog = Array.from({ length: 100 }, (_, i) => ({
  id: `audit-${String(i+1).padStart(4,"0")}`, userId: `user-${String((i%50)+1).padStart(3,"0")}`,
  userName: mockUsers[i%mockUsers.length]?.name || "System", action: ["login","logout","upload_doc","delete_doc","create_api_key","revoke_api_key","update_settings","invite_user","run_evaluation","export_data"][i%10],
  resource: ["auth","documents","api-keys","settings","users","evaluations","billing","integrations","agents","admin"][i%10],
  details: `${["Logged in from","Document uploaded:","API key created:","Settings updated:","User invited:","Evaluation run:","Data exported:","Integration synced:","Agent configured:","Admin action:"][i%10]} ${["Chrome/Win","Report_Q4.pdf","ent_x7k2","theme=dark","ananya@enterprise.com","QA v2","CSV","Slack","SUPERVISOR","tenant-001"][i%10]}`,
  ipAddress: `192.168.${1+i%5}.${100+i%155}`, timestamp: new Date(2025, 7, 20, 0, 0, 0).getTime() - i * 1800000,
}));
