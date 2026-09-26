import { cn } from "@/lib/utils";
interface BadgeProps { children:React.ReactNode; variant?:"default"|"success"|"warning"|"error"|"info"|"outline"|"premium"; className?:string; }
const V = {
  default: "bg-gradient-to-r from-green-600/20 to-teal-600/15 text-green-700 border border-green-500/30",
  success: "bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.12)]",
  warning: "bg-gradient-to-r from-amber-500/20 to-yellow-500/15 text-amber-700 border border-amber-500/30",
  error:   "bg-gradient-to-r from-rose-500/20 to-red-500/15 text-rose-700 border border-rose-500/30",
  info:    "bg-gradient-to-r from-teal-500/20 to-cyan-500/15 text-teal-700 border border-teal-500/30",
  outline: "border border-slate-300 text-slate-500 bg-slate-100/40",
  premium: "bg-gradient-to-r from-green-600/25 to-teal-500/20 text-green-800 border border-green-400/35 shadow-[0_0_10px_rgba(45,106,79,0.15)]",
};
export function Badge({children,variant="default",className}:BadgeProps) {
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-[0.01em]",V[variant],className)}>{children}</span>;
}