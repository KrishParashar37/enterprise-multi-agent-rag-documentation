"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line
} from "recharts";
import {
  ThumbsUp, ThumbsDown, TrendingUp, Filter, MessageSquare,
  Download, RefreshCw, X, Plus, CheckCircle2, Clock, Activity,
  Star, AlertTriangle, Search, Loader2, Send, BarChart2,
  User, Tag, ChevronDown, ChevronUp, Archive, Eye, Zap
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type FeedbackItem = {
  id: string; user: string; sentiment: "positive"|"negative"|"neutral";
  rating: number; query: string; agent: string; comment: string;
  time: string; timestamp: number; resolved: boolean;
  category: string; sessionId: string;
};

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp,   color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", label: "Positive" },
  negative: { icon: ThumbsDown, color: "text-red-500",     bg: "bg-red-50 border-red-200",         dot: "bg-red-500",    label: "Negative" },
  neutral:  { icon: MessageSquare,color:"text-slate-500",   bg: "bg-slate-50 border-slate-200",    dot: "bg-slate-400",  label: "Neutral"  },
};

const CATEGORY_COLORS: Record<string, string> = {
  accuracy:     "bg-blue-50 text-blue-700 border-blue-200",
  freshness:    "bg-amber-50 text-amber-700 border-amber-200",
  speed:        "bg-purple-50 text-purple-700 border-purple-200",
  completeness: "bg-cyan-50 text-cyan-700 border-cyan-200",
  quality:      "bg-green-50 text-green-700 border-green-200",
  other:        "bg-slate-50 text-slate-600 border-slate-200",
};

const DONUT_COLORS = ["#10b981", "#94a3b8", "#ef4444"];

