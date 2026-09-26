"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, formatLatency, formatCost } from "@/lib/utils";
import { mockAgentStats, mockAgentRuns } from "@/lib/mock-data";
import {
  Bot, Search, Database, Globe, CheckCircle2, Activity,
  Zap, AlertTriangle, Clock, Play, Square, RefreshCw,
  TrendingUp, TrendingDown, Circle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const agentDetails = [
  { name: "SUPERVISOR", title: "Supervisor Agent", icon: Bot, model: "gpt-oss-120b", color: "#2d6a4f", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", tools: ["query_classifier", "agent_router", "context_manager"], capabilities: ["Query classification", "Agent routing", "Result aggregation", "Retry management"], description: "Orchestrates the multi-agent workflow. Analyzes queries and routes to specialized agents." },
  { name: "RETRIEVAL", title: "Retrieval Agent", icon: Search, model: "text-embedding-3-small", color: "#2d6a4f", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", tools: ["vector_search", "keyword_search", "reranker", "chunk_fetcher"], capabilities: ["Semantic search", "Keyword search", "Hybrid fusion", "Cross-encoder reranking"], description: "Performs hybrid semantic + keyword search across the vector database." },
  { name: "SQL", title: "SQL Agent", icon: Database, model: "gpt-oss-120b", color: "#0d9488", bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400", tools: ["sql_generator", "sql_validator", "query_executor", "result_formatter"], capabilities: ["Text-to-SQL", "Query validation", "Read-only enforcement", "Row limit protection"], description: "Converts natural language to safe read-only SQL queries." },
  { name: "RESEARCH", title: "Research Agent", icon: Globe, model: "gpt-oss-120b", color: "#059669", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", tools: ["web_search", "knowledge_base", "source_validator"], capabilities: ["External research", "Source validation", "Knowledge synthesis", "Citation extraction"], description: "Gathers information from approved external and internal knowledge sources." },
  { name: "REVIEWER", title: "Reviewer Agent", icon: CheckCircle2, model: "gpt-oss-120b", color: "#d97706", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", tools: ["faithfulness_checker", "citation_verifier", "hallucination_detector"], capabilities: ["Faithfulness check", "Hallucination detection", "Citation verification", "Completeness"], description: "Validates answers for faithfulness, hallucination, and citation accuracy." },
];

const runStatusConfig = {
  SUCCESS: { variant: "success" as const, dot: "bg-emerald-500" },
  FAILED: { variant: "error" as const, dot: "bg-red-500" },
  RUNNING: { variant: "info" as const, dot: "bg-green-500 animate-pulse" },
  RETRYING: { variant: "warning" as const, dot: "bg-amber-500" },
};

// Live latency sparkline data
function genSparkline() {
  return Array.from({ length: 8 }, (_, i) => ({ t: i, v: 150 + Math.random() * 600 }));
}

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState("All");
  const [isLive, setIsLive] = useState(true);
  // Live stats simulation
  const [liveStats, setLiveStats] = useState(mockAgentStats.map((a) => ({ ...a, sparkline: genSparkline() })));
  const [runs, setRuns] = useState(mockAgentRuns);

  // Fetch real data from backend
  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (data.runs?.length) setRuns(data.runs);
      })
      .catch(() => { });
  }, []);

  // Simulate live stat updates
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setLiveStats((prev) => prev.map((a) => ({
        ...a,
        runs: a.runs + Math.floor(Math.random() * 3),
        avgLatency: Math.max(80, a.avgLatency + (Math.random() - 0.5) * 20),
        sparkline: [...a.sparkline.slice(1), { t: Date.now(), v: 150 + Math.random() * 600 }],
      })));
    }, 3000);
    return () => clearInterval(id);
  }, [isLive]);

  const selectedAgent = agentDetails.find((a) => a.name === selected);
  const selectedStats = liveStats.find((a) => a.name === selected);

  const filteredRuns = agentFilter === "All" ? runs : runs.filter((r) => r.agentName === agentFilter);

  return (
    <MainLayout title="Agent Control Center" subtitle="Monitor and manage your multi-agent AI system">
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Header controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer",
              isLive ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-slate-500 dark:text-slate-400 border-slate-700"
            )} onClick={() => setIsLive(!isLive)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-50 dark:bg-slate-800")} />
              {isLive ? "Live" : "Paused"}
            </div>
          </div>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
            {["All", ...agentDetails.map((a) => a.name)].map((f) => (
              <button key={f} onClick={() => setAgentFilter(f)}
                className={cn("px-3 py-1.5 transition-colors",
                  agentFilter === f ? "bg-green-600 text-white dark:bg-slate-900" : "text-slate-500 dark:text-slate-400 bg-slate-800 hover:text-slate-300")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {liveStats.map((agent) => {
            const detail = agentDetails.find((d) => d.name === agent.name);
            const Icon = detail?.icon || Bot;
            const isSelected = selected === agent.name;
            return (
              <Card key={agent.name} hover
                onClick={() => setSelected(isSelected ? null : agent.name)}
                className={cn("p-4 transition-all", isSelected && "border-green-500/40")}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", detail?.bg)}>
                    <Icon className={cn("w-4 h-4", detail?.text)} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400">Active</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-300 mb-2">{agent.name}</p>
                <div className="space-y-1 mb-3">
                  {[
                    { label: "Runs", value: formatNumber(agent.runs) },
                    { label: "Success", value: `${agent.success}%`, cls: "text-emerald-400" },
                    { label: "Latency", value: `${Math.round(agent.avgLatency)}ms` },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className={cn("text-slate-300", cls)}>{value}</span>
                    </div>
                  ))}
                </div>
                {/* Mini sparkline */}
                <ResponsiveContainer width="100%" height={28}>
                  <LineChart data={agent.sparkline}>
                    <Line type="monotone" dataKey="v" stroke={detail?.color} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedAgent && selectedStats && (
          <Card className="animate-fade-in" premium>
            <CardHeader>
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", selectedAgent.bg, selectedAgent.border)}>
                  <selectedAgent.icon className={cn("w-5 h-5", selectedAgent.text)} />
                </div>
                <div>
                  <CardTitle className="text-base">{selectedAgent.title}</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Model: <span className="text-green-400">{selectedAgent.model}</span></p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-xs text-slate-600 dark:text-slate-400">v2.1.0</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedAgent.description}</p>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.capabilities.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Tools</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.tools.map((t) => (
                        <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg text-slate-400"
                          style={{ background: "rgba(13,20,39,0.8)", border: "1px solid rgba(45,106,79,0.2)" }}>
                          <Zap className="w-2.5 h-2.5 text-green-400" />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Total Runs", value: formatNumber(selectedStats.runs), icon: Activity },
                    { label: "Success Rate", value: `${selectedStats.success}%`, icon: CheckCircle2 },
                    { label: "Avg Latency", value: `${Math.round(selectedStats.avgLatency)}ms`, icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(13,20,39,0.6)", border: "1px solid rgba(45,106,79,0.12)" }}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs text-slate-400">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{value}</span>
                    </div>
                  ))}
                  {/* Latency chart */}
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Latency Trend</p>
                    <ResponsiveContainer width="100%" height={60}>
                      <LineChart data={selectedStats.sparkline}>
                        <Line type="monotone" dataKey="v" stroke={selectedAgent.color} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Runs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Agent Runs</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="info">{filteredRuns.length} runs</Badge>
                <Button size="sm" variant="ghost" onClick={() => fetch("/api/agents").then(r => r.json()).then(d => { if (d.runs?.length) setRuns(d.runs); })}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-700/30">
            {filteredRuns.slice(0, 15).map((run) => {
              const statusCfg = runStatusConfig[run.status as keyof typeof runStatusConfig] || runStatusConfig.SUCCESS;
              const agent = agentDetails.find((a) => a.name === run.agentName);
              const Icon = agent?.icon || Bot;
              return (
                <div key={run.id} className="px-6 py-3 hover:bg-slate-800/30 transition-colors table-row-hover">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", agent?.bg || "bg-slate-800")}>
                      <Icon className={cn("w-3.5 h-3.5", agent?.text || "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-300">{run.agentName}</span>
                        <span className="text-[10px] text-slate-600 font-mono">#{String(run.traceId).slice(-8)}</span>
                        <Badge variant={statusCfg.variant} className="text-[10px] py-0">{run.status}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{run.query}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      {run.model && <span className="text-slate-600 hidden lg:block">{run.model}</span>}
                      <span className="text-slate-400">{formatLatency(run.latencyMs)}</span>
                      <span className="text-slate-600">{(run.inputTokens || 0) + (run.outputTokens || 0)} tok</span>
                      <span className="text-slate-400">{formatCost(run.cost)}</span>
                      {run.error && (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{run.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
