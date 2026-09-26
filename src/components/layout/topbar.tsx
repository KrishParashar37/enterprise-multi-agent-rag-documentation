"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Bell, Search, Moon, Sun, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNotifications } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

const typeConfig = {
  success: { dot: "bg-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  error: { dot: "bg-red-500", bg: "bg-red-500/10 border-red-500/20" },
  warning: { dot: "bg-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  info: { dot: "bg-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const unread = mockNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Command palette hint */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors">
          <Search className="w-3 h-3" />
          <span>Search...</span>
          <span className="flex items-center gap-1 ml-1 px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        </button>

        {/* Theme */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</span>
                <span className="text-xs text-blue-400">{unread} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((n) => {
                  const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer",
                        !n.isRead && "bg-slate-50 dark:bg-slate-700/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", cfg.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700">
                <button className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 w-full text-center">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity">
          RS
        </div>
      </div>
    </header>
  );
}