export default function FeedbackPage() {
  const [feedback,      setFeedback]      = useState<FeedbackItem[]>([]);
  const [trend,         setTrend]         = useState<any[]>([]);
  const [stats,         setStats]         = useState<any>(null);
  const [categories,    setCategories]    = useState<string[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [lastFetch,     setLastFetch]     = useState(Date.now());
  const [rtPulse,       setRtPulse]       = useState(false);

  // Feature 1: Filters
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [categoryFilter,  setCategoryFilter]  = useState("All");
  const [resolvedFilter,  setResolvedFilter]  = useState("All");
  const [search,          setSearch]          = useState("");

  // Feature 2: Sort
  const [sortBy,          setSortBy]          = useState<"newest"|"oldest"|"rating">("newest");

  // Feature 3: Submit feedback modal
  const [showSubmit,      setShowSubmit]      = useState(false);
  const [newUser,         setNewUser]         = useState("");
  const [newQuery,        setNewQuery]        = useState("");
  const [newAgent,        setNewAgent]        = useState("HR Policy Agent");
  const [newComment,      setNewComment]      = useState("");
  const [newSentiment,    setNewSentiment]    = useState<"positive"|"negative"|"neutral">("positive");
  const [newRating,       setNewRating]       = useState(4);
  const [newCategory,     setNewCategory]     = useState("accuracy");
  const [submitting,      setSubmitting]      = useState(false);
  const [submitDone,      setSubmitDone]      = useState(false);

  // Feature 4: Expanded card
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  // Feature 5: Selected for reply
  const [replyId,         setReplyId]         = useState<string | null>(null);
  const [replyText,       setReplyText]       = useState("");

  // Feature 6: Tag drill-down
  const [activeCategory,  setActiveCategory]  = useState<string | null>(null);

  // Feature 7: Time range
  const [timeRange,       setTimeRange]       = useState<"7d"|"30d"|"all">("7d");

  // Feature 8: Bulk resolve
  const [bulkSelected,    setBulkSelected]    = useState<Set<string>>(new Set());

  // Feature 9: New feedback count badge
  const [newCount,        setNewCount]        = useState(0);
  const prevLen = useRef(0);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sentimentFilter !== "All") params.set("sentiment", sentimentFilter);
      if (resolvedFilter   !== "All") params.set("resolved",  resolvedFilter);
      if (categoryFilter   !== "All") params.set("category",  categoryFilter);
      const res  = await fetch(`/api/feedback?${params}`);
      const data = await res.json();
      setFeedback(data.feedback || []);
      setTrend(data.trend || []);
      setStats(data.stats || null);
      setCategories(data.categories || []);
      setLastFetch(Date.now());
      if (silent) {
        setRtPulse(true);
        setTimeout(() => setRtPulse(false), 800);
        if (data.feedback?.length > prevLen.current) {
          setNewCount(data.feedback.length - prevLen.current);
          setTimeout(() => setNewCount(0), 4000);
        }
        prevLen.current = data.feedback?.length ?? 0;
      } else {
        prevLen.current = data.feedback?.length ?? 0;
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [sentimentFilter, resolvedFilter, categoryFilter]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  // Feature 10: Real-time polling every 12s
  useEffect(() => {
    const id = setInterval(() => fetchFeedback(true), 12000);
    return () => clearInterval(id);
  }, [fetchFeedback]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = [...feedback]
    .filter((f) => {
      const matchSearch   = !search || f.user.toLowerCase().includes(search.toLowerCase()) || f.comment.toLowerCase().includes(search.toLowerCase()) || f.query.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !activeCategory || f.category === activeCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.timestamp - a.timestamp;
      if (sortBy === "oldest") return a.timestamp - b.timestamp;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleResolve = async (id: string, resolved: boolean) => {
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
    });
    setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, resolved } : f));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  };

  // Feature 3: Submit new feedback
  const handleSubmit = async () => {
    if (!newQuery.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: newUser || "anonymous@enterprise.com", sentiment: newSentiment, rating: newRating, query: newQuery, agent: newAgent, comment: newComment, category: newCategory }),
    });
    const data = await res.json();
    setFeedback((prev) => [data.feedback, ...prev]);
    setSubmitting(false); setSubmitDone(true);
    setTimeout(() => { setSubmitDone(false); setShowSubmit(false); setNewUser(""); setNewQuery(""); setNewComment(""); }, 1500);
  };

  // Feature 8: Bulk resolve
  const handleBulkResolve = async () => {
    await Promise.all([...bulkSelected].map((id) =>
      fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, resolved: true }) })
    ));
    setFeedback((prev) => prev.map((f) => bulkSelected.has(f.id) ? { ...f, resolved: true } : f));
    setBulkSelected(new Set());
  };

  // Feature 12: Export CSV
  const handleExportCSV = () => {
    const rows = [
      ["ID","User","Sentiment","Rating","Query","Agent","Comment","Category","Resolved","Time"],
      ...feedback.map((f) => [f.id, f.user, f.sentiment, f.rating, f.query, f.agent, f.comment, f.category, f.resolved, f.time]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "feedback.csv"; a.click();
  };

  // ── Pie data ───────────────────────────────────────────────────────────────
  const pieData = stats ? [
    { name: "Positive", value: stats.positive, color: "#10b981" },
    { name: "Neutral",  value: stats.neutral,  color: "#94a3b8" },
    { name: "Negative", value: stats.negative, color: "#ef4444" },
  ] : [];

  // Feature 17: Rating distribution
  const ratingDist = [1,2,3,4,5].map((r) => ({
    rating: `${r}⭐`,
    count: feedback.filter((f) => f.rating === r).length,
  }));

  // Feature 18: Agent breakdown
  const agentBreakdown = Object.entries(
    feedback.reduce((acc, f) => { acc[f.agent] = (acc[f.agent] || 0) + 1; return acc; }, {} as Record<string,number>)
  ).map(([agent, count]) => ({ agent: agent.split(" ")[0], count }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <MainLayout title="User Feedback" subtitle="Analyze user satisfaction and response quality in real time">
      <div className="p-6 space-y-5 animate-fade-in">

        {/* Feature 11: Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowSubmit(true)}>
              <Plus className="w-4 h-4" /> Submit Feedback
            </Button>
            <Button variant="outline" onClick={() => fetchFeedback()}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
            {bulkSelected.size > 0 && (
              <Button size="sm" variant="outline" onClick={handleBulkResolve}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve {bulkSelected.size}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {newCount > 0 && <span className="text-green-500 font-semibold">+{newCount} new</span>}
            {rtPulse && <span className="text-green-500 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Live</span>}
            <span>Last update: {new Date(lastFetch).toLocaleTimeString()}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Feature 13: Stats KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total",    value: stats.positive + stats.negative + stats.neutral, color: "text-slate-700",   icon: MessageSquare },
              { label: "Positive", value: stats.positive,  color: "text-emerald-600", icon: ThumbsUp    },
              { label: "Negative", value: stats.negative,  color: "text-red-500",     icon: ThumbsDown  },
              { label: "Resolved", value: stats.resolved,  color: "text-blue-600",    icon: CheckCircle2 },
              { label: "Avg Rating",value: `${stats.avgRating}/5`, color: "text-amber-600", icon: Star },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="p-3 text-center">
                <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
                <p className={cn("text-xl font-bold", color)}>{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Feature 1+7: Filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search feedback, users, queries..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-green-100 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-700" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          {["All","positive","negative","neutral"].map((s) => (
            <button key={s} onClick={() => setSentimentFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all",
                sentimentFilter === s ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
              {s}
            </button>
          ))}
          <select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none">
            <option value="All">All status</option>
            <option value="false">Unresolved</option>
            <option value="true">Resolved</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">By rating</option>
          </select>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Feature 6: Category filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Category:</span>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn("px-2.5 py-1 rounded-full text-[11px] border capitalize transition-all",
                activeCategory === cat ? "bg-green-600 text-white border-green-600" : "text-slate-500 border-slate-200 hover:border-green-300")}>
              {cat}
            </button>
          ))}
          {activeCategory && <button onClick={() => setActiveCategory(null)} className="text-[11px] text-red-400">✕ clear</button>}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Feature 14: Trend chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Satisfaction Trend (7 Days)</CardTitle>
                  <CardDescription>Thumbs Up vs Thumbs Down — Live</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorUp"   x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:11}} />
                  <RechartsTooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",fontSize:"11px"}} />
                  <Area type="monotone" dataKey="up"   stroke="#10b981" fill="url(#colorUp)"   strokeWidth={2} name="Positive" />
                  <Area type="monotone" dataKey="down" stroke="#ef4444" fill="url(#colorDown)" strokeWidth={2} name="Negative" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature 15: Sentiment donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sentiment Overview</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {stats && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-green-600">{stats.avgRating}</p>
                    <p className="text-[10px] text-slate-500">Avg Rating</p>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1 w-full">
                {pieData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-slate-600">{name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature 17+18: Rating dist + Agent breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={ratingDist} barSize={28}>
                  <XAxis dataKey="rating" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{fontSize:"11px"}} />
                  <Bar dataKey="count" fill="#059669" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Feedback by Agent</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={agentBreakdown} barSize={28}>
                  <XAxis dataKey="agent" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{fontSize:"11px"}} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Feature 2: Feedback list ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">
              Recent Feedback <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
            </p>
            {filtered.some((f) => !f.resolved) && (
              <span className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {filtered.filter((f) => !f.resolved).length} unresolved
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const sc  = SENTIMENT_CONFIG[item.sentiment];
                const Icon = sc.icon;
                const isExpanded = expandedId === item.id;
                const isBulk     = bulkSelected.has(item.id);
                return (
                  <Card key={item.id}
                    className={cn("overflow-hidden transition-all", item.resolved && "opacity-60", isBulk && "border-green-400")}>
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {/* Feature 8: Bulk checkbox */}
                        <input type="checkbox" checked={isBulk}
                          onChange={() => setBulkSelected((prev) => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })}
                          className="accent-green-600 mt-1 w-3.5 h-3.5 shrink-0" />

                        {/* Avatar */}
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", sc.icon === ThumbsUp ? "bg-emerald-100" : sc.icon === ThumbsDown ? "bg-red-100" : "bg-slate-100")}>
                          <Icon className={cn("w-4 h-4", sc.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-700">{item.user}</span>
                              <span className="text-[11px] text-slate-400">{item.time}</span>
                              <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other)}>{item.category}</Badge>
                              {item.resolved && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" /> Resolved</Badge>}
                            </div>
                            {/* Feature 19: Star rating display */}
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map((r) => (
                                <Star key={r} className={cn("w-3 h-3", r <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 mt-1">Agent: <span className="font-medium text-slate-600">{item.agent}</span></p>

                          {/* Feature 4: Query context */}
                          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] text-slate-400 mb-0.5">Query context:</p>
                            <p className="text-xs text-slate-700 italic">"{item.query}"</p>
                          </div>

                          <p className="text-sm text-slate-700 mt-2">"{item.comment}"</p>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {isExpanded ? "Collapse" : "Details"}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button onClick={() => setReplyId(replyId === item.id ? null : item.id)}
                              className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-1">
                              <Send className="w-3 h-3" /> Reply
                            </button>
                            {!item.resolved ? (
                              <button onClick={() => handleResolve(item.id, true)}
                                className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                              </button>
                            ) : (
                              <button onClick={() => handleResolve(item.id, false)}
                                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                <Archive className="w-3 h-3" /> Reopen
                              </button>
                            )}
                            <button onClick={() => handleDelete(item.id)} className="text-[11px] text-red-400 hover:text-red-600 ml-auto flex items-center gap-1">
                              <X className="w-3 h-3" /> Delete
                            </button>
                          </div>

                          {/* Feature 4: Expanded detail */}
                          {isExpanded && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                <div><span className="font-medium">Session:</span> {item.sessionId}</div>
                                <div><span className="font-medium">Sentiment:</span> <span className={cn("capitalize", sc.color)}>{item.sentiment}</span></div>
                                <div><span className="font-medium">Rating:</span> {item.rating}/5</div>
                                <div><span className="font-medium">Category:</span> <span className="capitalize">{item.category}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Feature 5: Reply input */}
                          {replyId === item.id && (
                            <div className="mt-3 animate-fade-in">
                              <div className="flex items-center gap-2">
                                <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type a reply to this user..."
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                                <button onClick={() => { setReplyId(null); setReplyText(""); }}
                                  className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors">
                                  Send
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {filtered.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No feedback found for this filter</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature 3: Submit Feedback Modal */}
        {showSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSubmit(false); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-800 flex items-center gap-2"><Plus className="w-4 h-4 text-green-600" /> Submit Feedback</p>
                <button onClick={() => setShowSubmit(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              {submitDone ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-700">Feedback submitted!</p>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-4">
                  {/* Sentiment selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-2 block">Sentiment</label>
                    <div className="flex gap-2">
                      {(["positive","neutral","negative"] as const).map((s) => (
                        <button key={s} onClick={() => setNewSentiment(s)}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition-all",
                            newSentiment === s ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feature 20: Star rating input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-2 block">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((r) => (
                        <button key={r} onClick={() => setNewRating(r)}>
                          <Star className={cn("w-6 h-6 transition-colors", r <= newRating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">User Email</label>
                      <input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="user@enterprise.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Agent</label>
                      <select value={newAgent} onChange={(e) => setNewAgent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none bg-white">
                        {["HR Policy Agent","SQL Agent","DevOps Agent","Security Agent","Research Agent"].map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Query (what the user asked) *</label>
                    <input value={newQuery} onChange={(e) => setNewQuery(e.target.value)} placeholder="e.g. What is the annual leave policy?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {["accuracy","freshness","speed","completeness","quality","other"].map((c) => (
                        <button key={c} onClick={() => setNewCategory(c)}
                          className={cn("px-2.5 py-1 rounded-lg text-[11px] border capitalize transition-all",
                            newCategory === c ? "bg-green-600 text-white border-green-600" : "text-slate-600 border-slate-200 hover:border-green-300")}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Comment</label>
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Describe the issue or praise..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                      rows={3} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setShowSubmit(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting || !newQuery.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
