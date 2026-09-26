"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCost, formatLatency, formatNumber, timeAgo } from "@/lib/utils";
import { mockTraces, mockKPIs, mockAgentStats } from "@/lib/mock-data";
import {
  Activity, Clock, DollarSign, Zap, ChevronDown, ChevronRight,
  Bot, Search, Database, Globe, CheckCircle2, AlertCircle, Filter,
  RefreshCw, Download, X, Eye, Copy, Loader2, Play, Pause,
  BarChart2, TrendingUp, TrendingDown, Bell, BellOff, Settings2,
  Hash, User, ChevronUp
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ── Agent color/icon maps ────────────────────────────────────────────────────
const agentIconMap: Record<string, React.ElementType> = {
  SUPERVISOR: Bot, RETRIEVAL: Search, SQL: Database,
  RESEARCH: Globe, REVIEWER: CheckCircle2, LLM: Zap,
};
const agentColorMap: Record<string, string> = {
  SUPERVISOR: "#2d6a4f", RETRIEVAL: "#40916c", SQL: "#2d6a4f",
  RESEARCH: "#10b981", REVIEWER: "#f59e0b", LLM: "#ec4899",
};

// ── Real-time trace generator ─────────────────────────────────────────────────
let _traceCounter = 100;
function generateTrace() {
  _traceCounter++;
  const queries = [
    "What is the maternity leave policy?",
    "Generate Q4 financial summary",
    "List security compliance requirements",
    "Summarize the DevOps handbook",
    "Find all pending leave requests",
    "What are the API rate limits?",
  ];
  const users = ["Rahul Sharma","Priya Singh","Amit Kumar","Sarah Chen","David Lee"];
  const q     = queries[Math.floor(Math.random() * queries.length)];
  const u     = users[Math.floor(Math.random() * users.length)];
  const ok    = Math.random() > 0.12;
  const latency = Math.floor(800 + Math.random() * 2000);
  const tokens  = Math.floor(500 + Math.random() * 2000);
  return {
    traceId:       `trace-${String(_traceCounter).padStart(3,"0")}`,
    query:         q,
    user:          u,
    status:        ok ? "SUCCESS" : "FAILED",
    totalLatencyMs: latency,
    totalTokens:   tokens,
    totalCost:     parseFloat((tokens * 0.000005).toFixed(4)),
    createdAt:     new Date().toISOString(),
    steps: [
      { agent: "SUPERVISOR", latencyMs: Math.floor(latency * 0.1), tokens: 0,  status: "SUCCESS", details: "Routing query to appropriate agent" },
      { agent: "RETRIEVAL",  latencyMs: Math.floor(latency * 0.4), tokens: 0,  status: "SUCCESS", details: "Retrieved 5 relevant chunks from vector store" },
      { agent: "LLM",        latencyMs: Math.floor(latency * 0.45),tokens: tokens, status: ok ? "SUCCESS" : "FAILED", details: ok ? "Generated answer with citations" : "Context length exceeded — truncated" },
      { agent: "REVIEWER",   latencyMs: Math.floor(latency * 0.05),tokens: 0,  status: "SUCCESS", details: "Faithfulness check: passed" },
    ],
  };
}

// ── TraceRow ─────────────────────────────────────────────────────────────────
function TraceRow({ trace, onCopy }: { trace: ReturnType<typeof generateTrace> & { traceId: string }; onCopy: (t: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-slate-700/30 hover:bg-green-800/10 transition-colors">
      <button className="w-full flex items-center gap-3 px-5 py-3 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="w-4 shrink-0 text-slate-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-green-400">{trace.traceId}</span>
            <Badge variant={trace.status === "SUCCESS" ? "success" : "error"} className="text-[10px] py-0">{trace.status}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{trace.query}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
          <span className="hidden sm:block">{trace.user.split(" ")[0]}</span>
          <span><Clock className="w-3 h-3 inline" /> {formatLatency(trace.totalLatencyMs)}</span>
          <span><Zap className="w-3 h-3 inline" /> {formatNumber(trace.totalTokens)}</span>
          <span><DollarSign className="w-3 h-3 inline" /> {formatCost(trace.totalCost)}</span>
          <span className="hidden sm:block text-[10px] text-slate-600">{timeAgo(trace.createdAt)}</span>
          {/* Feature 7: Copy trace */}
          <button onClick={(e) => { e.stopPropagation(); onCopy(trace); }}
            className="p-1 hover:text-slate-300 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 animate-fade-in">
          <div className="ml-4 pl-4 border-l border-slate-700/50 space-y-3">
            {/* Timeline bar */}
            <div className="flex items-center gap-0 h-3 rounded-lg overflow-hidden mb-3">
              {trace.steps.map((step, i) => {
                const w = `${(step.latencyMs / trace.totalLatencyMs) * 100}%`;
                const c = agentColorMap[step.agent] || "#6366f1";
                return (
                  <div key={i} className="h-full first:rounded-l-md last:rounded-r-md" style={{ width: w, background: c, minWidth: "4px" }}
                    title={`${step.agent}: ${step.latencyMs}ms`} />
                );
              })}
            </div>
            {/* Steps */}
            {trace.steps.map((step, i) => {
              const Icon = agentIconMap[step.agent] || Bot;
              const c    = agentColorMap[step.agent] || "#6366f1";
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-lg border border-slate-700/30">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${c}25` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-300">{step.agent}</span>
                      <Badge variant={step.status === "SUCCESS" ? "success" : "error"} className="text-[10px] py-0">{step.status}</Badge>
                      <span className="text-[10px] text-slate-500">{step.latencyMs}ms</span>
                      {step.tokens > 0 && <span className="text-[10px] text-slate-500">{step.tokens} tkns</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.details}</p>
                  </div>
                  <div className="w-20 shrink-0">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(step.latencyMs/trace.totalLatencyMs)*100}%`, background: c }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3 text-[10px] text-slate-600 pt-1">
              <span>Total: {formatLatency(trace.totalLatencyMs)}</span>
              <span>·</span><span>Tokens: {formatNumber(trace.totalTokens)}</span>
              <span>·</span><span>Cost: {formatCost(trace.totalCost)}</span>
              <span>·</span><span>{trace.steps.length} agents</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ObservabilityPage() {
  // Feature 1: Live traces state
  const [traces,       setTraces]       = useState(() => [...mockTraces.slice(0, 6)] as any[]);
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");

  // Feature 2: Real-time KPIs
  const [kpis,         setKpis]         = useState({
    requests:  mockKPIs.totalConversations || 0,
    tokens:    28400000,
    cost:      mockKPIs.totalCost     || 127.85,
    latency:   mockKPIs.avgLatencyMs  || 0,
    errorRate: 0,
  });

  // Feature 3: Live polling toggle
  const [liveMode,     setLiveMode]     = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState(Date.now());
  const [rtPulse,      setRtPulse]      = useState(false);
  const [newTraceFlash,setNewTraceFlash]= useState(false);

  // Feature 4: Auto-inject real-time traces
  const liveRef = useRef(liveMode);
  useEffect(() => { liveRef.current = liveMode; }, [liveMode]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!liveRef.current) return;
      const t = generateTrace() as any;
      setTraces((prev) => [t, ...prev.slice(0, 49)]);
      setKpis((prev) => ({
        requests:  prev.requests + 1,
        tokens:    prev.tokens + t.totalTokens,
        cost:      parseFloat((prev.cost + t.totalCost).toFixed(4)),
        latency:   Math.floor((prev.latency * 0.9) + (t.totalLatencyMs * 0.1)),
        errorRate: parseFloat(((t.status === "FAILED" ? prev.errorRate * 0.95 + 5 : prev.errorRate * 0.95)).toFixed(2)),
      }));
      setLastUpdate(Date.now());
      setRtPulse(true);     setTimeout(() => setRtPulse(false), 600);
      setNewTraceFlash(true); setTimeout(() => setNewTraceFlash(false), 1200);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Feature 5: Time-series chart data (live)
  const [chartData,    setChartData]    = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      time:     `${i * 5}m`,
      requests: Math.floor(Math.random() * 30 + 5),
      tokens:   Math.floor(Math.random() * 5000 + 500),
      errors:   Math.floor(Math.random() * 3),
      latency:  Math.floor(Math.random() * 800 + 400),
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (!liveRef.current) return;
      setChartData((prev) => {
        const newPt = {
          time:     "now",
          requests: Math.floor(Math.random() * 30 + 5),
          tokens:   Math.floor(Math.random() * 5000 + 500),
          errors:   Math.floor(Math.random() * 3),
          latency:  Math.floor(Math.random() * 800 + 400),
        };
        return [...prev.slice(1), newPt];
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Feature 6: Alerts
  const [alerts,       setAlerts]       = useState([
    { id: "a-1", type: "warning", message: "High latency detected on RETRIEVAL agent (>2s)", time: "2m ago", dismissed: false },
    { id: "a-2", type: "error",   message: "SQL Agent failure rate spiked to 8% in last 5m", time: "5m ago", dismissed: false },
  ]);
  const [alertsOn,     setAlertsOn]     = useState(true);

  // Feature 7: Copy trace
  const [copied,       setCopied]       = useState(false);
  const handleCopy = (trace: any) => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  // Feature 8: Sort
  const [sortBy,       setSortBy]       = useState<"time"|"latency"|"cost"|"tokens">("time");

  // Feature 9: Agent metric sort
  const [agentSort,    setAgentSort]    = useState<"runs"|"success"|"latency">("runs");

  // Feature 10: Export traces
  const handleExport = () => {
    const rows = [
      ["TraceID","Query","User","Status","Latency(ms)","Tokens","Cost","Time"],
      ...traces.map((t) => [t.traceId, t.query, t.user, t.status, t.totalLatencyMs, t.totalTokens, t.totalCost, t.createdAt]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "traces.csv"; a.click();
  };

  // Feature 11: Date range filter (simulated)
  const [dateRange,    setDateRange]    = useState("24h");

  // Filter + sort traces
  const filteredTraces = [...traces]
    .filter((t) => {
      const matchFilter = filter === "All" || t.status === filter;
      const matchSearch = !search || t.query.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase()) || t.traceId.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "latency") return b.totalLatencyMs - a.totalLatencyMs;
      if (sortBy === "cost")    return b.totalCost - a.totalCost;
      if (sortBy === "tokens")  return b.totalTokens - a.totalTokens;
      return 0; // time = already sorted newest first
    });

  const sortedAgents = [...mockAgentStats].sort((a, b) => {
    if (agentSort === "success") return b.success - a.success;
    if (agentSort === "latency") return a.avgLatency - b.avgLatency;
    return b.runs - a.runs;
  });

  // Feature 12: Error trend data
  const errorTrend = chartData.map((d) => ({ time: d.time, errors: d.errors, latency: d.latency }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout title="LLM Observability" subtitle="Trace every request, agent, token, and cost in real time">
      <div className="p-6 space-y-5 animate-fade-in">

        {/* Feature 3+10: Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={liveMode ? "default" : "outline"} onClick={() => setLiveMode(!liveMode)}>
              {liveMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {liveMode ? "Pause Live" : "Resume Live"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
            <Button size="sm" variant={alertsOn ? "default" : "outline"} onClick={() => setAlertsOn(!alertsOn)}>
              {alertsOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />} Alerts
            </Button>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
              className="text-xs border border-slate-600 rounded-lg px-2.5 py-1.5 bg-slate-800 text-slate-300 focus:outline-none">
              {["1h","6h","24h","7d","30d"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {copied && <span className="text-green-400">Copied!</span>}
            {rtPulse && <span className="text-green-400 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Live</span>}
            {liveMode && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            <span>Updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Feature 6: Alerts banner */}
        {alertsOn && alerts.filter((a) => !a.dismissed).length > 0 && (
          <div className="space-y-2">
            {alerts.filter((a) => !a.dismissed).map((alert) => (
              <div key={alert.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border animate-fade-in text-sm",
                alert.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300")}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{alert.message}</span>
                <span className="text-[11px] opacity-70">{alert.time}</span>
                <button onClick={() => setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, dismissed: true } : a))}>
                  <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Feature 2: Live KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "LLM Requests",  value: formatNumber(kpis.requests),            icon: Activity,     color: "text-green-400",  bg: "bg-green-500/10"  },
            { label: "Total Tokens",  value: `${(kpis.tokens/1000000).toFixed(1)}M`, icon: Zap,          color: "text-green-400",  bg: "bg-green-500/10"  },
            { label: "Total Cost",    value: `$${kpis.cost.toFixed(2)}`,             icon: DollarSign,   color: "text-amber-400",  bg: "bg-amber-500/10"  },
            { label: "Avg Latency",   value: `${(kpis.latency/1000).toFixed(2)}s`,   icon: Clock,        color: "text-blue-400",   bg: "bg-blue-500/10"   },
            { label: "Error Rate",    value: `${kpis.errorRate.toFixed(1)}%`,        icon: AlertCircle,  color: "text-red-400",    bg: "bg-red-500/10"    },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-4 relative overflow-hidden">
              {rtPulse && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />}
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <p className="text-xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Feature 5: Live charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Request Volume — Live</CardTitle>
                {liveMode && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:"8px",fontSize:"11px"}} />
                  <Area type="monotone" dataKey="requests" stroke="#2d6a4f" fill="url(#reqGrad)" strokeWidth={2} name="Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Latency & Errors — Live</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:"8px",fontSize:"11px"}} />
                  <Line yAxisId="l" type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} name="Latency (ms)" />
                  <Line yAxisId="r" type="monotone" dataKey="errors"  stroke="#ef4444" strokeWidth={2} dot={false} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Feature 1: Trace Explorer with search + filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Trace Explorer</CardTitle>
                {newTraceFlash && (
                  <span className="text-[11px] text-green-400 animate-pulse flex items-center gap-1">
                    <Activity className="w-3 h-3" /> New trace
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Feature 11: Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search traces..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 w-40" />
                </div>
                {/* Feature 8: Sort */}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-300 focus:outline-none">
                  <option value="time">Time</option>
                  <option value="latency">Latency</option>
                  <option value="cost">Cost</option>
                  <option value="tokens">Tokens</option>
                </select>
                {/* Filter */}
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                  {["All","SUCCESS","FAILED"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={cn("px-3 py-1.5 transition-colors", filter === f ? "bg-green-600 text-white" : "text-slate-500 hover:text-green-300 bg-slate-800")}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Column headers */}
          <div className="px-5 py-2 border-b border-slate-700/50 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <div className="w-4 shrink-0" />
              <div className="flex-1">Trace / Query</div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="hidden sm:block w-20">User</span>
                <span className="w-16">Duration</span>
                <span className="w-14">Tokens</span>
                <span className="w-14">Cost</span>
                <span className="hidden sm:block w-14">Time</span>
                <span className="w-6" />
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTraces.length > 0
              ? filteredTraces.map((trace) => <TraceRow key={trace.traceId} trace={trace} onCopy={handleCopy} />)
              : <div className="py-10 text-center text-slate-500 text-sm">No traces match your filter</div>}
          </div>

          {/* Feature 13: Live trace counter */}
          <div className="px-5 py-2 border-t border-slate-700/30 flex items-center justify-between text-[11px] text-slate-600">
            <span>Showing {filteredTraces.length} / {traces.length} traces</span>
            {liveMode && <span className="text-green-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live — new traces auto-appear</span>}
          </div>
        </Card>

        {/* Feature 14+15: Agent-level metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Agent-Level Metrics</CardTitle>
              {/* Feature 9: Agent sort */}
              <div className="flex gap-1 text-[11px]">
                {["runs","success","latency"].map((s) => (
                  <button key={s} onClick={() => setAgentSort(s as any)}
                    className={cn("px-2 py-1 rounded capitalize transition-all", agentSort === s ? "bg-green-600 text-white" : "text-slate-500 hover:text-slate-300")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedAgents.map((agent) => {
                const Icon = agentIconMap[agent.name] || Bot;
                const color = agentColorMap[agent.name] || "#2d6a4f";
                return (
                  <div key={agent.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">{agent.name}</span>
                        <span className="text-slate-500">{formatNumber(agent.runs)} runs · {agent.success}% success · {agent.avgLatency}ms avg</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${agent.success}%`, background: color }} />
                      </div>
                    </div>
                    {/* Feature 16: Trend indicator */}
                    <div className="shrink-0">
                      {agent.success > 95
                        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                        : agent.success < 85
                          ? <TrendingDown className="w-4 h-4 text-red-400" />
                          : <Activity className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature 17: Token cost breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Request Latency Distribution (Live Samples)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={(v)=>`${v}ms`} />
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:"8px",fontSize:"11px"}} formatter={(v:any)=>[`${v}ms`,"Latency"]} />
                <Bar dataKey="latency" fill="#2d6a4f" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
