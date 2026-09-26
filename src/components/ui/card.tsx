import { cn } from "@/lib/utils";
interface CardProps { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; glow?: boolean; premium?: boolean; }
export function Card({ children, className, hover, onClick, glow, premium }: CardProps) {
  return (
    <div onClick={onClick} className={cn("rounded-2xl transition-all duration-300", "bg-white", "border border-green-100", "backdrop-blur-xl", "shadow-[0_8px_24px_rgba(27,67,50,0.08)]", hover && ["hover:border-green-300", "hover:shadow-[0_12px_30px_rgba(27,67,50,0.14)]", "hover:-translate-y-[1px]", "cursor-pointer"], onClick && "cursor-pointer", glow && "shadow-[0_0_20px_rgba(45,106,79,0.18)]", premium && "border-green-200 shadow-[0_10px_30px_rgba(45,106,79,0.12)]", className)}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 py-4 border-b border-[rgba(45,106,79,0.10)]", className)}>{children}</div>;
}
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-semibold text-slate-700 tracking-[-0.01em]", className)}>{children}</h3>;
}
export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-slate-500", className)}>{children}</p>;
}