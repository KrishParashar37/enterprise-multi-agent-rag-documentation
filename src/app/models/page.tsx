"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import {
  Cpu, Zap, DollarSign, Activity, CheckCircle2, Settings2,
  MoreHorizontal, Plus, X, RefreshCw, Search, Loader2,
  TrendingUp, TrendingDown, AlertTriangle, Clock, Database,
  ChevronDown, ChevronUp, Save, Trash2, BarChart2, Star
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ModelConfig = {
  id: string; provider: string; status: "active"|"inactive"|"testing"|"deprecated";
  latencyMs: number; costPer1M: number; contextWindow: number;
  maxTokens: number; temperature: number; topP: number;
  requests7d: number; tokens7d: number; cost7d: number; errorRate: number;
  p50LatencyMs: number; p99LatencyMs: number; tags: string[]; addedAt: string;
};

const STATUS_CFG = {
  active:     { color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", label: "Active"     },
  inactive:   { color: "text-slate-500 bg-slate-50 border-slate-200",       dot: "bg-slate-400",   label: "Disabled"   },
  testing:    { color: "text-amber-600 bg-amber-50 border-amber-200",        dot: "bg-amber-400",   label: "Testing"    },
  deprecated: { color: "text-red-500 bg-red-50 border-red-200",             dot: "bg-red-400",     label: "Deprecated" },
};

const PROVIDER_COLORS: Record<string,string> = {
  OpenAI: "#10b981", Anthropic: "#8b5cf6", Google: "#3b82f6", Meta: "#f59e0b", Mistral: "#ec4899", Custom: "#64748b",
};

export default function ModelsPage() {
  const [models,      setModels]      = useState<ModelConfig[]>([]);
  const [usageData,   setUsageData]   = useState<any[]>([]);
  const [stats,       setStats]       = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [lastFetch,   setLastFetch]   = useState(Date.now());
  const [rtPulse,     setRtPulse]     = useState(false);

  // Feature 1: Selected model detail
  const [selected,    setSelected]    = useState<ModelConfig | null>(null);
  const [showDetail,  setShowDetail]  = useState(false);

  // Feature 2: Search
  const [search,      setSearch]      = useState("");

  // Feature 3: Status filter
  const [statusFilter,setStatusFilter]= useState("All");

  // Feature 4: Add model modal
  const [showAdd,     setShowAdd]     = useState(false);
  const [addId,       setAddId]       = useState("");
  const [addProvider, setAddProvider] = useState("OpenAI");
  const [addCost,     setAddCost]     = useState("");
  const [addContext,  setAddContext]  = useState("");
  const [adding,      setAdding]      = useState(false);

  // Feature 5: Edit mode (per-model config)
  const [editModel,   setEditModel]   = useState<ModelConfig | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Feature 6: Compare mode
  const [compareIds,  setCompareIds]  = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Feature 7: Sort
  const [sortBy,      setSortBy]      = useState<"latency"|"cost"|"requests"|"errorRate">("requests");

  // Feature 8: Kebab menu open
  const [menuOpen,    setMenuOpen]    = useState<string | null>(null);

  // Feature 9: Starred models
  const [starred,     setStarred]     = useState<Set<string>>(new Set());

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchModels = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await fetch("/api/models");
      const data = await res.json();
      setModels(data.models || []);
      setUsageData(data.usageData || []);
      setStats(data.stats || null);
      setLastFetch(Date.now());
      if (silent) { setRtPulse(true); setTimeout(() => setRtPulse(false), 800); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  // Feature 10: Real-time polling every 10s
  useEffect(() => {
    const id = setInterval(() => fetchModels(true), 10000);
    return () => clearInterval(id);
  }, [fetchModels]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = [...models]
    .filter((m) => {
      const matchSearch = !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.includes(search.toLowerCase()));
      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "latency")   return a.latencyMs - b.latencyMs;
      if (sortBy === "cost")      return a.costPer1M - b.costPer1M;
      if (sortBy === "requests")  return b.requests7d - a.requests7d;
      if (sortBy === "errorRate") return a.errorRate - b.errorRate;
      return 0;
    });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStatusToggle = async (id: string, newStatus: string) => {
    await fetch("/api/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus as ModelConfig["status"] } : m));
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/models?id=${id}`, { method: "DELETE" });
    setModels((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setShowDetail(false);
    setMenuOpen(null);
  };

  const handleAddModel = async () => {
    if (!addId.trim()) return;
    setAdding(true);
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: addId.trim(), provider: addProvider, costPer1M: parseFloat(addCost) || 1.0, contextWindow: parseInt(addContext) || 8192 }),
    });
    const data = await res.json();
    setModels((prev) => [...prev, data.model]);
    setAdding(false); setShowAdd(false); setAddId(""); setAddCost(""); setAddContext("");
  };

  const handleSaveConfig = async () => {
    if (!editModel) return;
    setSaving(true);
    const res = await fetch("/api/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editModel.id, temperature: editModel.temperature, topP: editModel.topP, maxTokens: editModel.maxTokens }),
    });
    const data = await res.json();
    setModels((prev) => prev.map((m) => m.id === editModel.id ? data.model : m));
    setSaving(false); setEditing(false);
  };

  const compareModels = models.filter((m) => compareIds.includes(m.id));

  // ── Radar data for selected model ──────────────────────────────────────────
  const radarData = selected ? [
    { metric: "Speed",       value: Math.max(0, 100 - selected.latencyMs / 10)       },
    { metric: "Reliability", value: Math.max(0, 100 - selected.errorRate * 10)        },
    { metric: "Cost Eff.",   value: Math.max(0, 100 - selected.costPer1M * 5)         },
    { metric: "Context",     value: Math.min(100, selected.contextWindow / 10000)      },
    { metric: "Usage",       value: Math.min(100, selected.requests7d / 200)           },
  ] : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <MainLayout title="Models & LLM Configuration" subtitle="Configure language models, track usage and costs in real time">
      <div className="p-6 space-y-5 animate-fade-in">

        {/* Feature 10: Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Model</Button>
            <Button variant="outline" onClick={() => fetchModels()}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
            {compareIds.length === 2 && (
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-600" onClick={() => setShowCompare(true)}>
                <BarChart2 className="w-3.5 h-3.5" /> Compare Models
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {rtPulse && <span className="text-green-500 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Live</span>}
            <span>Updated: {new Date(lastFetch).toLocaleTimeString()}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Feature 11: KPI stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Models",  value: stats.activeCount,                     icon: Cpu,          color: "text-emerald-600" },
              { label: "Tokens (7d)",    value: (stats.totalTokens/1000000).toFixed(1)+"M", icon: Zap,     color: "text-blue-600"    },
              { label: "Cost (7d)",      value: `$${stats.totalCost}`,                 icon: DollarSign,   color: "text-amber-600"   },
              { label: "Avg Latency",    value: `${stats.avgLatencyMs}ms`,             icon: Clock,        color: "text-purple-600"  },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="p-4 relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color.replace("text-","bg-").replace("-600","-50"))}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  {rtPulse && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                </div>
                <p className={cn("text-2xl font-bold text-slate-800")}>{value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Feature 12: Usage chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Token Usage by Model (7 Days) — Live</CardTitle>
              <div className="flex gap-3 text-[11px]">
                {[["gpt4","#10b981"],["claude","#8b5cf6"],["gemini","#3b82f6"],["llama","#f59e0b"]].map(([key,color]) => (
                  <span key={key} className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{background:color as string}}/>{key}</span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={usageData}>
                <defs>
                  {[["gpt4","#10b981"],["claude","#8b5cf6"],["gemini","#3b82f6"],["llama","#f59e0b"]].map(([k,c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c as string} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={c as string} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:11}} tickFormatter={(v)=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",fontSize:"11px"}} formatter={(v:any)=>[`${(v/1000).toFixed(0)}k tokens`]} />
                {[["gpt4","#10b981"],["claude","#8b5cf6"],["gemini","#3b82f6"],["llama","#f59e0b"]].map(([k,c]) => (
                  <Area key={k} type="monotone" dataKey={k} stroke={c as string} fill={`url(#grad-${k})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature 2+3+7: Search + filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models, providers, tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-green-100 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-700" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          {["All","active","testing","inactive","deprecated"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all",
                statusFilter === s ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
              {s}
            </button>
          ))}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none">
            <option value="requests">Sort: Usage</option>
            <option value="latency">Sort: Latency</option>
            <option value="cost">Sort: Cost</option>
            <option value="errorRate">Sort: Reliability</option>
          </select>
        </div>

        {/* Feature 6: Compare panel */}
        {showCompare && compareModels.length === 2 && (
          <Card className="p-4 border-blue-200 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-blue-700 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Model Comparison</p>
              <button onClick={() => { setShowCompare(false); setCompareIds([]); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-left">
                    <th className="pb-2 font-medium">Metric</th>
                    {compareModels.map((m) => <th key={m.id} className="pb-2 font-semibold text-slate-700">{m.id}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Latency",       (m: ModelConfig) => `${m.latencyMs}ms`],
                    ["Cost/1M tokens",(m: ModelConfig) => `$${m.costPer1M}`],
                    ["Context Window",(m: ModelConfig) => `${(m.contextWindow/1000).toFixed(0)}k`],
                    ["Error Rate",    (m: ModelConfig) => `${m.errorRate}%`],
                    ["7d Requests",   (m: ModelConfig) => m.requests7d.toLocaleString()],
                    ["7d Cost",       (m: ModelConfig) => `$${m.cost7d}`],
                    ["P99 Latency",   (m: ModelConfig) => `${m.p99LatencyMs}ms`],
                  ].map(([label, fn]) => (
                    <tr key={label as string} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-500">{label as string}</td>
                      {compareModels.map((m) => <td key={m.id} className="py-2 font-medium text-slate-700">{(fn as Function)(m)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Feature 13: Model Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Roster ({filtered.length})</p>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
            ) : filtered.map((model) => {
              const sc   = STATUS_CFG[model.status] || STATUS_CFG.inactive;
              const isSelected = selected?.id === model.id;
              const isCompare  = compareIds.includes(model.id);
              const isStar     = starred.has(model.id);
              return (
                <Card key={model.id}
                  className={cn("p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-[1px]",
                    isSelected && "border-green-400 shadow-md",
                    isCompare  && "border-blue-400"
                  )}
                  onClick={() => { setSelected(model); setEditModel({ ...model }); setShowDetail(true); }}>
                  <div className="flex items-center gap-3">
                    {/* Provider color dot */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: PROVIDER_COLORS[model.provider] || "#64748b" }}>
                      {model.provider[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{model.id}</p>
                        <span className="text-[10px] text-slate-500">{model.provider}</span>
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium", sc.color)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span><Clock className="w-3 h-3 inline" /> {model.latencyMs}ms</span>
                        <span><DollarSign className="w-3 h-3 inline" /> ${model.costPer1M}/1M</span>
                        <span><Database className="w-3 h-3 inline" /> {(model.contextWindow/1000).toFixed(0)}k ctx</span>
                        <span className={cn(model.errorRate > 1 ? "text-red-400" : "text-slate-400")}>
                          <AlertTriangle className="w-3 h-3 inline" /> {model.errorRate}% err
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Feature 9: Star */}
                      <button onClick={() => setStarred((p) => { const n = new Set(p); n.has(model.id) ? n.delete(model.id) : n.add(model.id); return n; })}
                        className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Star className={cn("w-3.5 h-3.5", isStar ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                      </button>
                      {/* Feature 6: Compare toggle */}
                      <button onClick={() => setCompareIds((prev) => prev.includes(model.id) ? prev.filter((x) => x !== model.id) : prev.length < 2 ? [...prev, model.id] : [prev[1], model.id])}
                        className={cn("p-1.5 rounded-lg text-[10px] font-bold transition-colors", isCompare ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:bg-slate-100")}>
                        A/B
                      </button>
                      {/* Feature 8: Kebab menu */}
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === model.id ? null : model.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                        {menuOpen === model.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-20 animate-fade-in">
                            {model.status !== "active"   && <button onClick={() => handleStatusToggle(model.id, "active")}   className="w-full px-4 py-2.5 text-left text-xs text-emerald-600 hover:bg-emerald-50">✓ Set Active</button>}
                            {model.status !== "testing"  && <button onClick={() => handleStatusToggle(model.id, "testing")}  className="w-full px-4 py-2.5 text-left text-xs text-amber-600 hover:bg-amber-50">🧪 Set Testing</button>}
                            {model.status !== "inactive" && <button onClick={() => handleStatusToggle(model.id, "inactive")} className="w-full px-4 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-50">⊘ Disable</button>}
                            <div className="border-t border-slate-100" />
                            <button onClick={() => handleDelete(model.id)} className="w-full px-4 py-2.5 text-left text-xs text-red-500 hover:bg-red-50">
                              <Trash2 className="w-3 h-3 inline mr-1" /> Remove Model
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feature 14: Usage mini-bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (model.requests7d / 15000) * 100)}%`, background: PROVIDER_COLORS[model.provider] || "#64748b" }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{model.requests7d.toLocaleString()} req/7d</span>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400">
                <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No models found</p>
              </div>
            )}
          </div>

          {/* Feature 1+5: Detail + Config panel */}
          <div className="space-y-4">
            {showDetail && selected && editModel ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Details</p>
                  <button onClick={() => setShowDetail(false)}><X className="w-4 h-4 text-slate-400" /></button>
                </div>

                {/* Feature 15: Radar chart */}
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">{selected.id} — Score Profile</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{fill:"#64748b",fontSize:9}} />
                      <Radar dataKey="value" stroke={PROVIDER_COLORS[selected.provider] || "#059669"} fill={PROVIDER_COLORS[selected.provider] || "#059669"} fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Feature 5: Config editor */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Configuration</p>
                    {editing ? (
                      <div className="flex gap-1">
                        <button onClick={handleSaveConfig} className="text-[11px] text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button onClick={() => { setEditing(false); setEditModel({ ...selected }); }} className="text-[11px] text-slate-400">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditing(true)} className="text-[11px] text-blue-500 hover:text-blue-700">Edit</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Temperature", key: "temperature" as keyof ModelConfig, min: 0, max: 2,    step: 0.1 },
                      { label: "Top P",        key: "topP"        as keyof ModelConfig, min: 0, max: 1,    step: 0.05 },
                      { label: "Max Tokens",   key: "maxTokens"   as keyof ModelConfig, min: 256, max: 8192, step: 256 },
                    ].map(({ label, key, min, max, step }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-slate-500">{label}</label>
                          <span className="text-[11px] font-semibold text-slate-700">{editModel[key]}</span>
                        </div>
                        <input type="range" min={min} max={max} step={step}
                          value={editModel[key] as number}
                          disabled={!editing}
                          onChange={(e) => setEditModel({ ...editModel, [key]: parseFloat(e.target.value) })}
                          className="w-full accent-green-600 disabled:opacity-50" />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Feature 16: Key metrics */}
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 7-Day Metrics</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Requests",     value: selected.requests7d.toLocaleString() },
                      { label: "Tokens",       value: `${(selected.tokens7d/1000).toFixed(0)}k`   },
                      { label: "Cost",         value: `$${selected.cost7d}`                        },
                      { label: "P50 Latency",  value: `${selected.p50LatencyMs}ms`                 },
                      { label: "P99 Latency",  value: `${selected.p99LatencyMs}ms`                 },
                      { label: "Error Rate",   value: `${selected.errorRate}%`                     },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Feature 17: Tags */}
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-[11px] text-green-700">{tag}</span>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Cpu className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm text-center">Click a model to view details and configuration</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature 18: Cost breakdown chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Model (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={models.map((m) => ({ name: m.id.split("-")[0], cost: m.cost7d, color: PROVIDER_COLORS[m.provider] }))} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v}`} />
                <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",fontSize:"11px"}} formatter={(v:any)=>[`$${v}`,"Cost"]} />
                <Bar dataKey="cost" fill="#059669" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature 4: Add Model Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-800 flex items-center gap-2"><Plus className="w-4 h-4 text-green-600" /> Add New Model</p>
                <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Model ID *</label>
                  <input value={addId} onChange={(e) => setAddId(e.target.value)} placeholder="e.g. gpt-4-turbo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Provider</label>
                  <div className="flex gap-2 flex-wrap">
                    {["OpenAI","Anthropic","Google","Meta","Mistral","Custom"].map((p) => (
                      <button key={p} onClick={() => setAddProvider(p)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all",
                          addProvider === p ? "text-white border-transparent" : "text-slate-600 border-slate-200 hover:border-green-300")}
                        style={addProvider === p ? { background: PROVIDER_COLORS[p] || "#059669" } : {}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Cost per 1M tokens ($)</label>
                    <input type="number" value={addCost} onChange={(e) => setAddCost(e.target.value)} placeholder="e.g. 2.50"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Context Window</label>
                    <input type="number" value={addContext} onChange={(e) => setAddContext(e.target.value)} placeholder="e.g. 128000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddModel} disabled={adding || !addId.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Model
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close menu on outside click */}
        {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
      </div>
    </MainLayout>
  );
}
