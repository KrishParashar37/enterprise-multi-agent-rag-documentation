"use client";

import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { mockEvaluations, mockEvalSummary } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line
} from "recharts";
import {
  FlaskConical, CheckCircle2, XCircle, Target, TrendingUp,
  Play, Filter, Download, RefreshCw, Plus, ChevronDown,
  ChevronRight, AlertTriangle, Info
} from "lucide-react";

const metricsData = [
  { metric: "Faithfulness", score: mockEvalSummary.faithfulness },
  { metric: "Ans. Relevance", score: mockEvalSummary.answerRelevance },
  { metric: "Context Recall", score: mockEvalSummary.contextRecall },
  { metric: "Citation Acc.", score: mockEvalSummary.citationAccuracy },
  { metric: "Overall", score: mockEvalSummary.overallScore },
];

const radarData = [
  { metric: "Faithfulness", value: mockEvalSummary.faithfulness },
  { metric: "Relevance", value: mockEvalSummary.answerRelevance },
  { metric: "Recall", value: mockEvalSummary.contextRecall },
  { metric: "Citation", value: mockEvalSummary.citationAccuracy },
  { metric: "Overall", value: mockEvalSummary.overallScore },
];

// Feature 35: Score trend over time (simulated)
const scoreTrendData = [
  { run: "v1.0", overall: 88.2, faithfulness: 90.1, relevance: 87.4 },
  { run: "v1.1", overall: 90.5, faithfulness: 92.3, relevance: 89.1 },
  { run: "v1.2", overall: 91.8, faithfulness: 93.5, relevance: 90.8 },
  { run: "v2.0", overall: 93.2, faithfulness: 94.2, relevance: 92.8 },
];

// Feature 36: Dataset list — initial data
const INITIAL_DATASETS = [
  { id: "ds-1", name: "Enterprise QA v2",  questions: 1000, passRate: 91.4, lastRun: "2025-05-09", status: "completed"  },
  { id: "ds-2", name: "HR Policy Suite",    questions: 450,  passRate: 94.2, lastRun: "2025-05-08", status: "completed"  },
  { id: "ds-3", name: "Finance Q&A",        questions: 280,  passRate: 88.7, lastRun: "2025-05-05", status: "completed"  },
  { id: "ds-4", name: "Engineering Docs",   questions: 320,  passRate: 92.1, lastRun: "2025-04-30", status: "in_progress"},
];
type Dataset = typeof INITIAL_DATASETS[0];

