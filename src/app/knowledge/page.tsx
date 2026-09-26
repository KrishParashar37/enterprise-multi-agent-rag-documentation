"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatNumber, formatBytes, formatDate } from "@/lib/utils";
import { mockDocuments } from "@/lib/mock-data";
import { useTheme } from "next-themes";
import {
  BookOpen, Folder, FileText, Search, Upload, ChevronRight,
  Tag, Layers, Lock, Globe, Users, Star, X, Loader2,
  TrendingUp, Clock, Hash, CheckCircle2, AlertTriangle, Bell, Database, PieChart as PieChartIcon
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from "recharts";

const categories = [
  { name: "HR", icon: Users, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", folders: ["Policies", "Employee Handbook", "Benefits", "Training"], docCount: 24, sparkData: [10,20,15,30,25,40,35] },
  { name: "Engineering", icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", folders: ["Architecture", "API Docs", "Runbooks", "Security"], docCount: 38, sparkData: [40,35,45,50,45,60,55] },
  { name: "Finance", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", folders: ["Reports", "Policies", "Budgets", "Forecasts"], docCount: 15, sparkData: [5,10,8,15,12,20,18] },
  { name: "Sales", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", folders: ["Playbooks", "Decks", "Data", "Competitive"], docCount: 29, sparkData: [20,15,25,30,20,35,40] },
  { name: "Legal", icon: Lock, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", folders: ["Contracts", "Compliance", "Policies"], docCount: 11, sparkData: [2,4,3,8,5,10,7] },
  { name: "Marketing", icon: Star, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", folders: ["Campaigns", "Assets", "Guidelines"], docCount: 19, sparkData: [15,25,20,35,30,45,40] },
];

const QUICK_FILTERS = ["HR Policies", "API Docs", "Financial Reports", "Compliance", "Remote Work", "Security"];

// 1. Live Indexing Hook
function useKnowledgeSimulation(initialDocsCount: number, initialChunks: number, initialStorage: number) {
  const [metrics, setMetrics] = useState({ docs: initialDocsCount, chunks: initialChunks, storage: initialStorage });
  const [activeReaders, setActiveReaders] = useState<Record<string, number>>({});
  const [processingQueue, setProcessingQueue] = useState<any[]>([
    { id: 'q1', name: 'Q3_Financial_Review.pdf', progress: 45, status: 'processing' },
    { id: 'q2', name: 'Security_Audit_2026.docx', progress: 80, status: 'processing' }
  ]);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);

  useEffect(() => {
    // Tick Metrics
    const metricsInterval = setInterval(() => {
      setMetrics(prev => ({
        docs: prev.docs + (Math.random() > 0.8 ? 1 : 0),
        chunks: prev.chunks + Math.floor(Math.random() * 5),
        storage: prev.storage + Math.floor(Math.random() * 1024 * 50) // add 50kb approx
      }));
    }, 2500);

    // Tick Progress bars
    const progressInterval = setInterval(() => {
      setProcessingQueue(prev => prev.map(item => {
        if (item.progress >= 100) return item;
        const newProgress = Math.min(100, item.progress + Math.floor(Math.random() * 15));
        return { ...item, progress: newProgress, status: newProgress === 100 ? 'done' : 'processing' };
      }).filter(item => item.progress < 100 || Math.random() > 0.2)); // Keep 'done' for a moment then remove
    }, 1500);

    // Random Readers count
    const readersInterval = setInterval(() => {
      const newReaders: Record<string, number> = {};
      mockDocuments.slice(0, 5).forEach(d => {
        newReaders[d.id] = Math.max(1, Math.floor(Math.random() * 15));
      });
      setActiveReaders(newReaders);
    }, 4000);

    // Random Notifications
    const eventInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const events = [
          { msg: "New API Runbook synced from Confluence", type: "info" },
          { msg: "Stale document 'Q1_Plan' archived automatically", type: "warning" },
          { msg: "Sales Deck 2026 fully vectorized", type: "success" }
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const id = Date.now();
        setNotifications(prev => [...prev, { id, ...randomEvent }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
      }
    }, 7000);

    return () => { clearInterval(metricsInterval); clearInterval(progressInterval); clearInterval(readersInterval); clearInterval(eventInterval); };
  }, []);

  return { metrics, processingQueue, activeReaders, notifications, dismissToast: (id: number) => setNotifications(p => p.filter(n => n.id !== id)) };
}

export default function KnowledgePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  
  // Drill-down Modal State
  const [drillDownDoc, setDrillDownDoc] = useState<any | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const initialDocs = mockDocuments.length + 12834;
  const initialChunks = mockDocuments.reduce((a, d) => a + d.chunkCount, 0) + 48291;
  const initialStorage = 1024 * 1024 * 1024 * 2.4; // 2.4GB

  const { metrics, processingQueue, activeReaders, notifications, dismissToast } = useKnowledgeSimulation(initialDocs, initialChunks, initialStorage);

  const recentDocs = mockDocuments.filter((d) => d.status === "INDEXED").slice(0, 5);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowAutocomplete(e.target.value.length > 0);
  };

  const executeSearch = (q: string) => {
    setSearch(q);
    setShowAutocomplete(false);
    setSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      const qLower = q.toLowerCase();
      const localResults = mockDocuments
        .filter((d) => d.name.toLowerCase().includes(qLower) || d.description?.toLowerCase().includes(qLower) || (d.tags as string[]).some((t) => t.toLowerCase().includes(qLower)))
        .map((d, i) => ({
          id: d.id, documentName: d.name, department: d.department || "", type: d.type,
          page: 1, section: "General", excerpt: `Found matching context inside **${d.name}**. ` + (d.description || "Contains relevant vector embeddings matching your query semantics."),
          relevance: Math.max(0.5, 1 - i * 0.08), date: formatDate(d.createdAt),
          rawDoc: d
        }));
      setResults(localResults);
      setSearching(false);
      setHasSearched(true);
    }, 600);
  };

  // Keyboard support for autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search) {
      executeSearch(search);
    }
  };

  return (
    <MainLayout title="Knowledge Hub" subtitle="Organize and explore your enterprise knowledge base">
      <div className="p-6 space-y-6 animate-fade-in relative pb-20">

        {/* 7. Knowledge Toast System */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map(toast => (
            <div key={toast.id} className={cn("pointer-events-auto flex items-center justify-between gap-4 px-4 py-3 rounded-lg shadow-lg border text-sm text-white max-w-sm animate-in slide-in-from-right",
              toast.type === 'error' ? 'bg-rose-600 border-rose-500' : 
              toast.type === 'warning' ? 'bg-amber-500 border-amber-400' : 
              'bg-slate-800 border-slate-700'
            )}>
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : toast.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400"/> : <Bell className="w-4 h-4 text-sky-400" />}
                <p>{toast.msg}</p>
              </div>
              <button onClick={() => dismissToast(toast.id)} className="hover:opacity-70"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>

        {/* 5. Interactive Document Drill-Down Modal */}
        {drillDownDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pb-4">
                <div>
                  <CardTitle className="text-xl">{drillDownDoc.name}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{drillDownDoc.description}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{drillDownDoc.department}</Badge>
                    <Badge variant="outline">{drillDownDoc.type}</Badge>
                    {(drillDownDoc.tags as string[]).map(t => <Badge key={t} variant="outline" className="bg-slate-100 dark:bg-slate-800">{t}</Badge>)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDrillDownDoc(null)}><X className="w-5 h-5"/></Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4"/> Vector Distribution</h4>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{name: 'Text', value: 60}, {name: 'Tables', value: 25}, {name: 'Images', value: 15}]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', background: isDark ? '#1e293b' : '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><Database className="w-4 h-4"/> Ingestion Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border dark:border-slate-800">
                        <p className="text-xs text-slate-500 mb-1">Chunks</p>
                        <p className="text-lg font-bold">{formatNumber(drillDownDoc.chunkCount)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border dark:border-slate-800">
                        <p className="text-xs text-slate-500 mb-1">Size</p>
                        <p className="text-lg font-bold">{formatBytes(drillDownDoc.fileSize)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border dark:border-slate-800">
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className="text-sm font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Indexed</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border dark:border-slate-800">
                        <p className="text-xs text-slate-500 mb-1">Added</p>
                        <p className="text-sm font-bold">{formatDate(drillDownDoc.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDrillDownDoc(null)}>Close</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Search className="w-4 h-4 mr-2"/> Ask questions about this doc</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hero search */}
        <div className="rounded-2xl p-6 relative overflow-visible aurora-bg" style={{ border: "1px solid rgba(45,106,79,0.2)" }}>
          <div className="relative z-20">
            <h3 className="text-lg font-bold mb-1 gradient-text">Enterprise Knowledge Base</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              Live Indexing: <span className="font-medium text-slate-800 dark:text-slate-200">{formatNumber(metrics.chunks)}</span> chunks available
            </p>
            
            <div className="max-w-2xl relative">
              <Input
                placeholder="Search policies, reports, docs, procedures..."
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {if(search) setShowAutocomplete(true)}}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                icon={searching ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <Search className="w-5 h-5 text-slate-400" />}
                className="text-base h-12 shadow-sm border-slate-300 dark:border-slate-700 focus-visible:ring-emerald-500"
              />
              {search && (
                <button onClick={() => { setSearch(""); setResults([]); setHasSearched(false); setShowAutocomplete(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* 8. Live Search Autocomplete Dropdown */}
              {showAutocomplete && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">Press Enter to perform full semantic search</p>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-400 px-2 py-1 mb-1">Quick Suggestions</p>
                    {mockDocuments.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).slice(0,3).map(d => (
                      <div key={d.id} onClick={() => setDrillDownDoc(d)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{d.name}</span>
                      </div>
                    ))}
                    {mockDocuments.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">No quick matches found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 9. Interactive Tag Filtering */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Trending Topics:</span>
              {QUICK_FILTERS.map((tag) => (
                <button key={tag} onClick={() => executeSearch(tag)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all shadow-sm",
                    search === tag
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {results.length > 0
                  ? <><span className="text-emerald-500">{results.length}</span> results for "<span className="text-slate-900 dark:text-slate-100">{search}</span>"</>
                  : <>No results for "<span className="text-slate-900 dark:text-slate-100">{search}</span>"</>}
              </p>
              <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-200 shadow-sm">Hybrid Vector Search</Badge>
            </div>
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((r) => (
                  <Card key={r.id} hover onClick={() => setDrillDownDoc(r.rawDoc)} className="p-5 cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600 transition-colors">{r.documentName}</span>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800">Page {r.page}</Badge>
                        </div>
                        {/* 10. Theme-Aware Highlight Context */}
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: r.excerpt.replace(/\*\*(.*?)\*\*/g, isDark ? '<strong class="text-emerald-300 bg-emerald-900/30 px-1 rounded">$1</strong>' : '<strong class="text-emerald-700 bg-emerald-100 px-1 rounded">$1</strong>') }} />
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Folder className="w-3 h-3"/> {r.department}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {r.date}</span>
                          <span className={cn("ml-auto font-semibold flex items-center gap-1", r.relevance >= 0.9 ? "text-emerald-500" : "text-amber-500")}>
                            <TrendingUp className="w-3 h-3"/> {(r.relevance * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Search className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No knowledge matches found</p>
                <p className="text-sm text-slate-500 mt-1">Try tweaking your keywords or filters.</p>
              </div>
            )}
          </div>
        )}

        {/* Main Dashboard (when not searching) */}
        {!hasSearched && (
          <div className="animate-in fade-in duration-500 space-y-6">
            
            {/* Live Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Documents</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatNumber(metrics.docs)}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><FileText className="w-4 h-4 text-emerald-600"/></div>
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Vectorized Chunks</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatNumber(metrics.chunks)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><Hash className="w-4 h-4 text-blue-600"/></div>
                </div>
              </Card>
              {/* 6. Vector Storage Ticker */}
              <Card className="p-4 border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Vector Storage Used</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatBytes(metrics.storage)}</p>
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><Database className="w-4 h-4 text-indigo-600"/></div>
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Categories</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">6</p>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><Folder className="w-4 h-4 text-amber-600"/></div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Categories */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Knowledge Categories</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-600 text-xs">View All Maps <ChevronRight className="w-3 h-3 ml-1"/></Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <Card key={cat.name} hover
                      onClick={() => executeSearch(cat.name)}
                      className={cn("p-4 transition-all overflow-hidden relative group cursor-pointer border-slate-200 dark:border-slate-800")}>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", cat.bg, cat.border)}>
                            <cat.icon className={cn("w-5 h-5", cat.color)} />
                          </div>
                          {/* 4. Dynamic Category Activity Sparklines */}
                          <div className="h-8 w-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={cat.sparkData.map((v,i)=>({name:i, value: v + (Math.random()*10 - 5)}))}>
                                <Line type="monotone" dataKey="value" stroke={isDark ? '#cbd5e1' : '#94a3b8'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{cat.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-3">{cat.docCount} active documents</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.folders.slice(0, 3).map((folder) => (
                            <Badge key={folder} variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal hover:bg-slate-200">
                              {folder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column: Processing & Recent */}
              <div className="space-y-6">
                
                {/* 2. Real-Time Processing Queue */}
                <Card>
                  <CardHeader className="pb-3 border-b dark:border-slate-800">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Active Indexing Queue
                      <Badge variant="outline" className="text-[10px] animate-pulse bg-emerald-50 text-emerald-600 border-emerald-200">Live</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {processingQueue.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">Queue is empty</p>
                    ) : (
                      processingQueue.map(item => (
                        <div key={item.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{item.name}</span>
                            <span className={item.status === 'done' ? 'text-emerald-500 font-bold' : 'text-slate-500'}>
                              {item.status === 'done' ? 'Done' : `${item.progress}%`}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-500", item.status === 'done' ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Recently Indexed with 3. Live Active Readers */}
                <Card>
                  <CardHeader className="pb-3 border-b dark:border-slate-800">
                    <CardTitle className="text-sm">Recently Indexed</CardTitle>
                  </CardHeader>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentDocs.map((doc) => (
                      <div key={doc.id} onClick={() => setDrillDownDoc(doc)}
                        className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">{doc.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-500">{doc.department}</span>
                            {/* Live Readers Badge */}
                            {activeReaders[doc.id] && (
                              <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 animate-in fade-in">
                                <Users className="w-2.5 h-2.5"/> {activeReaders[doc.id]} reading
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
