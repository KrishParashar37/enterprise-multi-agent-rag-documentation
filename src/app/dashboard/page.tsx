"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import {
  FileText, MessageSquare, CheckCircle, DollarSign, Zap,
  TrendingUp, Users, Activity, AlertTriangle, CheckCircle2,
  XCircle, Clock, RefreshCw, Download, ChevronRight, Database,
  Eye, EyeOff, Search, Info, X, Bell, Server, Brain
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  type MouseHandlerDataParam
} from "recharts";
import { mockQueryTrend, mockAgentStats, mockLatencyDistribution } from "@/lib/mock-data";
import { formatNumber, formatCost, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

// --- Chart interaction types ---
// Recharts' `MouseHandlerDataParam` does not declare `activePayload`, so extend
// the library's own param type rather than inventing an incompatible one.
type ChartClickData = MouseHandlerDataParam & {
  activePayload?: { payload: Record<string, unknown> }[];
};

// --- 1. Real-time Simulation Hook & Types ---
function useRealTimeSimulation(initialKpis: any) {
  const [kpis, setKpis] = useState(initialKpis);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: 'info'|'warning'|'error'}[]>([]);

  useEffect(() => {
    if (!kpis) return;
    
    // Simulate real-time metric increments
    const kpiInterval = setInterval(() => {
      setKpis((prev: any) => ({
        ...prev,
        totalConversations: prev.totalConversations + Math.floor(Math.random() * 3),
        totalAgentRuns: prev.totalAgentRuns + Math.floor(Math.random() * 5),
        avgLatencyMs: prev.avgLatencyMs + (Math.random() > 0.5 ? 5 : -5)
      }));
    }, 2000);

    // Simulate random system events
    const eventInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const events = [
          { msg: "High latency detected on GPT-4 endpoint", type: "warning" },
          { msg: "New document batch indexed successfully", type: "info" },
          { msg: "SQL Agent failed to parse schema", type: "error" },
          { msg: "User Ananya Roy initiated a complex query", type: "info" }
        ] as const;
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const id = Date.now();
        
        setNotifications(prev => [...prev, { id, ...randomEvent }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
      }
    }, 8000);

    return () => {
      clearInterval(kpiInterval);
      clearInterval(eventInterval);
    };
  }, [initialKpis]);

  return { kpis, notifications, dismissToast: (id: number) => setNotifications(prev => prev.filter(n => n.id !== id)) };
}

// --- 2. Ticker Component ---
const CostTicker = ({ baseCost }: { baseCost: number }) => {
  const [cost, setCost] = useState(baseCost);
  useEffect(() => {
    const id = setInterval(() => setCost(c => c + 0.01), 1500);
    return () => clearInterval(id);
  }, []);
  return <span>{formatCost(cost)}</span>;
};

// --- Mock Data Extensions ---
const AGENT_COLORS = ["#2d6a4f", "#40916c", "#0d9488", "#059669", "#52b788"];
const initialActivity = [
  { id: 1, type: "success", message: "Employee Handbook 2025 — indexed (482 chunks)", time: "2m ago" },
  { id: 2, type: "success", message: "RAG query completed — leave policy question", time: "5m ago" },
  { id: 3, type: "warning", message: "SQL Agent retry — Q1 sales query retried 2x", time: "15m ago" },
  { id: 4, type: "success", message: "New document uploaded — Benefits Guide 2025", time: "32m ago" },
  { id: 5, type: "error", message: "Ingestion failed — Deployment Runbook parse error", time: "1h ago" },
];
const activityDot: Record<string, string> = {
  success: "bg-emerald-500", warning: "bg-amber-500", error: "bg-red-500", info: "bg-cyan-500"
};

