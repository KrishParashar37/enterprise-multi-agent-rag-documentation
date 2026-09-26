"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { generateAndPrintReport } from "@/lib/generate-report";
import {
  Search, FileText, Filter, Clock, ChevronRight, Sparkles,
  Database, X, History, Download, Bookmark, BookmarkCheck,
  Copy, ArrowUpRight, MessageSquare, Loader2, ThumbsUp, ThumbsDown,
  SortAsc, SortDesc, BarChart2, Columns, Layers, Star,
  Zap, TrendingUp, ChevronDown, ChevronUp
} from "lucide-react";


/* ─── Types ─────────────────────────────────────────────── */
type SearchResult = {
  id: string; document_name: string; department: string; type: string;
  page: number; section: string; excerpt: string; relevance: number; date: string;
};
type Feedback = Record<string, "up" | "down">;
type SortField = "relevance" | "date" | "name" | "section";
type GroupMode  = "none" | "document" | "department";

/* ─── Constants ─────────────────────────────────────────── */
const SEARCH_MODES = [
  { id: "hybrid",   label: "Hybrid",   icon: Sparkles,  desc: "Vector + Keyword" },
  { id: "semantic", label: "Semantic", icon: Database,   desc: "Vector similarity" },
  { id: "keyword",  label: "Keyword",  icon: Search,     desc: "Exact term match"  },
];
const DEPARTMENTS  = ["All", "Human Resources", "Technology", "Finance", "Sales", "IT Security"];
const FILE_TYPES   = ["All", "PDF", "DOCX", "MD", "CSV"];
const INIT_HISTORY = ["employee leave policy", "remote work guidelines", "API rate limits", "Q4 financial results"];
const SUGGESTIONS  = [
  "remote work policy", "leave entitlements", "API architecture",
  "security compliance", "Q4 financial", "salary structure",
  "performance review", "data retention policy", "onboarding process", "VPN setup",
];
const QUICK_CHIPS = [
  { label: "HR Policies",    dept: "Human Resources", type: "All"  },
  { label: "Finance Docs",   dept: "Finance",          type: "All"  },
  { label: "Tech PDFs",      dept: "Technology",       type: "PDF"  },
  { label: "Security",       dept: "IT Security",      type: "All"  },
  { label: "CSV Data",       dept: "All",              type: "CSV"  },
];

