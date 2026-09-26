"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, MessageSquare, BookOpen, FileText, Bot, Search, BarChart2, FlaskConical, Activity, Brain, ShieldCheck, Settings, ChevronRight, Zap, LogOut, Cpu, CreditCard, ScrollText, PenTool, Users, Blocks, ThumbsUp, Key } from "lucide-react";
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "core" },
  { href: "/chat", label: "AI Chat", icon: MessageSquare, group: "core" },
  { href: "/knowledge", label: "Knowledge Hub", icon: BookOpen, group: "core" },
  { href: "/documents", label: "Documents", icon: FileText, group: "core" },
  { href: "/agents", label: "Agent Center", icon: Bot, group: "intelligence" },
  { href: "/search", label: "Smart Search", icon: Search, group: "intelligence" },
  { href: "/analytics", label: "Analytics", icon: BarChart2, group: "intelligence" },
  { href: "/evaluation", label: "Evaluation", icon: FlaskConical, group: "intelligence" },
  { href: "/prompts", label: "Prompts", icon: PenTool, group: "intelligence" },
  { href: "/feedback", label: "Feedback", icon: ThumbsUp, group: "intelligence" },
  { href: "/models", label: "Models", icon: Cpu, group: "intelligence" },
  { href: "/observability", label: "Observability", icon: Activity, group: "ops" },
  { href: "/memory", label: "Memory", icon: Brain, group: "ops" },
  { href: "/users", label: "Users", icon: Users, group: "ops" },
  { href: "/integrations", label: "Integrations", icon: Blocks, group: "ops" },
  { href: "/billing", label: "Billing", icon: CreditCard, group: "ops" },
  { href: "/api-keys", label: "API Keys", icon: Key, group: "ops" },
  { href: "/logs", label: "Logs", icon: ScrollText, group: "ops" },
  { href: "/admin", label: "Admin Console", icon: ShieldCheck, group: "ops" },
  { href: "/settings", label: "Settings", icon: Settings, group: "ops" },
];
const groups = [{ key: "core", label: "Platform" }, { key: "intelligence", label: "Intelligence" }, { key: "ops", label: "Operations" }];
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const handleLogout = async () => { await logout(); router.push("/login"); };
  const displayName = user?.name || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <aside className="w-64 flex flex-col h-full fixed left-0 top-0 z-30 overflow-hidden" style={{ background: "linear-gradient(180deg, #2D4A3E 0%, #243F34 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(64,145,108,0.08), transparent)" }} />
      <div className="relative px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#40916c 0%,#2dd4bf 100%)", boxShadow: "0 4px 14px rgba(45,106,79,0.5),inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white">Enterprise AI</h1>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(149,213,178,0.8)" }}>Multi-Agent RAG Platform</p>
          </div>
        </div>
      </div>
      <nav className="relative flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group.key);
          return (
            <div key={group.key}>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] px-3 mb-1.5" style={{ color: "rgba(149,213,178,0.5)" }}>{group.label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 group relative", isActive ? "text-white bg-white/10 border border-white/15" : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent")}>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "linear-gradient(180deg,#74c69d,#2dd4bf)" }} />}
                      <Icon className={cn("w-[15px] h-[15px] shrink-0", isActive ? "text-emerald-300" : "text-white/50 group-hover:text-white/80")} />
                      <span className="flex-1 font-medium">{label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "rgba(149,213,178,0.7)" }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="relative px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#40916c,#2dd4bf)", boxShadow: "0 0 0 2px rgba(82,183,136,0.35)" }}>
            <span className="text-white text-[11px] font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/90 truncate">{displayName}</p>
            <p className="text-[10px] text-white/50 truncate">{user?.email || "Administrator"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full status-live" />
            <button onClick={handleLogout} className="p-1 rounded-lg text-white/50 hover:text-rose-400 transition-colors"><LogOut className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </aside>
  );
}