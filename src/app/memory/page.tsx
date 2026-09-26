"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { mockConversations, mockMessages } from "@/lib/mock-data";
import {
  Brain, MessageSquare, Pin, Archive, Trash2, Search,
  Plus, Star, Clock, ChevronRight, Bot, User, Folder
} from "lucide-react";

const conversationCategories = ["All", "HR", "Engineering", "Finance", "Security", "Favorites", "Archived"];

export default function MemoryPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = mockConversations.filter((c) => {
    if (catFilter === "Favorites") return c.isPinned;
    if (catFilter === "Archived") return c.isArchived;
    const cat = catFilter === "All" ? true : c.category === catFilter;
    const notArchived = catFilter !== "All" || !c.isArchived;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return cat && notArchived && matchSearch;
  });

  const conv = mockConversations.find((c) => c.id === selectedConv);

  return (
    <MainLayout title="Memory & Conversations" subtitle="Your conversation history and AI memory management">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Conversations", value: mockConversations.length.toString(), icon: MessageSquare, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Pinned", value: mockConversations.filter((c) => c.isPinned).length.toString(), icon: Pin, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Archived", value: mockConversations.filter((c) => c.isArchived).length.toString(), icon: Archive, color: "text-slate-400", bg: "bg-slate-500/10" },
            { label: "Memory Contexts", value: "18", icon: Brain, color: "text-green-400", bg: "bg-green-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <p className="text-xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 shrink-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-3.5 h-3.5" /> New Conversation
            </Button>

            {/* Category filters */}
            <div className="space-y-0.5">
              {conversationCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                    catFilter === cat ? "bg-green-600/20 text-green-400" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                  )}
                >
                  {cat === "Favorites" && <Star className="w-3 h-3" />}
                  {cat === "Archived" && <Archive className="w-3 h-3" />}
                  {!["Favorites", "Archived"].includes(cat) && <Folder className="w-3 h-3" />}
                  {cat}
                  {cat === "All" && <span className="ml-auto text-slate-700">{mockConversations.filter((c) => !c.isArchived).length}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <Card
                  key={conv.id}
                  hover
                  onClick={() => setSelectedConv(conv.id === selectedConv ? null : conv.id)}
                  className={cn("p-4 transition-all", selectedConv === conv.id && "border-green-500/40")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {conv.isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                        <p className="text-sm font-medium text-slate-200 truncate">{conv.title}</p>
                        {conv.isArchived && <Badge variant="outline" className="text-[10px] py-0">Archived</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5" />{conv.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" />{conv.messageCount} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{timeAgo(conv.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-amber-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-slate-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-slate-600 shrink-0 transition-transform", selectedConv === conv.id && "rotate-90")} />
                  </div>

                  {/* Expanded preview */}
                  {selectedConv === conv.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2 animate-fade-in">
                      {mockMessages.filter((m) => m.conversationId === conv.id).map((msg) => (
                        <div key={msg.id} className={cn("flex items-start gap-2", msg.role === "user" ? "justify-end" : "")}>
                          {msg.role === "assistant" && (
                            <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                              <Bot className="w-3 h-3 text-green-400" />
                            </div>
                          )}
                          <div className={cn("max-w-sm rounded-lg px-3 py-2 text-xs",
                            msg.role === "user" ? "bg-green-600/20 border border-green-500/30 text-slate-300" : "bg-slate-800 border border-slate-700 text-slate-400"
                          )}>
                            {msg.content.length > 150 ? msg.content.slice(0, 150) + "..." : msg.content}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" className="w-full mt-2 text-green-400">
                        Continue conversation →
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
