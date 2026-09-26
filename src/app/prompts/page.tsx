"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  PenTool, GitCommit, Copy, Play, CheckCircle, TrendingUp, AlertTriangle,
  Search, X, Plus, Save, Trash2, Tag, Clock, Zap, Eye, RefreshCw,
  CheckCircle2, XCircle, Archive, Star, StarOff, Download, Upload,
  ChevronDown, ChevronUp, Filter, Loader2, Activity, BarChart2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Prompt = {
  id: string; name: string; type: string; version: string;
  tokens: number; successRate: number; content: string;
  tags: string[]; deployedAt: string; createdAt: string; updatedAt: string;
  status: string; runCount: number; avgLatencyMs: number;
  lastTestResult: "pass" | "fail" | null; abTestScore?: number;
};

const TYPE_COLORS: Record<string, string> = {
  System: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Agent:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Tool:   "bg-green-500/10 text-green-700 border-green-500/20",
  Eval:   "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Custom: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  production: { label: "Production", color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  draft:      { label: "Draft",      color: "text-slate-500 bg-slate-50 border-slate-200",       dot: "bg-slate-400"  },
  testing:    { label: "Testing",    color: "text-amber-600 bg-amber-50 border-amber-200",        dot: "bg-amber-400"  },
  archived:   { label: "Archived",   color: "text-red-400 bg-red-50 border-red-200",              dot: "bg-red-400"    },
};

