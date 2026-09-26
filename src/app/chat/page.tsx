"use client";

import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Send, StopCircle, RefreshCw, Copy, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronRight, FileText, Bot, Brain, Search,
  CheckCircle2, Plus, Sparkles, User, Mic, MicOff,
  Download, Bookmark, BookmarkCheck, Pin, X,
  Volume2, Languages
} from "lucide-react";
import { mockConversations } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isBookmarked?: boolean;
  language?: string;
};

type ConvMessage = { role: "user" | "assistant"; content: string };

const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];
const MAX_CHARS = 2000;

const sampleQuestions = [
  "What is our employee leave policy for 2025?",
  "Explain our remote work guidelines",
  "What are the Q4 2024 financial highlights?",
  "Explain AI and Machine Learning concepts",
];

// ── Markdown renderer ──────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_: string, _lang: string, code: string) =>
      `<pre class="code-block"><code>${code.replace(/</g, "&lt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m: string) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

// ── Message bubble ─────────────────────────────────
function MessageBubble({
  msg,
  onBookmark,
  onDelete,
  onRegenerate,
}: {
  msg: Message;
  onBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(msg.content.replace(/[#*>`]/g, ""));
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  const handleExport = () => {
    const blob = new Blob([msg.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `response-${msg.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (msg.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end group">
        <div className="max-w-2xl">
          <div className="relative px-4 py-3 rounded-2xl rounded-tr-sm"
            style={{
              background: "linear-gradient(135deg, rgba(45,106,79,0.25), rgba(13,148,136,0.18))",
              border: "1px solid rgba(45,106,79,0.3)",
            }}>
            <p className="text-sm text-slate-700 leading-relaxed">{msg.content}</p>
            <button onClick={() => onDelete(msg.id)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-rose-500/40 hover:bg-rose-500/10">
              <X className="w-2.5 h-2.5 text-slate-400 hover:text-rose-400" />
            </button>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg,#40916c,#0d9488)", boxShadow: "0 2px 8px rgba(45,106,79,0.3)" }}>
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "linear-gradient(135deg, rgba(27,67,50,0.9), rgba(15,36,25,0.95))",
          border: "1px solid rgba(45,106,79,0.3)",
          boxShadow: "0 0 12px rgba(45,106,79,0.15)",
        }}>
        <Bot className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="flex-1 max-w-3xl">
        {/* Bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
          style={{
            background: "linear-gradient(135deg, rgba(27,67,50,0.92), rgba(15,36,25,0.96))",
            border: "1px solid rgba(45,106,79,0.14)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}>
          {msg.language && msg.language !== "English" && (
            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-green-700/40">
              <Languages className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400">{msg.language} translation</span>
            </div>
          )}
          <div
            className="text-sm text-slate-300 leading-relaxed ai-response"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
          {msg.isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 cursor-blink" />
          )}
        </div>

        {/* Actions */}
        {!msg.isStreaming && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {[
              { icon: copied ? CheckCircle2 : Copy, label: copied ? "Copied!" : "Copy", action: handleCopy, active: copied },
              { icon: ThumbsUp, label: "Good", action: () => setFeedback("up"), active: feedback === "up" },
              { icon: ThumbsDown, label: "Bad", action: () => setFeedback("down"), active: feedback === "down" },
              { icon: speaking ? StopCircle : Volume2, label: speaking ? "Stop" : "Listen", action: handleSpeak, active: speaking },
              { icon: Download, label: "Export", action: handleExport, active: false },
              { icon: msg.isBookmarked ? BookmarkCheck : Bookmark, label: msg.isBookmarked ? "Saved" : "Save", action: () => onBookmark(msg.id), active: !!msg.isBookmarked },
              { icon: RefreshCw, label: "Retry", action: () => onRegenerate(msg.id), active: false },
            ].map(({ icon: Icon, label, action, active }) => (
              <button key={label} onClick={action}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all",
                  active
                    ? "text-green-600 bg-green-500/15 border border-green-500/25"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Chat Page ─────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ConvMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [responseLang, setResponseLang] = useState("English");
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message with real Groq streaming ─────────
  const sendMessage = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || isLoading) return;

    setInput("");
    setSuggestions([]);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    const aiId = String(Date.now() + 1);
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    // Build history for context
    const newHistory: ConvMessage[] = [
      ...history,
      {
        role: "user", content: responseLang !== "English"
          ? `${query}\n\n[Please respond in ${responseLang}]`
          : query
      },
    ];

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text());

      // Read SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            full += parsed.content;
            setMessages((prev) =>
              prev.map((m) => m.id === aiId ? { ...m, content: full } : m)
            );
          } catch { /* skip malformed */ }
        }
      }

      // Finalize
      setMessages((prev) =>
        prev.map((m) => m.id === aiId
          ? { ...m, isStreaming: false, language: responseLang !== "English" ? responseLang : undefined }
          : m
        )
      );

      // Save to history
      setHistory([...newHistory, { role: "assistant", content: full }]);

      // Follow-up suggestions based on topic
      const q = query.toLowerCase();
      if (q.includes("leave") || q.includes("policy")) setSuggestions(["How many sick days can I carry over?", "What is sabbatical policy?", "How to apply for leave?"]);
      else if (q.includes("remote") || q.includes("work")) setSuggestions(["Is VPN required for remote work?", "What are the hybrid work rules?", "Can I work from abroad?"]);
      else if (q.includes("ai") || q.includes("ml")) setSuggestions(["Explain deep learning", "What is neural network?", "Difference between AI and ML?"]);
      else setSuggestions(["Tell me more about this", "Give me an example", "Summarize key points"]);

    } catch (err: any) {
      if (err?.name === "AbortError") {
        setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: m.content || "_(stopped)_", isStreaming: false } : m));
      } else {
        setMessages((prev) => prev.map((m) => m.id === aiId
          ? { ...m, content: `❌ Error: ${err?.message || "Failed to get response"}`, isStreaming: false }
          : m
        ));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleDelete = (id: string) => setMessages((p) => p.filter((m) => m.id !== id));
  const handleBookmark = (id: string) => setMessages((p) => p.map((m) => m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m));

  // Regenerate — re-send last user message
  const handleRegenerate = (aiId: string) => {
    const idx = messages.findIndex((m) => m.id === aiId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg?.role === "user") {
      setMessages((p) => p.filter((m) => m.id !== aiId));
      sendMessage(userMsg.content);
    }
  };

  // Voice input
  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setInput("Voice not supported in this browser."); return; }
    const rec = new SR();
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    setIsRecording(true);
    rec.start();
  };

  // Export conversation
  const handleExportConv = () => {
    const text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "conversation.txt"; a.click();
  };

  const displayMessages = showSearch && convSearch
    ? messages.filter((m) => m.content.toLowerCase().includes(convSearch.toLowerCase()))
    : messages;

  return (
    <MainLayout title="AI Chat" subtitle="Powered by Groq · llama-3.1-8b-instant">
      <div className="flex h-[calc(100vh-56px)]">

        {/* ── Conversation sidebar ── */}
        <div className="w-60 flex flex-col"
          style={{ borderRight: "1px solid rgba(45,106,79,0.12)", background: "rgba(220,232,225,0.6)" }}>

          <div className="p-3 space-y-2" style={{ borderBottom: "1px solid rgba(45,106,79,0.12)" }}>
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => { setMessages([]); setHistory([]); setSelectedConv(null); setSuggestions([]); }}>
              <Plus className="w-3.5 h-3.5" /> New Chat
            </Button>
            {/* Language selector */}
            <select value={responseLang} onChange={(e) => setResponseLang(e.target.value)}
              className="w-full rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-600"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(45,106,79,0.2)" }}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {mockConversations.filter((c) => !c.isArchived).map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                className={cn("w-full text-left px-3 py-2 rounded-xl text-xs transition-all",
                  selectedConv === conv.id
                    ? "text-green-800" : "text-slate-500 hover:text-slate-700"
                )}
                style={selectedConv === conv.id ? {
                  background: "linear-gradient(135deg, rgba(45,106,79,0.18), rgba(13,148,136,0.1))",
                  border: "1px solid rgba(45,106,79,0.28)",
                } : { border: "1px solid transparent" }}>
                <div className="flex items-center gap-2">
                  {conv.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                  <span className="truncate">{conv.title}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{conv.category}</div>
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <div className="p-2" style={{ borderTop: "1px solid rgba(45,106,79,0.12)" }}>
              <button onClick={handleExportConv}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export Chat
              </button>
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Search bar */}
          {showSearch && (
            <div className="flex items-center gap-2 px-4 py-2"
              style={{ background: "rgba(220,232,225,0.8)", borderBottom: "1px solid rgba(45,106,79,0.12)" }}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input autoFocus value={convSearch} onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search in conversation..."
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none" />
              <button onClick={() => { setShowSearch(false); setConvSearch(""); }}>
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
              {convSearch && <span className="text-[10px] text-slate-500">{displayMessages.length} found</span>}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {/* Hero */}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float"
                  style={{
                    background: "linear-gradient(135deg, rgba(45,106,79,0.2), rgba(13,148,136,0.15))",
                    border: "1px solid rgba(45,106,79,0.3)",
                    boxShadow: "0 0 30px rgba(45,106,79,0.15)",
                  }}>
                  <Bot className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 gradient-text">Enterprise AI Assistant</h3>
                <p className="text-sm text-slate-500 max-w-md mb-2">
                  Real AI powered by <span className="text-green-600 font-medium">Groq · llama-3.1-8b-instant</span>
                </p>
                <p className="text-xs text-slate-400 max-w-md mb-8">
                  Ask questions about company policies, documents, data, or any topic.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {sampleQuestions.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="text-left px-4 py-3 rounded-xl text-xs text-slate-500 hover:text-slate-700 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(45,106,79,0.15)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,106,79,0.35)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,106,79,0.15)"; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              displayMessages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg}
                  onBookmark={handleBookmark}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                />
              ))
            )}

            {/* Follow-up suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                <span className="text-[10px] text-slate-400 self-center">Suggested:</span>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full text-slate-500 hover:text-green-700 transition-all"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(45,106,79,0.2)" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ── */}
          <div className="p-4"
            style={{ borderTop: "1px solid rgba(45,106,79,0.12)", background: "rgba(220,232,225,0.7)" }}>
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything — powered by real Groq AI..."
                  rows={1}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(45,106,79,0.2)",
                    minHeight: "48px", maxHeight: "200px",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(45,106,79,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,106,79,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(45,106,79,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {input.length > 0 && (
                  <span className={cn("absolute bottom-2 right-3 text-[10px]",
                    input.length > MAX_CHARS * 0.9 ? "text-amber-500" : "text-slate-400")}>
                    {input.length}/{MAX_CHARS}
                  </span>
                )}
              </div>

              {/* Voice */}
              <Button onClick={handleVoice} variant={isRecording ? "danger" : "ghost"}
                size="icon" className="shrink-0 h-12 w-12" title="Voice input">
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Search in chat */}
              <Button onClick={() => setShowSearch(!showSearch)} variant="ghost"
                size="icon" className="shrink-0 h-12 w-12" title="Search chat">
                <Search className="w-4 h-4" />
              </Button>

              {/* Send / Stop */}
              <Button
                onClick={isLoading ? handleStop : () => sendMessage()}
                variant={isLoading ? "danger" : "primary"}
                size="icon" className="shrink-0 h-12 w-12"
                disabled={!isLoading && !input.trim()}>
                {isLoading ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2">
              Real AI · Groq · llama-3.1-8b-instant · Streaming responses
              {responseLang !== "English" && <span className="text-green-600 ml-2">· Responding in {responseLang}</span>}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