function ScoreBar({ value, max = 100, color = "#2d6a4f" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-medium text-slate-300 w-12 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 0.9 ? "success" : score >= 0.7 ? "warning" : "error";
  return <Badge variant={color}>{score.toFixed(2)}</Badge>;
}

export default function EvaluationPage() {
  const [filter,          setFilter]          = useState("All");
  const [activeTab,       setActiveTab]       = useState("results");
  const [isRunning,       setIsRunning]       = useState(false);
  const [runProgress,     setRunProgress]     = useState(0);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  // ── Feature 36: Datasets as state so new ones can be added ──
  const [datasets,        setDatasets]        = useState<Dataset[]>(INITIAL_DATASETS);
  const [selectedDataset, setSelectedDataset] = useState(INITIAL_DATASETS[0].name);

  // ── New Dataset Modal ──────────────────────────────────────
  const [showNewDataset,  setShowNewDataset]  = useState(false);
  const [newName,         setNewName]         = useState("");
  const [newQuestions,    setNewQuestions]    = useState("");
  const [newStatus,       setNewStatus]       = useState("pending");
  const [addError,        setAddError]        = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const handleAddDataset = () => {
    if (!newName.trim()) { setAddError("Dataset name is required."); nameRef.current?.focus(); return; }
    const qCount = parseInt(newQuestions) || 0;
    const today  = new Date().toISOString().split("T")[0];
    const ds: Dataset = {
      id:        `ds-${Date.now()}`,
      name:      newName.trim(),
      questions: qCount,
      passRate:  0,
      lastRun:   today,
      status:    "pending",
    };
    setDatasets((prev) => [...prev, ds]);
    setSelectedDataset(ds.name);
    setActiveTab("datasets");   // switch to datasets tab to show it
    setShowNewDataset(false);
    setNewName(""); setNewQuestions(""); setNewStatus("pending"); setAddError("");
  };

  const filtered = mockEvaluations.filter((e) => {
    if (filter === "Passed") return e.passed;
    if (filter === "Failed") return !e.passed;
    return true;
  });

  // Feature 37: Simulate evaluation run
  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setRunProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 120));
      setRunProgress(i);
    }
    setIsRunning(false);
    setRunProgress(0);
  };

  // Feature 39: Export evaluation results CSV
  const handleExportCSV = () => {
    const rows = [
      ["Question", "Generated Answer", "Overall Score", "Faithfulness", "Relevance", "Context Recall", "Citation", "Passed"],
      ...mockEvaluations.map((e) => [
        e.question, e.generatedAnswer,
        e.overallScore?.toFixed(2) || "",
        e.faithfulness?.toFixed(2) || "",
        e.answerRelevance?.toFixed(2) || "",
        e.contextRecall?.toFixed(2) || "",
        e.citationAccuracy?.toFixed(2) || "",
        e.passed ? "PASS" : "FAIL",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evaluation-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="Evaluation Center" subtitle="Measure and track RAG quality with automated evaluation">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-green-600/10 via-green-600/5 to-transparent border border-green-500/20 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{mockEvalSummary.datasetName}</h3>
                <p className="text-xs text-slate-500">{mockEvalSummary.evaluated} / {mockEvalSummary.totalQuestions} questions evaluated</p>
              </div>
            </div>
            <div className="flex items-center gap-6 ml-auto flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{mockEvalSummary.overallScore.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-500">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{mockEvalSummary.passRate}%</p>
                <p className="text-[10px] text-slate-500">Pass Rate</p>
              </div>
              <div className="flex flex-col gap-2">
                {/* Feature 37: Run with progress */}
                <Button size="sm" onClick={handleRunEvaluation} loading={isRunning} disabled={isRunning}>
                  <Play className="w-3.5 h-3.5" />{isRunning ? `Running... ${runProgress}%` : "Run Evaluation"}
                </Button>
                {/* Feature 39: Export */}
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>
            </div>
          </div>
          {/* Feature 37: Progress bar */}
          {isRunning && (
            <div className="mt-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-200" style={{ width: `${runProgress}%` }} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">{runProgress}% complete · Evaluating {Math.floor(runProgress * 10)} questions</p>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="border-b border-slate-700/50">
          <div className="flex gap-1">
            {["results", "datasets", "trends"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px capitalize",
                  activeTab === tab ? "border-green-500 text-green-400" : "border-transparent text-slate-500 hover:text-slate-300"
                )}>{tab}</button>
            ))}
          </div>
        </div>

        {activeTab === "results" && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Faithfulness", value: mockEvalSummary.faithfulness, color: "#2d6a4f", desc: "Answer grounded in context" },
                { label: "Answer Relevance", value: mockEvalSummary.answerRelevance, color: "#38bdf8", desc: "Relevant to the question" },
                { label: "Context Recall", value: mockEvalSummary.contextRecall, color: "#10b981", desc: "Retrieved relevant chunks" },
                { label: "Citation Accuracy", value: mockEvalSummary.citationAccuracy, color: "#f59e0b", desc: "Sources correctly cited" },
              ].map(({ label, value, color, desc }) => (
                <Card key={label} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-400">{label}</p>
                    <Target className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-100 mb-1">{value.toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-600 mb-3">{desc}</p>
                  <ScoreBar value={value} color={color} />
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Metric Scores</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={metricsData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "Score"]} />
                      <Bar dataKey="score" fill="#2d6a4f" radius={[4, 4, 0, 0]} name="Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Radar Analysis</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <PolarRadiusAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#2d6a4f" fill="#2d6a4f" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "Score"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Test Cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Test Cases</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                      {["All", "Passed", "Failed"].map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                          className={cn("px-3 py-1.5 transition-colors", filter === f ? "bg-green-600 text-white" : "text-slate-500 hover:text-slate-300 bg-slate-800")}>
                          {f}
                          {f === "Failed" && <span className="ml-1 text-red-400">({mockEvaluations.filter((e) => !e.passed).length})</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="divide-y divide-slate-700/30">
                {filtered.map((ev) => (
                  <div key={ev.id} className="hover:bg-slate-800/20 transition-colors">
                    {/* Feature 38: Expandable row */}
                    <button
                      className="w-full px-6 py-4 text-left"
                      onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          ev.passed ? "bg-emerald-500/20" : "bg-red-500/20"
                        )}>
                          {ev.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={ev.passed ? "success" : "error"} className="text-[10px]">
                              {ev.passed ? "PASSED" : "FAILED"}
                            </Badge>
                            <span className="text-[10px] text-slate-600">Overall: {ev.overallScore?.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-600">{ev.datasetName}</span>
                            {!ev.passed && <Badge variant="warning" className="text-[10px]"><AlertTriangle className="w-2.5 h-2.5" />Needs review</Badge>}
                          </div>
                          <p className="text-xs text-slate-300">{ev.question}</p>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-slate-600 shrink-0 transition-transform mt-1", expandedId === ev.id && "rotate-90")} />
                      </div>
                    </button>
                    {/* Feature 38: Expanded detail */}
                    {expandedId === ev.id && (
                      <div className="px-6 pb-4 animate-fade-in">
                        <div className="ml-9 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                              <p className="text-[10px] text-slate-600 mb-1.5 font-medium uppercase">Expected Answer</p>
                              <p className="text-xs text-slate-400">{ev.expectedAnswer}</p>
                            </div>
                            <div className={cn("p-3 rounded-lg border", ev.passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                              <p className="text-[10px] text-slate-600 mb-1.5 font-medium uppercase">Generated Answer</p>
                              <p className="text-xs text-slate-400">{ev.generatedAnswer}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { label: "Faithfulness", val: ev.faithfulness },
                              { label: "Relevance", val: ev.answerRelevance },
                              { label: "Context Recall", val: ev.contextRecall },
                              { label: "Citation", val: ev.citationAccuracy },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-600">{label}:</span>
                                {val != null ? <ScoreBadge score={val} /> : <span className="text-[10px] text-slate-600">—</span>}
                              </div>
                            ))}
                          </div>
                          {!ev.passed && (
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Low faithfulness score detected. The generated answer may contain information not grounded in retrieved context. Consider re-indexing source documents.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Feature 36: Datasets tab */}
        {activeTab === "datasets" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                <span className="text-slate-200 font-semibold">{datasets.length}</span> evaluation datasets
              </p>
              <Button size="sm" onClick={() => { setShowNewDataset(true); setAddError(""); }}>
                <Plus className="w-3.5 h-3.5" /> New Dataset
              </Button>
            </div>

            {/* ── New Dataset Modal ── */}
            {showNewDataset && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowNewDataset(false); }}>
                <div className="w-full max-w-md rounded-2xl shadow-2xl animate-fade-in"
                  style={{ background: "#fff", border: "1px solid rgba(45,106,79,0.25)" }}>

                  {/* Modal header */}
                  <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid rgba(45,106,79,0.12)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(45,106,79,0.12)" }}>
                        <FlaskConical className="w-4 h-4 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">New Evaluation Dataset</p>
                        <p className="text-[10px] text-slate-500">Add a new QA benchmark dataset</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNewDataset(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="px-6 py-5 space-y-4">

                    {/* Dataset Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dataset Name <span className="text-red-500">*</span></label>
                      <input
                        ref={nameRef}
                        value={newName}
                        onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddDataset()}
                        placeholder="e.g. Customer Support QA v1"
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                        style={{ background: "rgba(45,106,79,0.04)", border: addError ? "1.5px solid #ef4444" : "1.5px solid rgba(45,106,79,0.2)" }}
                        autoFocus
                      />
                      {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
                    </div>

                    {/* Question Count */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Number of Questions</label>
                      <input
                        type="number"
                        value={newQuestions}
                        onChange={(e) => setNewQuestions(e.target.value)}
                        placeholder="e.g. 500"
                        min="1"
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                        style={{ background: "rgba(45,106,79,0.04)", border: "1.5px solid rgba(45,106,79,0.2)" }}
                      />
                    </div>

                    {/* Initial Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Status</label>
                      <div className="flex gap-2">
                        {["pending", "in_progress", "completed"].map((s) => (
                          <button key={s} type="button"
                            onClick={() => setNewStatus(s)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize",
                              newStatus === s
                                ? "bg-green-600 text-white border-green-600"
                                : "text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-700"
                            )}>
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: "rgba(45,106,79,0.06)", border: "1px solid rgba(45,106,79,0.15)" }}>
                      <Info className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        The dataset will appear in the Datasets tab immediately. Run the evaluation to compute pass rates.
                      </p>
                    </div>
                  </div>

                  {/* Modal footer */}
                  <div className="flex gap-2 px-6 py-4"
                    style={{ borderTop: "1px solid rgba(45,106,79,0.1)" }}>
                    <button onClick={() => setShowNewDataset(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleAddDataset}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }}>
                      <Plus className="w-4 h-4" /> Add Dataset
                    </button>
                  </div>
                </div>
              </div>
            )}
            {datasets.map((ds) => (
              <Card key={ds.id} hover
                className={cn("p-4", selectedDataset === ds.name && "border-green-500/40")}
                onClick={() => setSelectedDataset(ds.name)}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{ds.name}</p>
                      <p className="text-xs text-slate-500">
                        {ds.questions > 0 ? `${ds.questions} questions` : "No questions yet"} · Last run: {ds.lastRun}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", ds.passRate >= 90 ? "text-emerald-400" : ds.passRate > 0 ? "text-amber-400" : "text-slate-500")}>
                        {ds.passRate > 0 ? `${ds.passRate}%` : "—"}
                      </p>
                      <p className="text-[10px] text-slate-600">Pass Rate</p>
                    </div>
                    <Badge variant={
                      ds.status === "completed" ? "success" :
                      ds.status === "in_progress" ? "warning" : "default"
                    }>{ds.status.replace("_", " ")}</Badge>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleRunEvaluation(); }}>
                      <Play className="w-3.5 h-3.5" /> Run
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete dataset "${ds.name}"?`)) {
                          setDatasets((prev) => prev.filter((d) => d.id !== ds.id));
                          if (selectedDataset === ds.name) setSelectedDataset(INITIAL_DATASETS[0].name);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete dataset"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}

          </div>
        )}

        {/* Feature 35: Trends tab */}
        {activeTab === "trends" && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Score Trend Across Evaluation Runs</CardTitle>
                  <Badge variant="success"><TrendingUp className="w-3 h-3" />Improving</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="run" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[85, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`]} />
                    <Line type="monotone" dataKey="overall" stroke="#2d6a4f" strokeWidth={2} dot={{ fill: "#2d6a4f", r: 4 }} name="Overall" />
                    <Line type="monotone" dataKey="faithfulness" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} name="Faithfulness" />
                    <Line type="monotone" dataKey="relevance" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} name="Relevance" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  {[{ label: "Overall", color: "#2d6a4f" }, { label: "Faithfulness", color: "#10b981" }, { label: "Relevance", color: "#f59e0b" }].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                      <span className="text-xs text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
