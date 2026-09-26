"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, ShieldCheck, Brain, BarChart2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

const features = [
  { icon: Brain, label: "Multi-Agent AI Reasoning", desc: "Supervisor, Retrieval, SQL & Reviewer agents" },
  { icon: ShieldCheck, label: "Enterprise Security", desc: "RBAC, tenant isolation, audit logs" },
  { icon: BarChart2, label: "Full Observability", desc: "Traces, costs, evaluation metrics" },
];

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("rahul@enterprise.com");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Email/password login (demo) ──────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ───────────────────────────
  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Popup was blocked by browser. Please allow popups and try again.");
      } else {
        setError(err?.message || "Google sign-in failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col w-1/2 p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none aurora-bg" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Enterprise AI Platform</h1>
              <p className="text-xs text-white/80">Multi-Agent RAG System</p>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "white" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Production-Grade · LangGraph · RAG · Enterprise
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                Your intelligent<br />
                <span className="text-white">knowledge assistant</span>
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                Multi-agent AI that understands your enterprise documents,
                provides cited answers, and reasons across structured and unstructured data.
              </p>
            </div>
            <div className="space-y-4">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/80">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            {[{ label: "Documents", value: "12.8K" }, { label: "AI Queries", value: "48.2K" }, { label: "Success Rate", value: "96.4%" }].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — Login form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#40916c,#2dd4bf)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-green-700">Enterprise AI Platform</h1>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-green-800">Welcome back</h3>
            <p className="text-sm text-green-600 mt-1">Sign in to your workspace</p>
          </div>

          {/* ── Google Sign-In Button ── */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-green-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-6 hover:bg-green-50"
            style={{
              background: "white",
              border: "1px solid rgba(45,106,79,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,106,79,0.4)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(45,106,79,0.12), inset 0 1px 0 rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,106,79,0.2)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)";
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <GoogleIcon />}
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(45,106,79,0.15)" }} />
            <span className="text-xs text-green-600">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(45,106,79,0.15)" }} />
          </div>

          {/* Demo credentials */}
          <div className="mb-5 p-3 rounded-xl text-xs"
            style={{ background: "rgba(45,106,79,0.08)", border: "1px solid rgba(45,106,79,0.18)" }}>
            <p className="font-medium text-green-700 mb-1">Demo Credentials</p>
            <p className="text-green-800">Email: rahul@enterprise.com</p>
            <p className="text-green-800">Password: password</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs"
              style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)" }}>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-rose-600">{error}</p>
            </div>
          )}

          {/* Email/Password form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-green-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-green-200 rounded-lg px-3 py-2 pr-10 text-sm text-green-900 placeholder:text-green-400 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" loading={loading} size="lg">
              {loading ? "Signing in..." : "Sign in to Platform"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-green-500">
            Enterprise Multi-Agent RAG Platform v1.0 · Powered by Firebase Auth
          </p>
        </div>
      </div>
    </div>
  );
}