export default function DashboardPage() {
  // Setup Theme Syncing
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartTextColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(45,106,79,0.1)";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";

  // State
  const [kpisRaw, setKpisRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Layout Customization State
  type DashLayout = { showCharts: boolean; showAgents: boolean; showInfra: boolean };
  const DEFAULT_LAYOUT: DashLayout = { showCharts: true, showAgents: true, showInfra: true };
  const [layout, setLayout] = useState<DashLayout>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dash_layout");
      if (saved) {
        try {
          return { ...DEFAULT_LAYOUT, ...(JSON.parse(saved) as Partial<DashLayout>) };
        } catch {
          // Corrupt localStorage — fall through to defaults.
        }
      }
    }
    return DEFAULT_LAYOUT;
  });

  useEffect(() => {
    localStorage.setItem("dash_layout", JSON.stringify(layout));
  }, [layout]);

  // Date Range Filtering
  const [dateRange, setDateRange] = useState("30d");
  const filteredQueryTrend = useMemo(() => {
    let limit = mockQueryTrend.length;
    if (dateRange === "7d") limit = 7;
    if (dateRange === "30d") limit = 30;
    if (dateRange === "3m") limit = 90;
    return mockQueryTrend.slice(-limit);
  }, [dateRange]);

  // Activity Feed Filtering
  const [activitySearch, setActivitySearch] = useState("");
  const filteredActivity = initialActivity.filter(a =>
    a.message.toLowerCase().includes(activitySearch.toLowerCase()) ||
    a.type.toLowerCase().includes(activitySearch.toLowerCase())
  );

  // Interactive Drill-down Modal
  const [drillDown, setDrillDown] = useState<any>(null);

  // Fetch initial data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setKpisRaw(data.kpis);
      setLastRefresh(new Date());
    } catch {
      // fallback handled by API route
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Attach Real-time Hooks
  const { kpis, notifications, dismissToast } = useRealTimeSimulation(kpisRaw);

  // CSV Export
  const handleExportCSV = () => {
    if (!kpis) return;
    const headers = ["Metric", "Value", "Timestamp"];
    const rows = [
      ["Total Documents", kpis.totalDocuments, new Date().toISOString()],
      ["AI Conversations", kpis.totalConversations, new Date().toISOString()],
      ["Agent Runs", kpis.totalAgentRuns, new Date().toISOString()],
      ["Total AI Cost", kpis.totalCost, new Date().toISOString()],
    ];
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpiCards = kpis ? [
    { label: "Total Documents", value: formatNumber(kpis.totalDocuments), icon: FileText, color: "text-green-600", bg: "kpi-blue" },
    { label: "AI Conversations", value: formatNumber(kpis.totalConversations), icon: MessageSquare, color: "text-teal-600", bg: "kpi-sky" },
    { label: "Agent Runs", value: formatNumber(kpis.totalAgentRuns), icon: CheckCircle, color: "text-emerald-600", bg: "kpi-emerald" },
    { label: "Total AI Cost", isTicker: true, value: kpis.totalCost, icon: DollarSign, color: "text-amber-600", bg: "kpi-amber" },
    { label: "Avg Latency", value: `${((kpis.avgLatencyMs || 0) / 1000).toFixed(2)}s`, icon: Zap, color: "text-cyan-600", bg: "kpi-teal" },
    { label: "Active Users", value: formatNumber(kpis.totalUsers), icon: Users, color: "text-rose-600", bg: "kpi-rose" },
  ] : [];

  return (
    <MainLayout title="Executive Dashboard" subtitle="Real-time platform intelligence">
      <div className="p-6 space-y-6 animate-fade-in relative">

        {/* Toast Notifications Overlay */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map(toast => (
            <div key={toast.id} className={cn("pointer-events-auto flex items-center justify-between gap-4 px-4 py-3 rounded-lg shadow-lg border text-sm text-white max-w-sm animate-in slide-in-from-right",
              toast.type === 'error' ? 'bg-rose-600 border-rose-500' :
              toast.type === 'warning' ? 'bg-amber-500 border-amber-400' :
              'bg-slate-800 border-slate-700'
            )}>
              <div className="flex items-center gap-2">
                {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : toast.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                <p>{toast.msg}</p>
              </div>
              <button onClick={() => dismissToast(toast.id)} className="hover:opacity-70"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>

        {/* Drill-down Modal */}
        {drillDown && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daily Details: {drillDown.date}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setDrillDown(null)}><X className="w-4 h-4"/></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-500">Total Queries</p>
                    <p className="text-2xl font-bold">{formatNumber(drillDown.queries)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-500">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCost(drillDown.cost)}</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setDrillDown(null)}>Close</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header Actions */}
        <div className="rounded-2xl p-6 relative overflow-hidden aurora-bg border border-emerald-500/20">
          <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Live Simulation Active</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Executive Overview</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                {["7d", "30d", "3m", "12m"].map((r) => (
                  <button key={r} onClick={() => setDateRange(r)}
                    className={cn("px-3 py-1.5 transition-colors", dateRange === r ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800")}>{r}</button>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
              </Button>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs ml-2">
                <button onClick={() => setLayout(l => ({...l, showInfra: !l.showInfra}))} className={cn("px-2 py-1.5", layout.showInfra ? "bg-slate-100 dark:bg-slate-800" : "")} title="Toggle Infra Status"><Server className="w-3.5 h-3.5"/></button>
                <button onClick={() => setLayout(l => ({...l, showCharts: !l.showCharts}))} className={cn("px-2 py-1.5", layout.showCharts ? "bg-slate-100 dark:bg-slate-800" : "")} title="Toggle Charts"><Activity className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Infra Status Map (Feature 1) */}
        {layout.showInfra && (
          <Card className="animate-in fade-in slide-in-from-top-4 overflow-hidden border-emerald-500/20" premium>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" /> Live Infrastructure Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[200px] w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#10b981" stopOpacity="0.8">
                        <animate attributeName="offset" values="0;1" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  
                  {/* Gateway to others */}
                  <path d="M 50% 30% L 30% 70%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
                  <path d="M 50% 30% L 50% 70%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
                  <path d="M 50% 30% L 70% 70%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
                </svg>

                {/* Nodes */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] z-10">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-300">API Gateway</span>
                  <Badge variant="outline" className="text-[9px] h-4 mt-0.5 bg-white dark:bg-black">12ms</Badge>
                </div>

                <div className="absolute top-[70%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-300">PostgreSQL</span>
                  <Badge variant="outline" className="text-[9px] h-4 mt-0.5 bg-white dark:bg-black">
                    {kpis?.avgLatencyMs ? Math.max(2, Math.floor(kpis.avgLatencyMs / 50)) : 14}ms
                  </Badge>
                </div>

                <div className="absolute top-[70%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-300">Qdrant Vector</span>
                  <Badge variant="outline" className="text-[9px] h-4 mt-0.5 bg-white dark:bg-black">45ms</Badge>
                </div>

                <div className="absolute top-[70%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] z-10">
                    <Brain className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-300">LLM Gateway</span>
                  <Badge variant="outline" className="text-[9px] h-4 mt-0.5 bg-white dark:bg-black border-amber-500/50 text-amber-600">380ms</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4"><div className="h-14 bg-slate-100 animate-pulse rounded" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className={cn("relative overflow-hidden p-5 border transition-all hover:-translate-y-1", card.bg)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", card.bg)}>
                      <Icon className={cn("w-4 h-4", card.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-slate-800">
                    {card.isTicker ? <CostTicker baseCost={card.value as number} /> : card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{card.label}</p>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        {layout.showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
            <Card className="lg:col-span-2 overflow-hidden" premium>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Query Volume & Cost Trend</CardTitle>
                    <p className="text-[10px] text-slate-500 mt-1">Click any data point to drill down</p>
                  </div>
                  <Badge variant="info">Last {dateRange}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={filteredQueryTrend} onClick={(data: ChartClickData) => {
                    if (data?.activePayload?.[0]?.payload) setDrillDown(data.activePayload[0].payload);
                  }}>
                    <defs>
                      <linearGradient id="qg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{stroke: 'rgba(45,106,79,0.2)', strokeWidth: 2, strokeDasharray: '4 4'}} contentStyle={{ background: tooltipBg, border: "1px solid rgba(45,106,79,0.2)", borderRadius: "10px", color: isDark ? "#fff" : "#1e293b", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="queries" stroke="#2d6a4f" fill="url(#qg)" strokeWidth={2} name="Queries" activeDot={{r: 6, cursor: 'pointer'}} />
                    <Area type="monotone" dataKey="cost" stroke="#059669" fill="url(#cg)" strokeWidth={2} name="Cost ($)" activeDot={{r: 6, cursor: 'pointer'}} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="overflow-hidden" premium>
              <CardHeader><CardTitle>Document Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={[
                        { name: "Indexed", value: kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.85) : 6, color: "#10b981" },
                        { name: "Processing", value: kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.1) : 1, color: "#f59e0b" },
                        { name: "Failed", value: kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.05) : 1, color: "#ef4444" },
                      ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                        {["#10b981", "#f59e0b", "#ef4444"].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ background: tooltipBg, border: "1px solid rgba(45,106,79,0.2)", borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {[["Indexed", "#10b981"], ["Processing", "#f59e0b"], ["Failed", "#ef4444"]].map(([name, color]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{name}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {name === "Indexed" ? formatNumber(kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.85) : 6) :
                          name === "Processing" ? formatNumber(kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.1) : 1) :
                            formatNumber(kpis?.totalDocuments ? Math.floor(kpis.totalDocuments * 0.05) : 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agents & Activity Section */}
        {layout.showAgents && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Agent Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAgentStats.map((agent, i) => (
                    <div key={agent.name} className="flex items-center gap-4">
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{agent.name}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">{formatNumber(agent.runs)} runs</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{agent.success}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${agent.success}%`, background: AGENT_COLORS[i] }} />
                        </div>
                      </div>
                      <span className="w-14 text-right text-xs text-slate-500 shrink-0">{agent.avgLatency}ms</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex justify-between items-center">
                  Live Activity
                  <Badge variant="outline" className="text-[10px] animate-pulse">Streaming</Badge>
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    placeholder="Filter events..." 
                    className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-900 border-none"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 flex-1 overflow-y-auto max-h-[300px]">
                <div className="space-y-3">
                  {filteredActivity.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No events match filter</p>
                  ) : (
                    filteredActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", activityDot[item.type])} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{item.message}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{item.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