/* ─── Relevance bar colour ───────────────────────────────── */
function relColor(r: number) {
  if (r >= 0.9) return "bg-emerald-500";
  if (r >= 0.7) return "bg-amber-400";
  return "bg-slate-500";
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  /* core */
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<SearchResult[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [mode,        setMode]        = useState("hybrid");
  const [deptFilter,  setDeptFilter]  = useState("All");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [minRel,      setMinRel]      = useState(0);
  const [searchTime,  setSearchTime]  = useState<number | null>(null);

  /* Feature 1 – Live suggestions */
  const [suggestions,    setSuggestions]    = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* Feature 2 – Search history */
  const [history,     setHistory]     = useState<string[]>(INIT_HISTORY);
  const [showHistory, setShowHistory] = useState(false);

  /* Feature 3 – Result grouping */
  const [groupMode,   setGroupMode]   = useState<GroupMode>("none");

  /* Feature 4 – Relevance histogram */
  const [showHistogram, setShowHistogram] = useState(false);

  /* Feature 5 – Saved searches */
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [showSaved,     setShowSaved]     = useState(false);

  /* Feature 6 – Compare mode */
  const [compareIds,  setCompareIds]  = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  /* Feature 7 – Sort */
  const [sortField,   setSortField]   = useState<SortField>("relevance");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  /* Feature 8 – Export PDF (uses generate-report) */
  /* Feature 9 – Quick filters bar (QUICK_CHIPS) */
  /* Feature 10 – Feedback */
  const [feedback,    setFeedback]    = useState<Feedback>({});

  /* misc UI */
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [bookmarked,  setBookmarked]  = useState<Set<string>>(new Set());
  const [copied,      setCopied]      = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Feature 1: live suggestions ─────────────────────── */
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    const filtered = SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase()) && s !== query
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [query]);

  /* ── Core search ──────────────────────────────────────── */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setSearched(false);
    setShowHistory(false);
    setShowSuggestions(false);
    setShowCompare(false);
    setCompareIds([]);

    const params = new URLSearchParams({
      q, mode,
      department:  deptFilter,
      type:        typeFilter,
      minRelevance: String(minRel / 100),
    });

    try {
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
      setSearchTime(data.elapsedMs || null);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
      setHistory((p) => [q, ...p.filter((h) => h !== q)].slice(0, 10));
    }
  }, [mode, deptFilter, typeFilter, minRel]);

  /* ── Feature 7: sorted + filtered results ─────────────── */
  const sortedResults = [...results].sort((a, b) => {
    let cmp = 0;
    if      (sortField === "relevance") cmp = a.relevance  - b.relevance;
    else if (sortField === "date")      cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    else if (sortField === "name")      cmp = a.document_name.localeCompare(b.document_name);
    else if (sortField === "section")   cmp = a.section.localeCompare(b.section);
    return sortDir === "desc" ? -cmp : cmp;
  });

  /* ── Feature 3: grouped results ───────────────────────── */
  const groupedResults: Record<string, SearchResult[]> = {};
  if (groupMode !== "none") {
    sortedResults.forEach((r) => {
      const key = groupMode === "document" ? r.document_name : r.department;
      if (!groupedResults[key]) groupedResults[key] = [];
      groupedResults[key].push(r);
    });
  }

  /* ── Feature 4: histogram data ────────────────────────── */
  const histogramBuckets = [0, 0, 0, 0, 0]; // 0-20,20-40,40-60,60-80,80-100
  results.forEach((r) => {
    const bucket = Math.min(4, Math.floor(r.relevance * 5));
    histogramBuckets[bucket]++;
  });
  const histMax = Math.max(...histogramBuckets, 1);

  /* ── Feature 8: export PDF ────────────────────────────── */
  const handleExportPDF = () => {
    const doc = {
      name:        `Search Report — "${query}"`,
      type:        "PDF",
      status:      "INDEXED",
      fileSize:    0,
      chunkCount:  results.length,
      pageCount:   2,
      department:  deptFilter !== "All" ? deptFilter : "All Departments",
      description: `Search query: "${query}"\nMode: ${mode}\nResults found: ${results.length}\n\n` +
        sortedResults.map((r, i) =>
          `${i + 1}. ${r.document_name} (p.${r.page}) — ${(r.relevance * 100).toFixed(0)}% match\n   ${r.section}: ${r.excerpt.replace(/\*\*/g, "")}`
        ).join("\n\n"),
      tags:        [mode, deptFilter, typeFilter].filter((t) => t !== "All"),
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
    generateAndPrintReport(doc);
  };

  /* ── Feature 5: save / unsave search ─────────────────── */
  const toggleSavedSearch = (q: string) => {
    setSavedSearches((prev) =>
      prev.includes(q) ? prev.filter((s) => s !== q) : [...prev, q]
    );
  };

  /* ── Feature 6: compare toggle ────────────────────────── */
  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2)  return [prev[1], id];
      return [...prev, id];
    });
  };

  /* ── Feature 10: feedback ─────────────────────────────── */
  const giveFeedback = (id: string, vote: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedback((prev) => ({ ...prev, [id]: prev[id] === vote ? undefined as any : vote }));
  };

  /* ── Copy helper ──────────────────────────────────────── */
  const copyText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text.replace(/\*\*/g, ""));
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  /* ── Plain text export ────────────────────────────────── */
  const handleExportTxt = () => {
    const text = sortedResults.map((r) =>
      `${r.document_name} (p.${r.page}) — ${r.section}\n${r.excerpt.replace(/\*\*/g, "")}\nRelevance: ${(r.relevance * 100).toFixed(0)}%`
    ).join("\n\n---\n\n");
    const blob = new Blob([`Search: "${query}"\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `search-${Date.now()}.txt`; a.click();
  };

  /* ── Compare panel ────────────────────────────────────── */
  const compareResults = results.filter((r) => compareIds.includes(r.id));

  /* ── Result card renderer ─────────────────────────────── */
  const ResultCard = ({ r }: { r: SearchResult }) => {
    const isHighlighted = highlighted === r.id;
    const isBookmarked  = bookmarked.has(r.id);
    const isInCompare   = compareIds.includes(r.id);
    const fb            = feedback[r.id];

    return (
      <Card key={r.id} hover
        className={cn("p-4 transition-all cursor-pointer",
          isHighlighted && "border-green-500/40 shadow-lg shadow-green-900/20",
          isInCompare   && "border-blue-500/40"
        )}
        onClick={() => setHighlighted(isHighlighted ? null : r.id)}>

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(45,106,79,0.12)", border: "1px solid rgba(45,106,79,0.2)" }}>
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">{r.document_name}</span>
              <Badge variant="outline" className="text-[10px] py-0">p.{r.page}</Badge>
              <span className="text-[10px] text-slate-500">{r.section}</span>
            </div>

            {/* Excerpt */}
            <p className="text-sm text-slate-400 leading-relaxed mb-2"
              dangerouslySetInnerHTML={{ __html: r.excerpt.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>') }} />

            {/* Relevance bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", relColor(r.relevance))}
                  style={{ width: `${(r.relevance * 100).toFixed(0)}%` }} />
              </div>
              <span className={cn("text-[10px] font-bold tabular-nums",
                r.relevance >= 0.9 ? "text-emerald-400" : r.relevance >= 0.7 ? "text-amber-400" : "text-slate-500")}>
                {(r.relevance * 100).toFixed(0)}%
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-[10px] text-slate-600 flex-wrap">
              <span>{r.department}</span><span>·</span>
              <span>{r.type}</span><span>·</span>
              <span>{r.date}</span>
              <div className="ml-auto flex items-center gap-1">

                {/* Feature 10: Feedback */}
                <button onClick={(e) => giveFeedback(r.id, "up", e)}
                  className={cn("p-1 rounded transition-colors", fb === "up" ? "text-emerald-400" : "text-slate-600 hover:text-emerald-400")}>
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button onClick={(e) => giveFeedback(r.id, "down", e)}
                  className={cn("p-1 rounded transition-colors", fb === "down" ? "text-red-400" : "text-slate-600 hover:text-red-400")}>
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {/* Bookmark */}
                <button onClick={(e) => { e.stopPropagation(); setBookmarked((p) => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; }); }}
                  className={cn("p-1 rounded transition-colors", isBookmarked ? "text-amber-400" : "text-slate-600 hover:text-slate-400")}>
                  {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                </button>

                {/* Copy */}
                <button onClick={(e) => copyText(r.excerpt, r.id, e)}
                  className={cn("p-1 rounded transition-colors", copied === r.id ? "text-green-400" : "text-slate-600 hover:text-slate-400")}>
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Feature 6: Compare toggle */}
                <button onClick={(e) => { e.stopPropagation(); toggleCompare(r.id); }}
                  className={cn("p-1 rounded transition-colors text-[10px] flex items-center gap-0.5",
                    isInCompare ? "text-blue-400" : "text-slate-600 hover:text-blue-400")}>
                  <Columns className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <ChevronRight className={cn("w-4 h-4 text-slate-600 shrink-0 mt-2 transition-transform", isHighlighted && "rotate-90")} />
        </div>

        {/* Expanded context */}
        {isHighlighted && (
          <div className="mt-3 pt-3 animate-fade-in" style={{ borderTop: "1px solid rgba(45,106,79,0.12)" }}>
            <p className="text-[10px] text-slate-600 mb-1.5 uppercase tracking-wider">Full Context</p>
            <p className="text-xs text-slate-500 italic leading-relaxed mb-3">
              "This excerpt is from <span className="text-slate-300">{r.document_name}</span>, {r.section}.
              The complete passage provides detailed enterprise guidelines and procedures."
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="text-[11px]">
                <ArrowUpRight className="w-3 h-3" /> Open Document
              </Button>
              <Button size="sm" variant="ghost" className="text-[11px]"
                onClick={(e) => { e.stopPropagation(); window.location.href = `/chat?q=${encodeURIComponent(r.excerpt.slice(0, 60))}`; }}>
                <MessageSquare className="w-3 h-3" /> Ask AI
              </Button>
              <Button size="sm" variant="ghost" className="text-[11px]"
                onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}>
                <Download className="w-3 h-3" /> Export PDF
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <MainLayout title="Smart Search" subtitle="Hybrid semantic + keyword search across your knowledge base">
      <div className="p-6 space-y-5 animate-fade-in">

        {/* ── Feature 9: Quick Filter Chips ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> Quick:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button key={chip.label}
              onClick={() => { setDeptFilter(chip.dept); setTypeFilter(chip.type); }}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium border transition-all",
                deptFilter === chip.dept && typeFilter === chip.type
                  ? "bg-green-600/20 border-green-500/40 text-green-400"
                  : "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-green-500/30 hover:text-slate-300"
              )}>
              {chip.label}
            </button>
          ))}
          {(deptFilter !== "All" || typeFilter !== "All") && (
            <button onClick={() => { setDeptFilter("All"); setTypeFilter("All"); }}
              className="px-3 py-1 rounded-full text-[11px] border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* ── Search Box ── */}
        <Card className="p-5">
          <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { setShowHistory(!searched && history.length > 0); setShowSuggestions(query.length >= 2); }}
                  onBlur={() => { setTimeout(() => { setShowHistory(false); setShowSuggestions(false); }, 180); }}
                  placeholder="Search enterprise knowledge base..."
                  className="w-full rounded-xl px-4 py-3 pl-12 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(45,106,79,0.2)" }}
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Feature 1: Live suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-30 shadow-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(45,106,79,0.2)" }}>
                    <div className="px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"
                      style={{ borderBottom: "1px solid rgba(45,106,79,0.1)" }}>
                      <Sparkles className="w-3 h-3 text-green-600" /> AI Suggestions
                    </div>
                    {suggestions.map((s) => (
                      <button key={s} type="button" onMouseDown={() => doSearch(s)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-green-50 transition-colors">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600 shrink-0" />{s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Feature 2: History dropdown */}
                {showHistory && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-30 overflow-hidden shadow-2xl"
                    style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(45,106,79,0.2)" }}>
                    <div className="px-4 py-2 flex items-center justify-between"
                      style={{ borderBottom: "1px solid rgba(45,106,79,0.1)" }}>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                        <History className="w-3 h-3" /> Recent Searches
                      </span>
                      <button type="button" onClick={() => setHistory([])} className="text-[10px] text-slate-600 hover:text-red-500">Clear</button>
                    </div>
                    {history.map((h) => (
                      <button key={h} type="button" onMouseDown={() => doSearch(h)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-green-50 hover:text-slate-800 transition-colors">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />{h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" loading={loading} size="lg" className="px-8">
                {loading ? "" : "Search"}
              </Button>
            </div>

            {/* Mode pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-600">Mode:</span>
              {SEARCH_MODES.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setMode(id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    mode === id
                      ? "text-green-700 border-green-500/40 bg-green-500/15"
                      : "text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300")}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </form>
        </Card>

        <div className="flex gap-5">
          {/* ── Filters sidebar ── */}
          <div className="w-44 shrink-0 space-y-4">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters
            </p>
            {[
              { label: "Department", opts: DEPARTMENTS, val: deptFilter, set: setDeptFilter },
              { label: "File Type",  opts: FILE_TYPES,  val: typeFilter,  set: setTypeFilter  },
            ].map(({ label, opts, val, set }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">{label}</p>
                {opts.map((o) => (
                  <button key={o} onClick={() => set(o)}
                    className={cn("flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors text-left",
                      val === o ? "text-green-700 bg-green-500/10" : "text-slate-500 hover:text-slate-700")}>
                    <span className={cn("w-2 h-2 rounded-full border", val === o ? "border-green-600 bg-green-600" : "border-slate-400")} />
                    <span className="truncate">{o}</span>
                  </button>
                ))}
              </div>
            ))}

            {/* Min relevance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Min Match</p>
                <span className="text-[10px] text-green-600 font-medium">{minRel}%</span>
              </div>
              <input type="range" min={0} max={90} step={5} value={minRel}
                onChange={(e) => setMinRel(parseInt(e.target.value))}
                className="w-full accent-green-600" />
            </div>

            {/* Feature 5: Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <button onClick={() => setShowSaved((p) => !p)}
                  className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1 w-full hover:text-green-400 transition-colors">
                  <Star className="w-3 h-3" /> Saved ({savedSearches.length})
                  {showSaved ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {showSaved && savedSearches.map((s) => (
                  <button key={s} onClick={() => doSearch(s)}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-500 hover:text-green-400 hover:bg-green-500/5 rounded-lg transition-colors truncate flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Results area ── */}
          <div className="flex-1 space-y-3">

            {/* Empty state */}
            {!searched && !loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(45,106,79,0.1)", border: "1px solid rgba(45,106,79,0.2)" }}>
                  <Search className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-400 mb-2">Enterprise Knowledge Search</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                  Hybrid semantic + keyword retrieval across all indexed documents
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["remote work policy", "leave entitlements", "API architecture", "security compliance", "Q4 financial"].map((q) => (
                    <button key={q} onClick={() => doSearch(q)}
                      className="px-3 py-1.5 text-xs rounded-full text-slate-500 hover:text-green-700 transition-all"
                      style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(45,106,79,0.15)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                <span className="text-sm">Searching with {mode} retrieval...</span>
              </div>
            )}

            {/* Results toolbar */}
            {searched && !loading && (
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <p className="text-xs text-slate-500">
                  <span className="text-slate-300 font-medium">{results.length}</span> results
                  {searchTime && <span className="text-slate-700 ml-2">· {searchTime}ms</span>}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info" className="text-[10px]">{mode} · reranked</Badge>

                  {/* Feature 5: Save search */}
                  {query && (
                    <button onClick={() => toggleSavedSearch(query)}
                      className={cn("flex items-center gap-1 text-xs transition-colors",
                        savedSearches.includes(query) ? "text-amber-400" : "text-slate-500 hover:text-amber-400")}>
                      {savedSearches.includes(query)
                        ? <><Star className="w-3 h-3 fill-amber-400" /> Saved</>
                        : <><Star className="w-3 h-3" /> Save</>}
                    </button>
                  )}

                  {/* Feature 7: Sort */}
                  <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}
                    className="text-[11px] bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-400 focus:outline-none">
                    <option value="relevance">Sort: Relevance</option>
                    <option value="date">Sort: Date</option>
                    <option value="name">Sort: Name</option>
                    <option value="section">Sort: Section</option>
                  </select>
                  <button onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
                    {sortDir === "asc" ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
                  </button>

                  {/* Feature 3: Group */}
                  <select value={groupMode} onChange={(e) => setGroupMode(e.target.value as GroupMode)}
                    className="text-[11px] bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-400 focus:outline-none">
                    <option value="none">No grouping</option>
                    <option value="document">Group: Document</option>
                    <option value="department">Group: Department</option>
                  </select>

                  {/* Feature 4: Histogram */}
                  {results.length > 0 && (
                    <button onClick={() => setShowHistogram((p) => !p)}
                      className={cn("flex items-center gap-1 text-xs transition-colors",
                        showHistogram ? "text-green-400" : "text-slate-500 hover:text-slate-300")}>
                      <BarChart2 className="w-3 h-3" /> Stats
                    </button>
                  )}

                  {/* Feature 8: Export PDF */}
                  {results.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button onClick={handleExportPDF}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-400 transition-colors">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <button onClick={handleExportTxt}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        / TXT
                      </button>
                    </div>
                  )}

                  {/* Feature 6: Compare button */}
                  {compareIds.length === 2 && (
                    <button onClick={() => setShowCompare(true)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-lg transition-colors">
                      <Columns className="w-3 h-3" /> Compare 2
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Feature 4: Histogram panel */}
            {showHistogram && results.length > 0 && (
              <Card className="p-4 animate-fade-in">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <BarChart2 className="w-3 h-3 text-green-500" /> Relevance Distribution
                </p>
                <div className="flex items-end gap-2 h-16">
                  {histogramBuckets.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-600">{count}</span>
                      <div className="w-full rounded-t-sm bg-green-500/20 relative overflow-hidden"
                        style={{ height: `${(count / histMax) * 48}px`, minHeight: count > 0 ? "4px" : "0" }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-green-600 to-green-400 opacity-80" />
                      </div>
                      <span className="text-[9px] text-slate-600">{i * 20}–{(i + 1) * 20}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">Score buckets (0–100%)</p>
              </Card>
            )}

            {/* Feature 2: Search analytics */}
            {searched && !loading && results.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Avg Score",  value: `${(results.reduce((s, r) => s + r.relevance, 0) / results.length * 100).toFixed(0)}%` },
                  { label: "Departments", value: [...new Set(results.map((r) => r.department))].length.toString() },
                  { label: "Doc Types",  value: [...new Set(results.map((r) => r.type))].join(", ") },
                  { label: "Bookmarked", value: results.filter((r) => bookmarked.has(r.id)).length.toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]"
                    style={{ background: "rgba(45,106,79,0.06)", border: "1px solid rgba(45,106,79,0.12)" }}>
                    <span className="text-slate-600">{label}:</span>
                    <span className="text-green-500 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {searched && results.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-600">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results for &quot;{query}&quot;</p>
                <p className="text-xs mt-1">Try lowering minimum match or different keywords</p>
              </div>
            )}

            {/* Feature 6: Compare panel */}
            {showCompare && compareResults.length === 2 && (
              <Card className="p-4 animate-fade-in border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <Columns className="w-4 h-4" /> Comparing 2 Results
                  </p>
                  <button onClick={() => { setShowCompare(false); setCompareIds([]); }}
                    className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {compareResults.map((r) => (
                    <div key={r.id} className="space-y-2">
                      <p className="text-xs font-semibold text-slate-300">{r.document_name}</p>
                      <p className="text-[10px] text-slate-500">{r.section} · p.{r.page}</p>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", relColor(r.relevance))}
                          style={{ width: `${(r.relevance * 100).toFixed(0)}%` }} />
                      </div>
                      <p className="text-[10px] text-green-400 font-bold">{(r.relevance * 100).toFixed(0)}% match</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: r.excerpt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Results list (grouped or flat) */}
            {groupMode !== "none" && searched && !loading
              ? Object.entries(groupedResults).map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-slate-400">{group}</span>
                    <span className="text-[10px] text-slate-600">· {items.length} result{items.length > 1 ? "s" : ""}</span>
                    <div className="flex-1 h-px bg-slate-700/50" />
                  </div>
                  {items.map((r) => <ResultCard key={r.id} r={r} />)}
                </div>
              ))
              : sortedResults.map((r) => <ResultCard key={r.id} r={r} />)
            }
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
