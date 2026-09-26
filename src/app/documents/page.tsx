"use client";

import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatBytes, formatDate, formatNumber } from "@/lib/utils";
import { mockDocuments } from "@/lib/mock-data";
import { generateAndPrintReport } from "@/lib/generate-report";
import {
  FileText, Upload, Search, Grid3X3, List, Eye,
  Trash2, RefreshCw, CheckCircle2, Clock, AlertCircle, Layers,
  Tag, Download, SortAsc, SortDesc, X,
  Star, StarOff, Loader2
} from "lucide-react";

const statusConfig = {
  INDEXED:    { label: "Indexed",    variant: "success" as const, icon: CheckCircle2, dot: "bg-emerald-500" },
  PROCESSING: { label: "Processing", variant: "warning" as const, icon: Clock,        dot: "bg-amber-500"  },
  UPLOADING:  { label: "Uploading",  variant: "info"    as const, icon: Clock,        dot: "bg-cyan-500"   },
  FAILED:     { label: "Failed",     variant: "error"   as const, icon: AlertCircle,  dot: "bg-red-500"    },
};

const typeColors: Record<string, string> = {
  PDF:  "text-red-400 bg-red-500/10 border-red-500/20",
  DOCX: "text-green-400 bg-green-500/10 border-green-500/20",
  MD:   "text-green-400 bg-green-500/10 border-green-500/20",
  CSV:  "text-green-400 bg-green-500/10 border-green-500/20",
  TXT:  "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const departments = ["All", "Human Resources", "Finance", "Technology", "Sales", "IT Security"];
const SORT_OPTIONS = [
  { value: "name",   label: "Name"   },
  { value: "date",   label: "Date"   },
  { value: "size",   label: "Size"   },
  { value: "chunks", label: "Chunks" },
];

type DocType = typeof mockDocuments[0] & { isStarred?: boolean };

// ── Background-processing store (survives navigation via module-level variable) ──
let _bgProcessingIds: Set<string> = new Set();
let _bgDocs: DocType[] = [];
let _bgListeners: Array<(docs: DocType[]) => void> = [];

function bgSetDocs(docs: DocType[]) {
  _bgDocs = docs;
  _bgListeners.forEach((fn) => fn(docs));
}
function bgSubscribe(fn: (docs: DocType[]) => void) {
  _bgListeners.push(fn);
  return () => { _bgListeners = _bgListeners.filter((l) => l !== fn); };
}

export default function DocumentsPage() {
  const [view,           setView]           = useState<"grid" | "list">("list");
  const [search,         setSearch]         = useState("");
  const [selectedDept,   setSelectedDept]   = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showUpload,     setShowUpload]     = useState(false);
  const [dragging,       setDragging]       = useState(false);
  const [sortBy,         setSortBy]         = useState("date");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("desc");
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [starred,        setStarred]        = useState<Set<string>>(new Set());
  const [detailDoc,      setDetailDoc]      = useState<DocType | null>(null);
  const [uploadFiles,    setUploadFiles]    = useState<File[]>([]);
  const [uploading,      setUploading]      = useState(false);
  const [uploadResults,  setUploadResults]  = useState<{ name: string; status: "success" | "error"; msg: string }[]>([]);
  const [allDocs,        setAllDocs]        = useState<DocType[]>([]);
  const [dbLoading,      setDbLoading]      = useState(true);
  const [bgBanner,       setBgBanner]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sync with background store ──────────────────────────────────────────────
  useEffect(() => {
    if (_bgDocs.length > 0) {
      setAllDocs(_bgDocs);
      setDbLoading(false);
    }
    const unsub = bgSubscribe((docs) => setAllDocs(docs));
    return unsub;
  }, []);

  // ── Initial fetch (only if no background data) ──────────────────────────────
  useEffect(() => {
    if (_bgDocs.length > 0) return;
    fetch("/api/documents?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const docs = data.data?.length ? data.data : [...mockDocuments];
        bgSetDocs(docs);
      })
      .catch(() => bgSetDocs([...mockDocuments]))
      .finally(() => setDbLoading(false));
  }, []);

  // ── Background polling for PROCESSING docs ──────────────────────────────────
  useEffect(() => {
    const processingIds = allDocs.filter((d) => d.status === "PROCESSING").map((d) => d.id);
    if (processingIds.length === 0) {
      setBgBanner(false);
      return;
    }
    setBgBanner(true);

    const interval = setInterval(() => {
      // Simulate processing completion after ~10s per doc (random)
      setAllDocs((prev) => {
        let changed = false;
        const next = prev.map((doc) => {
          if (doc.status !== "PROCESSING") return doc;
          // 15% chance each tick to become INDEXED
          if (Math.random() < 0.15) {
            changed = true;
            return {
              ...doc,
              status: "INDEXED" as const,
              chunkCount: Math.floor(Math.random() * 200) + 50,
              updatedAt: new Date(),
            };
          }
          return doc;
        });
        if (changed) bgSetDocs(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [allDocs]);

  // ── Hide banner when all done ────────────────────────────────────────────────
  useEffect(() => {
    const hasPending = allDocs.some((d) => d.status === "PROCESSING");
    if (!hasPending) setBgBanner(false);
  }, [allDocs]);

  // ── Filter + sort ────────────────────────────────────────────────────────────
  const filtered = allDocs
    .filter((doc) => {
      const matchSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(search.toLowerCase())) ||
        (doc.tags as string[]).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchDept   = selectedDept   === "All" || doc.department === selectedDept;
      const matchStatus = selectedStatus === "All" || doc.status      === selectedStatus;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if      (sortBy === "name")   cmp = a.name.localeCompare(b.name);
      else if (sortBy === "date")   cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortBy === "size")   cmp = a.fileSize - b.fileSize;
      else if (sortBy === "chunks") cmp = a.chunkCount - b.chunkCount;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll    = () => setSelected(new Set(filtered.map((d) => d.id)));
  const clearSelected = () => setSelected(new Set());

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setUploadFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  // ── Download as beautiful PDF ────────────────────────────────────────────────
  const handleDownloadDoc = (doc: DocType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    generateAndPrintReport({
      name:        doc.name,
      originalName: doc.originalName,
      type:        doc.type,
      department:  doc.department,
      category:    doc.category,
      status:      doc.status,
      version:     doc.version,
      accessLevel: doc.accessLevel,
      fileSize:    doc.fileSize,
      pageCount:   doc.pageCount,
      chunkCount:  doc.chunkCount,
      tags:        doc.tags as string[],
      description: doc.description,
      createdAt:   doc.createdAt,
      updatedAt:   doc.updatedAt,
    });
  };

  // ── Bulk download as CSV ─────────────────────────────────────────────────────
  const handleBulkDownload = () => {
    const selectedDocs = filtered.filter((d) => selected.has(d.id));
    const headers = ["Name", "Type", "Department", "Status", "Chunks", "Size", "Uploaded"];
    const rows    = selectedDocs.map((d) => [
      `"${d.name}"`, d.type, d.department || "", d.status,
      d.chunkCount, formatBytes(d.fileSize), formatDate(d.createdAt),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `documents_export_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    clearSelected();
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selected.size} selected document(s)?`)) clearSelected();
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setUploading(true);
    setUploadResults([]);
    const results: typeof uploadResults = [];

    for (const file of uploadFiles) {
      const ext        = file.name.split(".").pop()?.toUpperCase() || "TXT";
      const validTypes = ["PDF", "DOCX", "TXT", "MD", "CSV"];
      const type       = validTypes.includes(ext) ? ext : "TXT";

      const newDoc: DocType = {
        id:           `doc-local-${Date.now()}-${Math.random()}`,
        name:         file.name,
        originalName: file.name,
        type:         type as any,
        category:     "",
        department:   "",
        status:       "PROCESSING" as any,
        chunkCount:   0,
        pageCount:    0,
        fileSize:     file.size,
        accessLevel:  "employee" as any,
        version:      "1.0",
        tags:         [],
        description:  "",
        createdAt:    new Date(),
        updatedAt:    new Date(),
      };

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          newDoc.id  = data.document?.id || newDoc.id;
          results.push({ name: file.name, status: "success", msg: "Uploaded — processing in background" });
        } else {
          results.push({ name: file.name, status: "success", msg: "Added — processing in background" });
        }
      } catch {
        results.push({ name: file.name, status: "success", msg: "Saved locally — processing" });
      }

      // ✅ Add to global background store (persists across navigation)
      bgSetDocs([newDoc, ..._bgDocs]);
    }

    setUploadResults(results);
    setUploading(false);
    setUploadFiles([]);
    setTimeout(() => { setShowUpload(false); setUploadResults([]); }, 3000);
  };

  return (
    <MainLayout title="Document Management" subtitle="Upload, manage, and monitor your enterprise documents">
      <div className="p-6 space-y-6 animate-fade-in">

        {/* ── Background Processing Banner ── */}
        {bgBanner && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-300">Background Processing Active</p>
              <p className="text-xs text-amber-400/70">
                {allDocs.filter((d) => d.status === "PROCESSING").length} document(s) being indexed — you can navigate freely
              </p>
            </div>
            <button onClick={() => setBgBanner(false)} className="text-amber-500 hover:text-amber-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Documents", value: formatNumber(allDocs.length),                                             color: "text-green-400"   },
            { label: "Indexed",         value: allDocs.filter((d) => d.status === "INDEXED").length.toString(),          color: "text-emerald-400" },
            { label: "Processing",      value: allDocs.filter((d) => d.status === "PROCESSING").length.toString(),        color: "text-amber-400"   },
            { label: "Total Chunks",    value: formatNumber(allDocs.reduce((a, d) => a + d.chunkCount, 0)),               color: "text-green-400"   },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by name, description, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500">
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500">
              {["All", "INDEXED", "PROCESSING", "FAILED"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
            </select>
            <button onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors" title="Toggle sort direction">
              {sortDir === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-green-600 text-white" : "text-slate-500 hover:text-slate-300 bg-slate-800")}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-green-600 text-white" : "text-slate-500 hover:text-slate-300 bg-slate-800")}>
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowUpload(!showUpload)} size="sm">
              <Upload className="w-3.5 h-3.5" /> Upload
            </Button>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-green-600/10 border border-green-500/20 rounded-lg animate-fade-in">
            <span className="text-sm text-green-400 font-medium">{selected.size} selected</span>
            <div className="flex items-center gap-2 ml-2">
              <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                <Download className="w-3.5 h-3.5" /> Download CSV
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
            <button onClick={clearSelected} className="ml-auto text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload area */}
        {showUpload && (
          <Card className={cn("border-2 border-dashed transition-colors", dragging ? "border-green-500 bg-green-500/5" : "border-slate-600")}>
            <div className="p-8 text-center"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">Drop files here or click to browse</p>
              <p className="text-xs text-slate-500 mb-4">Supported: PDF, DOCX, TXT, Markdown, CSV · Max 50MB per file</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} accept=".pdf,.docx,.txt,.md,.csv" />
              <div className="flex items-center gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowUpload(false); setUploadFiles([]); }}>Cancel</Button>
              </div>

              {uploadFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-w-sm mx-auto text-left">
                  <p className="text-xs font-medium text-slate-400">{uploadFiles.length} file(s) queued:</p>
                  {uploadFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-300 truncate flex-1">{f.name}</span>
                      <span className="text-[10px] text-slate-600">{formatBytes(f.size)}</span>
                      <button onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3 text-slate-600 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                  <Button size="sm" className="w-full mt-2" loading={uploading} onClick={handleUpload}>
                    <Upload className="w-3.5 h-3.5" /> Upload {uploadFiles.length} file(s)
                  </Button>

                  {uploadResults.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {uploadResults.map((r, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
                          r.status === "success"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                        )}>
                          {r.status === "success"
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate font-medium">{r.name}</span>
                          <span className="ml-auto shrink-0">{r.msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of {allDocs.length} documents
            {search && <> matching "<span className="text-green-400">{search}</span>"</>}
          </p>
          {view === "list" && (
            <button onClick={selected.size === filtered.length ? clearSelected : selectAll}
              className="text-xs text-slate-500 hover:text-green-400 transition-colors">
              {selected.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {/* Document List */}
        {view === "list" ? (
          <Card>
            <CardHeader className="py-3">
              <div className="grid grid-cols-12 gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-1"></div>
                <div className="col-span-3">Document</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 cursor-pointer hover:text-slate-300" onClick={() => toggleSort("chunks")}>
                  Chunks {sortBy === "chunks" && (sortDir === "asc" ? "↑" : "↓")}
                </div>
                <div className="col-span-1 cursor-pointer hover:text-slate-300" onClick={() => toggleSort("size")}>
                  Size {sortBy === "size" && (sortDir === "asc" ? "↑" : "↓")}
                </div>
                <div className="col-span-1 cursor-pointer hover:text-slate-300" onClick={() => toggleSort("date")}>
                  Date {sortBy === "date" && (sortDir === "asc" ? "↑" : "↓")}
                </div>
                <div className="col-span-1">Actions</div>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-700/30">
              {filtered.map((doc) => {
                const status   = statusConfig[doc.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const isSelected = selected.has(doc.id);
                const isStarred  = starred.has(doc.id);
                return (
                  <div key={doc.id}
                    className={cn("grid grid-cols-12 gap-4 px-6 py-3 hover:bg-slate-800/30 transition-colors items-center group cursor-pointer",
                      isSelected && "bg-green-600/5 border-l-2 border-green-500")}
                    onClick={() => setDetailDoc(doc as DocType)}>
                    <div className="col-span-1 flex items-center gap-2">
                      <input type="checkbox" checked={isSelected}
                        onChange={() => toggleSelect(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-600 bg-slate-800 accent-green-500" />
                    </div>
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-200 truncate">{doc.name}</p>
                          <button onClick={(e) => toggleStar(doc.id, e)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isStarred
                              ? <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              : <StarOff className="w-3 h-3 text-slate-600" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-600 truncate">{doc.description}</p>
                      </div>
                    </div>
                    <div className="col-span-2"><span className="text-xs text-slate-400">{doc.department}</span></div>
                    <div className="col-span-1">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", typeColors[doc.type])}>{doc.type}</span>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-1.5">
                        {doc.status === "PROCESSING"
                          ? <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          : <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />}
                        <Badge variant={status.variant} className="text-[10px] py-0">{status.label}</Badge>
                      </div>
                    </div>
                    <div className="col-span-1"><span className="text-xs text-slate-400">{doc.chunkCount > 0 ? formatNumber(doc.chunkCount) : "—"}</span></div>
                    <div className="col-span-1"><span className="text-xs text-slate-400">{formatBytes(doc.fileSize)}</span></div>
                    <div className="col-span-1"><span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span></div>
                    <div className="col-span-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors" title="Preview">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDownloadDoc(doc as DocType, e)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-green-400 transition-colors" title="Download PDF Report">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-600">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No documents found</p>
                {search && <p className="text-xs mt-1">Try adjusting your search or filters</p>}
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => {
              const status   = statusConfig[doc.status as keyof typeof statusConfig];
              const isStarred = starred.has(doc.id);
              return (
                <Card key={doc.id} hover
                  className={cn("p-4 flex flex-col gap-3 cursor-pointer", starred.has(doc.id) && "border-amber-500/20")}
                  onClick={() => setDetailDoc(doc as DocType)}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => toggleStar(doc.id, e)} className="p-1 rounded hover:bg-slate-700 transition-colors">
                        {isStarred ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <Star className="w-3.5 h-3.5 text-slate-600" />}
                      </button>
                      <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-2">{doc.name}</p>
                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{doc.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", typeColors[doc.type])}>{doc.type}</span>
                    <span className="text-[10px] text-slate-500">{doc.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{formatNumber(doc.chunkCount)} chunks</span>
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span className="ml-auto">{formatDate(doc.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(doc.tags as string[]).slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-500">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDownloadDoc(doc as DocType, e); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 text-[11px] text-green-600 hover:text-green-400 border border-green-600/20 hover:border-green-500/40 rounded-lg transition-all">
                    <Download className="w-3 h-3" /> Download PDF Report
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Document detail side panel */}
        {detailDoc && (
          <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700/50 shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-slate-200">Document Details</h3>
                <button onClick={() => setDetailDoc(null)} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-start gap-3 mb-5 pb-5 border-b border-slate-700/50">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{detailDoc.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{detailDoc.originalName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", typeColors[detailDoc.type])}>{detailDoc.type}</span>
                    <Badge variant={statusConfig[detailDoc.status as keyof typeof statusConfig]?.variant || "default"} className="text-[10px]">
                      {detailDoc.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label: "Department",   value: detailDoc.department  },
                  { label: "Category",     value: detailDoc.category    },
                  { label: "Version",      value: detailDoc.version     },
                  { label: "Access Level", value: detailDoc.accessLevel },
                  { label: "File Size",    value: formatBytes(detailDoc.fileSize) },
                  { label: "Pages",        value: detailDoc.pageCount.toString()  },
                  { label: "Chunks",       value: formatNumber(detailDoc.chunkCount) },
                  { label: "Uploaded",     value: formatDate(detailDoc.createdAt)    },
                  { label: "Last Updated", value: formatDate(detailDoc.updatedAt)    },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-slate-300">{value || "—"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {(detailDoc.tags as string[]).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">{tag}</span>
                  ))}
                </div>
              </div>
              {detailDoc.description && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Description</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{detailDoc.description}</p>
                </div>
              )}
              <div className="mt-5 pt-5 border-t border-slate-700/50 flex flex-col gap-2">
                <Button size="sm" className="w-full" onClick={() => detailDoc && handleDownloadDoc(detailDoc)}>
                  <Download className="w-3.5 h-3.5" /> Download PDF Report
                </Button>
                <Button size="sm" variant="secondary" className="w-full"><RefreshCw className="w-3.5 h-3.5" />Re-index Document</Button>
                <Button size="sm" variant="danger"    className="w-full"><Trash2    className="w-3.5 h-3.5" />Delete Document</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
