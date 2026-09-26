import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"|"danger"|"outline"|"premium";
  size?: "sm"|"md"|"lg"|"icon";
  loading?: boolean;
}
const V = {
  primary:   "bg-gradient-to-r from-green-800 via-green-700 to-teal-600 text-white shadow-[0_4px_14px_rgba(45,106,79,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-green-700 hover:to-teal-500 hover:shadow-[0_6px_22px_rgba(45,106,79,0.55)] hover:-translate-y-[1px] transition-all duration-200",
  secondary: "bg-gradient-to-r from-slate-800 to-slate-700 text-slate-200 border border-slate-600/60 hover:from-slate-700 hover:to-slate-600 hover:-translate-y-[1px] transition-all duration-200",
  ghost:     "bg-transparent text-slate-400 hover:bg-green-500/10 hover:text-slate-200 border border-transparent transition-all duration-200",
  danger:    "bg-gradient-to-r from-red-600/20 to-rose-600/20 text-red-400 border border-red-500/35 hover:from-red-600/30 hover:text-red-300 transition-all duration-200",
  outline:   "bg-transparent border border-green-600/40 text-slate-600 hover:bg-green-500/10 hover:border-green-500/70 hover:text-green-700 transition-all duration-200",
  premium:   "bg-gradient-to-r from-green-900 via-green-700 to-teal-600 text-white font-semibold shadow-[0_4px_20px_rgba(45,106,79,0.5)] hover:shadow-[0_8px_30px_rgba(45,106,79,0.65)] hover:-translate-y-[2px] transition-all duration-200",
};
const S = { sm:"px-3 py-1.5 text-xs rounded-lg gap-1.5", md:"px-4 py-2 text-sm rounded-xl gap-2", lg:"px-6 py-3 text-sm rounded-xl gap-2", icon:"p-2 rounded-xl" };
export function Button({variant="primary",size="md",loading,className,children,disabled,...props}:ButtonProps) {
  return (
    <button {...props} disabled={disabled||loading} className={cn("inline-flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",V[variant],S[size],className)}>
      {loading&&<svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
}