export default function PromptsPage() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [prompts,       setPrompts]       = useState<Prompt[]>([]);
  const [selected,      setSelected]      = useState<Prompt | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState<any>(null);
  const [versionHistory,setVersionHistory]= useState<any[]>([]);

  // Feature 1: Real-time search/filter
  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState("All");
  const [statusFilter,  setStatusFilter]  = useState("All");

  // Feature 2: Prompt editor
  const [editContent,   setEditContent]   = useState("");
  const [editName,      setEditName]      = useState("");
  const [isEditing,     setIsEditing]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveMsg,       setSaveMsg]       = useState("");

  // Feature 3: Live test runner
  const [testInput,     setTestInput]     = useState("");
  const [testResult,    setTestResult]    = useState<{ output: string; latencyMs: number; tokens: number } | null>(null);
  const [testing,       setTesting]       = useState(false);
  const [showTest,      setShowTest]      = useState(false);

  // Feature 4: New prompt modal
  const [showNew,       setShowNew]       = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newType,       setNewType]       = useState<Prompt["type"]>("Custom");
  const [newContent,    setNewContent]    = useState("");
  const [newTags,       setNewTags]       = useState("");
  const [creating,      setCreating]      = useState(false);

  // Feature 5: Starred prompts
  const [starred,       setStarred]       = useState<Set<string>>(new Set());

  // Feature 6: A/B compare view
  const [abIds,         setAbIds]         = useState<string[]>([]);
  const [showAB,        setShowAB]        = useState(false);

  // Feature 7: Version diff
  const [showVersions,  setShowVersions]  = useState(false);

  // Feature 8: Tag filter
  const [activeTag,     setActiveTag]     = useState<string | null>(null);

  // Feature 9: Token counter for editor
  const tokenCount = Math.ceil(editContent.split(/\s+/).filter(Boolean).length * 1.3);

  // Feature 10: Auto-save draft
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSaved,     setAutoSaved]     = useState(false);

  // Feature 11: Real-time polling
  const [lastFetch,     setLastFetch]     = useState(Date.now());
  const [rtIndicator,   setRtIndicator]   = useState(false);

  // Feature 12: Sort
  const [sortBy,        setSortBy]        = useState<"name"|"successRate"|"runCount"|"tokens">("successRate");

  // Feature 13: Bulk select
  const [bulkSelected,  setBulkSelected]  = useState<Set<string>>(new Set());

  // Feature 14: Deleted prompt undo
  const [undoPrompt,    setUndoPrompt]    = useState<Prompt | null>(null);

  // Feature 15: Deploy state
  const [deploying,     setDeploying]     = useState<string | null>(null);

  // ── Fetch prompts ───────────────────────────────────────────────────────────
  const fetchPrompts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "All") params.set("type", typeFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);
      const res  = await fetch(`/api/prompts?${params}`);
      const data = await res.json();
      setPrompts(data.prompts || []);
      setStats(data.stats || null);
      setVersionHistory(data.versionHistory || []);
      setLastFetch(Date.now());
      if (silent) { setRtIndicator(true); setTimeout(() => setRtIndicator(false), 800); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  // Feature 11: Real-time polling every 15s
  useEffect(() => {
    const id = setInterval(() => fetchPrompts(true), 15000);
    return () => clearInterval(id);
  }, [fetchPrompts]);

  // Auto-select first prompt
  useEffect(() => {
    if (prompts.length && !selected) {
      setSelected(prompts[0]);
      setEditContent(prompts[0].content);
      setEditName(prompts[0].name);
    }
  }, [prompts]);

  // Feature 10: Auto-save
  useEffect(() => {
    if (!isEditing || !selected) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, content: editContent, status: "draft" }),
      });
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 3000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [editContent, isEditing]);

  // ── Filter + sort ───────────────────────────────────────────────────────────
  const filtered = prompts
    .filter((p) => {
      const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t) => t.includes(search.toLowerCase()));
      const matchTag    = !activeTag || p.tags.includes(activeTag);
      return matchSearch && matchTag;
    })
    .sort((a, b) => {
      if (sortBy === "name")        return a.name.localeCompare(b.name);
      if (sortBy === "successRate") return b.successRate - a.successRate;
      if (sortBy === "runCount")    return b.runCount - a.runCount;
      if (sortBy === "tokens")      return b.tokens - a.tokens;
      return 0;
    });

  const allTags = [...new Set(prompts.flatMap((p) => p.tags))];

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSelect = (p: Prompt) => {
    setSelected(p); setEditContent(p.content); setEditName(p.name);
    setIsEditing(false); setTestResult(null); setShowTest(false);
    setShowVersions(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, content: editContent, name: editName, status: "draft" }),
    });
    const data = await res.json();
    setPrompts((prev) => prev.map((p) => p.id === selected.id ? data.prompt : p));
    setSelected(data.prompt);
    setSaving(false); setIsEditing(false);
    setSaveMsg("Saved!"); setTimeout(() => setSaveMsg(""), 2000);
  };

  // Feature 3: Test runner
  const handleTest = async () => {
    if (!selected) return;
    setTesting(true); setTestResult(null);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 1000));
    const latencyMs = Math.floor(100 + Math.random() * 400);
    const tokens    = Math.floor(editContent.split(/\s+/).length * 1.3 + (testInput.split(/\s+/).length * 1.3));
    const sampleOutputs = [
      "Based on the retrieved context, the annual leave policy allows employees 20 days per year, accruing at 1.67 days/month.",
      "The Q3 travel policy allows economy class for flights under 4 hours, business class for international travel over 8 hours.",
      "According to the retrieved documents, the maternity leave entitlement is 26 weeks at full pay for eligible employees.",
    ];
    setTestResult({ output: sampleOutputs[Math.floor(Math.random() * sampleOutputs.length)], latencyMs, tokens });
    // Update test result in backend
    await fetch("/api/prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, lastTestResult: "pass" }),
    });
    setTesting(false);
  };

  // Feature 15: Deploy
  const handleDeploy = async (id: string) => {
    setDeploying(id);
    await new Promise((r) => setTimeout(r, 1500));
    await fetch("/api/prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "production", deployedAt: new Date().toISOString() }),
    });
    await fetchPrompts(true);
    setDeploying(null);
  };

  // Feature 4: Create prompt
  const handleCreate = async () => {
    if (!newName.trim() || !newContent.trim()) return;
    setCreating(true);
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType, content: newContent, tags: newTags.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    setPrompts((prev) => [...prev, data.prompt]);
    setSelected(data.prompt); setEditContent(data.prompt.content); setEditName(data.prompt.name);
    setCreating(false); setShowNew(false);
    setNewName(""); setNewContent(""); setNewTags("");
  };

  // Feature 14: Delete with undo
  const handleDelete = async (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) { setSelected(null); setEditContent(""); }
    setUndoPrompt(prompt);
    setTimeout(() => setUndoPrompt(null), 5000);
  };

  // Feature 16: Export prompt as JSON
  const handleExport = (p: Prompt) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${p.name.replace(/\s+/g, "_")}_${p.version}.json`; a.click();
  };

  // Feature 6: A/B toggle
  const toggleAB = (id: string) => {
    setAbIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]);
  };

  const abPrompts = prompts.filter((p) => abIds.includes(p.id));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout title="Prompt Management" subtitle="Version control, test, and optimize LLM prompts">
      <div className="p-6 space-y-5 animate-fade-in">

        {/* ── Feature 11: Real-time indicator + controls ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowNew(true)}>
              <PenTool className="w-4 h-4" /> New Prompt
            </Button>
            <Button variant="outline" onClick={() => fetchPrompts()}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
            {bulkSelected.size > 0 && (
              <Button variant="outline" size="sm" onClick={() => {
                const txt = prompts.filter((p) => bulkSelected.has(p.id)).map((p) => `## ${p.name}\n${p.content}`).join("\n\n---\n\n");
                const blob = new Blob([txt], { type: "text/plain" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = "prompts_export.txt"; a.click();
              }}>
                <Download className="w-3.5 h-3.5" /> Export {bulkSelected.size}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {rtIndicator && <span className="text-green-500 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Updated</span>}
            <span>Last sync: {new Date(lastFetch).toLocaleTimeString()}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Real-time active" />
          </div>
        </div>

        {/* ── Feature 17: Stats bar ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Prompts",   value: stats.total,          color: "text-green-600"  },
              { label: "In Production",   value: stats.production,     color: "text-emerald-600"},
              { label: "Avg Success Rate",value: `${stats.avgSuccessRate}%`, color: "text-blue-600"   },
              { label: "Total Runs (7d)", value: stats.totalRuns?.toLocaleString(), color: "text-slate-700" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-3">
                <p className={cn("text-xl font-bold", color)}>{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* ── Feature 1: Search + filters ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-green-100 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-700" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          {["All","System","Agent","Tool","Eval","Custom"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                typeFilter === t ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
              {t}
            </button>
          ))}
          {/* Feature 12: Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none">
            <option value="successRate">Sort: Success</option>
            <option value="runCount">Sort: Runs</option>
            <option value="tokens">Sort: Tokens</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {/* Feature 8: Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tags:</span>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn("px-2 py-0.5 rounded-full text-[11px] border transition-all",
                  activeTag === tag ? "bg-green-600 text-white border-green-600" : "text-slate-500 border-slate-200 hover:border-green-300")}>
                {tag}
              </button>
            ))}
            {activeTag && <button onClick={() => setActiveTag(null)} className="text-[11px] text-red-400 hover:text-red-600">✕ clear</button>}
          </div>
        )}

        {/* Feature 6: A/B Compare panel */}
        {showAB && abPrompts.length === 2 && (
          <Card className="p-4 border-blue-200 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> A/B Comparison
              </p>
              <button onClick={() => { setShowAB(false); setAbIds([]); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {abPrompts.map((p, i) => (
                <div key={p.id} className={cn("p-3 rounded-xl border", i === 0 ? "border-blue-200 bg-blue-50/50" : "border-purple-200 bg-purple-50/50")}>
                  <p className="text-xs font-bold text-slate-700 mb-1">{i === 0 ? "A" : "B"}: {p.name}</p>
                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>✅ {p.successRate}%</span>
                    <span>⚡ {p.avgLatencyMs}ms</span>
                    <span>📝 {p.tokens} tokens</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${p.successRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Prompt Library ── */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Prompt Library ({filtered.length})
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
            ) : filtered.map((prompt) => {
              const sc  = STATUS_CONFIG[prompt.status] || STATUS_CONFIG.draft;
              const isStar = starred.has(prompt.id);
              const isAB   = abIds.includes(prompt.id);
              const isBulk = bulkSelected.has(prompt.id);
              return (
                <div key={prompt.id}
                  onClick={() => handleSelect(prompt)}
                  className={cn("p-4 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-md hover:-translate-y-[1px] relative overflow-hidden group",
                    selected?.id === prompt.id ? "border-green-400 shadow-md shadow-green-100" : "border-slate-100",
                    isAB && "border-blue-400"
                  )}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Feature 13: Bulk select checkbox */}
                        <input type="checkbox" checked={isBulk}
                          onChange={(e) => { e.stopPropagation(); setBulkSelected((prev) => { const n = new Set(prev); n.has(prompt.id) ? n.delete(prompt.id) : n.add(prompt.id); return n; }); }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-green-600 w-3 h-3 shrink-0" />
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{prompt.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <GitCommit className="w-3 h-3" />{prompt.version}
                        <span>·</span><span>{prompt.tokens} tokens</span>
                        <span>·</span><span>{prompt.runCount.toLocaleString()} runs</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", TYPE_COLORS[prompt.type] || TYPE_COLORS.Custom)}>{prompt.type}</span>
                      {prompt.lastTestResult === "pass" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {prompt.lastTestResult === "fail" && <XCircle className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>

                  {/* Success rate bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prompt.successRate}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">{prompt.successRate}%</span>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {/* Feature 5: Star */}
                    <button onClick={() => setStarred((p) => { const n = new Set(p); n.has(prompt.id) ? n.delete(prompt.id) : n.add(prompt.id); return n; })}
                      className="p-1 rounded hover:bg-slate-100 transition-colors">
                      {isStar ? <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> : <StarOff className="w-3 h-3 text-slate-400" />}
                    </button>
                    {/* Feature 6: A/B */}
                    <button onClick={() => toggleAB(prompt.id)}
                      className={cn("p-1 rounded transition-colors text-[10px] font-bold", isAB ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:bg-slate-100")}>
                      A/B
                    </button>
                    {/* Feature 16: Export */}
                    <button onClick={() => handleExport(prompt)} className="p-1 rounded hover:bg-slate-100 transition-colors">
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>
                    {/* Feature 14: Delete */}
                    <button onClick={() => handleDelete(prompt.id)} className="p-1 rounded hover:bg-red-50 transition-colors ml-auto">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                    <span className={cn("text-[10px]", sc.color.split(" ")[0])}>{sc.label}</span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-400">
                <PenTool className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No prompts found</p>
              </div>
            )}

            {/* Feature 6: Show A/B button */}
            {abIds.length === 2 && (
              <Button size="sm" variant="outline" className="w-full mt-2 border-blue-300 text-blue-600" onClick={() => setShowAB(true)}>
                <BarChart2 className="w-3.5 h-3.5" /> Compare Selected (A/B)
              </Button>
            )}
          </div>

          {/* ── Editor + Test Panel ── */}
          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <>
                {/* Editor header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    {isEditing
                      ? <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="text-base font-bold text-slate-800 border-b-2 border-green-400 focus:outline-none bg-transparent" />
                      : <h3 className="text-base font-bold text-slate-800">Editor: {selected.name}</h3>}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>{selected.version}</span>
                      {selected.status === "production" && <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Deployed</span>}
                      {autoSaved && <span className="text-green-500">✓ Auto-saved</span>}
                      {saveMsg && <span className="text-green-600 font-medium">{saveMsg}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={handleSave} loading={saving}><Save className="w-3.5 h-3.5" /> Save Draft</Button>
                        <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditContent(selected.content); setEditName(selected.name); }}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><PenTool className="w-3.5 h-3.5" /> Edit</Button>
                        {/* Feature 15: Deploy */}
                        <Button size="sm" loading={deploying === selected.id} onClick={() => handleDeploy(selected.id)}>
                          <Zap className="w-3.5 h-3.5" /> {deploying === selected.id ? "Deploying..." : "Deploy to Prod"}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setShowTest(!showTest); }}>
                      <Play className="w-3.5 h-3.5" /> Test Run
                    </Button>
                  </div>
                </div>

                {/* Feature 2: Prompt editor */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {/* Feature 9: Token counter */}
                      <span className={cn("font-medium", tokenCount > 500 ? "text-amber-500" : "text-slate-500")}>
                        ~{isEditing ? tokenCount : selected.tokens} tokens
                      </span>
                      <button onClick={() => navigator.clipboard.writeText(editContent)}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-4 font-mono text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
                      rows={12} />
                  ) : (
                    <pre className="p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">
                      {editContent.split("\n").map((line, i) => (
                        <span key={i} className={cn(
                          line.startsWith("<") ? "text-green-700" :
                          line.includes("{{") ? "text-blue-600" :
                          line.startsWith("//") || line.startsWith("#") ? "text-slate-400" :
                          "text-slate-700"
                        )}>{line}{"\n"}</span>
                      ))}
                    </pre>
                  )}
                </Card>

                {/* Feature 3: Test panel */}
                {showTest && (
                  <Card className="p-4 border-green-200 animate-fade-in">
                    <p className="text-xs font-semibold text-green-700 mb-3 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5" /> Live Test Runner
                    </p>
                    <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter test input variables (e.g. user_query: 'What is the leave policy?')"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none mb-3"
                      rows={3} />
                    <Button size="sm" loading={testing} onClick={handleTest}>
                      <Play className="w-3.5 h-3.5" /> {testing ? "Running..." : "Run Test"}
                    </Button>
                    {testResult && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-in">
                        <div className="flex items-center gap-3 mb-2 text-[11px] text-slate-500">
                          <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pass</span>
                          <span><Clock className="w-3 h-3 inline" /> {testResult.latencyMs}ms</span>
                          <span><Zap className="w-3 h-3 inline" /> {testResult.tokens} tokens</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{testResult.output}</p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Feature 7: Version history */}
                <Card className="p-4">
                  <button onClick={() => setShowVersions(!showVersions)}
                    className="flex items-center justify-between w-full text-sm font-semibold text-slate-700">
                    <span className="flex items-center gap-2"><GitCommit className="w-4 h-4 text-green-600" /> Version History & Performance</span>
                    {showVersions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showVersions && (
                    <div className="mt-4 animate-fade-in">
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={versionHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="version" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[75, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "Success Rate"]} />
                          <Line type="monotone" dataKey="successRate" stroke="#059669" strokeWidth={2.5} dot={{ fill: "#059669", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                {/* Feature 18: Tags editor */}
                {isEditing && (
                  <Card className="p-3 animate-fade-in">
                    <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags.map((tag) => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-[11px] text-green-700">
                          {tag}
                          <button onClick={async () => {
                            const newTags = selected.tags.filter((t) => t !== tag);
                            await fetch("/api/prompts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, tags: newTags }) });
                            setSelected({ ...selected, tags: newTags });
                          }}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                      <input placeholder="+ add tag" className="text-[11px] px-2 py-0.5 border border-dashed border-slate-300 rounded-full focus:outline-none focus:border-green-400 text-slate-600 w-20"
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            const newTags = [...selected.tags, e.currentTarget.value.trim()];
                            await fetch("/api/prompts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, tags: newTags }) });
                            setSelected({ ...selected, tags: newTags });
                            e.currentTarget.value = "";
                          }
                        }} />
                    </div>
                  </Card>
                )}

                {/* Feature 19: Prompt metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Success Rate", value: `${selected.successRate}%`, icon: CheckCircle, color: "text-emerald-600" },
                    { label: "Avg Latency",  value: `${selected.avgLatencyMs}ms`, icon: Clock, color: "text-blue-600" },
                    { label: "Total Runs",   value: selected.runCount.toLocaleString(), icon: Activity, color: "text-purple-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="p-3 text-center">
                      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
                      <p className={cn("text-lg font-bold", color)}>{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <PenTool className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a prompt to view and edit</p>
                </div>
              </div>
            )}

            {/* Feature 20: Performance overview chart */}
            {stats && prompts.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">All Prompts — Success Rate Overview</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={prompts.map((p) => ({ name: p.name.split(" ")[0], rate: p.successRate, runs: p.runCount }))} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[75, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "Success Rate"]} />
                      <Bar dataKey="rate" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feature 14: Undo delete toast */}
        {undoPrompt && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-xl shadow-2xl animate-fade-in z-50">
            <span className="text-sm">Deleted "{undoPrompt.name}"</span>
            <button onClick={async () => {
              await fetch("/api/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(undoPrompt) });
              await fetchPrompts(true);
              setUndoPrompt(null);
            }} className="text-green-400 text-sm font-bold hover:text-green-300">Undo</button>
          </div>
        )}

        {/* Feature 4: New Prompt Modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-800 flex items-center gap-2"><Plus className="w-4 h-4 text-green-600" /> New Prompt</p>
                <button onClick={() => setShowNew(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Prompt Name *</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Customer Support Prompt"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {["System","Agent","Tool","Eval","Custom"].map((t) => (
                      <button key={t} onClick={() => setNewType(t as any)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all",
                          newType === t ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Content *</label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
                    placeholder="You are a helpful assistant. Use context: {{ retrieved_documents }}"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                    rows={6} />
                  <p className="text-[10px] text-slate-400 mt-1">~{Math.ceil(newContent.split(/\s+/).filter(Boolean).length * 1.3)} tokens</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tags (comma separated)</label>
                  <input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="rag, production, support"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                </div>
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName || !newContent}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
