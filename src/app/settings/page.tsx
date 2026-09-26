"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Settings, Bot, User, Building, Bell, Moon, Globe,
  Shield, Key, Check, Zap, Sun, Monitor, Save,
  AlertTriangle, RefreshCw, Info, Download, Upload,
  Palette, Languages, Clock
} from "lucide-react";

const settingsTabs = [
  { id: "ai", label: "AI Settings", icon: Bot },
  { id: "profile", label: "Profile", icon: User },
  { id: "org", label: "Organization", icon: Building },
  { id: "notifications", label: "Notifications", icon: Bell },
  // Feature 40: New "Appearance" tab
  { id: "appearance", label: "Appearance", icon: Palette },
  // Feature 41: New "Security" tab
  { id: "security", label: "Security", icon: Shield },
];

function ToggleSwitch({ defaultChecked = false, onChange }: { defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  const [checked, setChecked] = useState(defaultChecked);
  const handle = () => {
    const next = !checked;
    setChecked(next);
    onChange?.(next);
  };
  return (
    <button
      onClick={handle}
      className={cn("relative w-10 h-5 rounded-full transition-colors", checked ? "bg-green-600" : "bg-slate-700")}
      role="switch"
      aria-checked={checked}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")}
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

// Feature 42: Saved state indicator
function SaveStatus({ saved }: { saved: boolean | null }) {
  if (saved === null) return null;
  return (
    <div className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border", saved ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
      {saved ? <><Check className="w-3 h-3" />Saved</> : <><AlertTriangle className="w-3 h-3" />Unsaved changes</>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("ai");
  const [model, setModel] = useState("gpt-4o");
  const [temp, setTemp] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [retrievalK, setRetrievalK] = useState(5);
  // Feature 40: Appearance state
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor] = useState("green");
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("en");
  // Feature 41: Security state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  // Feature 42: Save state
  const [saveStatus, setSaveStatus] = useState<boolean | null>(null);
  // Feature 43: Import/Export config
  const [configJson, setConfigJson] = useState("");

  const handleSave = async () => {
    try {
      const config = {
        ai: { model, temperature: temp, maxTokens, retrievalK },
        appearance: { theme, accentColor, fontSize, language },
        security: { twoFAEnabled, sessionTimeout },
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus(true);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportConfig = () => {
    const config = {
      ai: { model, temperature: temp, maxTokens, retrievalK },
      appearance: { theme, accentColor, fontSize, language },
      security: { twoFAEnabled, sessionTimeout },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platform-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ACCENT_COLORS = [
    { name: "green", class: "bg-green-500", label: "Green" },
    { name: "sky", class: "bg-sky-500", label: "Sky" },
    { name: "emerald", class: "bg-emerald-500", label: "Emerald" },
    { name: "rose", class: "bg-rose-500", label: "Rose" },
    { name: "amber", class: "bg-amber-500", label: "Amber" },
  ];

  return (
    <MainLayout title="Settings" subtitle="Configure your AI platform and preferences">
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 shrink-0 space-y-1">
            {settingsTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === id ? "bg-green-600/20 text-green-400 border border-green-500/20" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
            {/* Feature 43: Export config */}
            <div className="pt-4 border-t border-slate-700/50 space-y-1">
              <button onClick={handleExportConfig} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-colors">
                <Download className="w-3.5 h-3.5" />Export Config
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-colors">
                <Upload className="w-3.5 h-3.5" />Import Config
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Feature 42: Save status + actions */}
            <div className="flex items-center justify-between">
              <SaveStatus saved={saveStatus} />
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="secondary" size="sm" onClick={() => setSaveStatus(false)}>
                  <RefreshCw className="w-3.5 h-3.5" />Reset to Defaults
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5" />Save Changes
                </Button>
              </div>
            </div>

            {activeTab === "ai" && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle>LLM Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-2 block">Default Model</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", badge: "Recommended" },
                          { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", badge: "Cost-efficient" },
                          { id: "claude-3-5-sonnet", name: "Claude 3.5", provider: "Anthropic", badge: "Alternative" },
                        ].map((m) => (
                          <button key={m.id} onClick={() => { setModel(m.id); setSaveStatus(false); }}
                            className={cn("p-3 rounded-lg border text-left transition-all",
                              model === m.id ? "border-green-500/50 bg-green-600/10" : "border-slate-700 hover:border-slate-600"
                            )}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-300">{m.name}</span>
                              {model === m.id && <Check className="w-3.5 h-3.5 text-green-400" />}
                            </div>
                            <span className="text-[10px] text-slate-600">{m.provider}</span>
                            <div className="mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500">{m.badge}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-400">Temperature</label>
                        <span className="text-xs text-green-400 font-medium">{temp}</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.1} value={temp}
                        onChange={(e) => { setTemp(parseFloat(e.target.value)); setSaveStatus(false); }}
                        className="w-full accent-green-500" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>Deterministic (0)</span><span>Creative (1)</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-400">Max Output Tokens</label>
                        <span className="text-xs text-green-400 font-medium">{maxTokens}</span>
                      </div>
                      <input type="range" min={512} max={8192} step={512} value={maxTokens}
                        onChange={(e) => { setMaxTokens(parseInt(e.target.value)); setSaveStatus(false); }}
                        className="w-full accent-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Retrieval Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-400">Top-K Chunks</label>
                        <span className="text-xs text-green-400 font-medium">{retrievalK}</span>
                      </div>
                      <input type="range" min={1} max={20} step={1} value={retrievalK}
                        onChange={(e) => { setRetrievalK(parseInt(e.target.value)); setSaveStatus(false); }}
                        className="w-full accent-green-500" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Enable Hybrid Search (Vector + Keyword)", defaultChecked: true },
                        { label: "Enable Cross-Encoder Reranking", defaultChecked: true },
                        { label: "Enable Citation Generation", defaultChecked: true },
                        { label: "Enable Agent Execution Trace", defaultChecked: true },
                        { label: "Enable Reviewer Agent Validation", defaultChecked: true },
                      ].map(({ label, defaultChecked }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                          <span className="text-sm text-slate-400">{label}</span>
                          <ToggleSwitch defaultChecked={defaultChecked} onChange={() => setSaveStatus(false)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Agent Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Enable SQL Agent", defaultChecked: true },
                      { label: "Enable Research Agent", defaultChecked: true },
                      { label: "SQL Agent Read-Only Mode", defaultChecked: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                        <span className="text-sm text-slate-400">{item.label}</span>
                        <ToggleSwitch defaultChecked={item.defaultChecked} onChange={() => setSaveStatus(false)} />
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-400">Max Agent Iterations</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min={1} max={5} defaultValue={3} className="w-20 accent-green-500" onChange={() => setSaveStatus(false)} />
                        <span className="text-xs text-green-400">3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">RS</div>
                      <div>
                        <Button variant="outline" size="sm">Change Avatar</Button>
                        <p className="text-[10px] text-slate-600 mt-1">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                    <Input label="Full Name" defaultValue="Rahul Sharma" onChange={() => setSaveStatus(false)} />
                    <Input label="Email Address" defaultValue="rahul@enterprise.com" type="email" onChange={() => setSaveStatus(false)} />
                    <Input label="Department" defaultValue="Engineering" onChange={() => setSaveStatus(false)} />
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Role</label>
                      <Badge variant="error">Admin</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Current Password" type="password" placeholder="••••••••" />
                    <Input label="New Password" type="password" placeholder="••••••••" />
                    <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "org" && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle>Organization Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Organization Name" defaultValue="Acme Corporation" onChange={() => setSaveStatus(false)} />
                    <Input label="Domain" defaultValue="acme.com" onChange={() => setSaveStatus(false)} />
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-2 block">Tenant ID</label>
                      <p className="text-sm font-mono text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">tenant_acme_001</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Usage Limits</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Monthly Query Limit", current: 48291, max: 100000 },
                      { label: "Document Storage", current: 12842, max: 50000 },
                      { label: "Monthly Token Budget", current: 28400000, max: 100000000 },
                    ].map(({ label, current, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>{label}</span>
                          <span className={cn((current / max) > 0.8 ? "text-amber-400" : "text-slate-400")}>
                            {(current / 1000).toFixed(1)}K / {(max / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", (current / max) > 0.8 ? "bg-amber-500" : "bg-green-500")}
                            style={{ width: `${(current / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <Card className="animate-fade-in">
                <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Document indexing complete", defaultChecked: true },
                    { label: "Document processing failed", defaultChecked: true },
                    { label: "Agent execution errors", defaultChecked: true },
                    { label: "SQL agent retry warnings", defaultChecked: false },
                    { label: "Evaluation completion", defaultChecked: true },
                    { label: "New user added", defaultChecked: false },
                    { label: "Cost threshold alerts", defaultChecked: true },
                    { label: "System health alerts", defaultChecked: true },
                  ].map(({ label, defaultChecked }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-400">{label}</span>
                      <ToggleSwitch defaultChecked={defaultChecked} onChange={() => setSaveStatus(false)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Feature 40: Appearance tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "light", label: "Light", icon: Sun },
                        { id: "system", label: "System", icon: Monitor },
                      ] as const).map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => { setTheme(id); setSaveStatus(false); }}
                          className={cn("flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                            theme === id ? "border-green-500/50 bg-green-600/10" : "border-slate-700 hover:border-slate-600"
                          )}>
                          <Icon className={cn("w-5 h-5", theme === id ? "text-green-400" : "text-slate-500")} />
                          <span className={cn("text-xs font-medium", theme === id ? "text-green-400" : "text-slate-400")}>{label}</span>
                          {theme === id && <Check className="w-3 h-3 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Accent Color</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 flex-wrap">
                      {ACCENT_COLORS.map(({ name, class: cls, label }) => (
                        <button key={name} onClick={() => { setAccentColor(name); setSaveStatus(false); }}
                          className={cn("flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
                            accentColor === name ? "border-slate-400 bg-slate-800" : "border-transparent hover:border-slate-700"
                          )}>
                          <div className={cn("w-7 h-7 rounded-full", cls)} />
                          <span className="text-[10px] text-slate-500">{label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Interface</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-2 block">Font Size</label>
                      <div className="flex gap-2">
                        {["small", "medium", "large"].map((size) => (
                          <button key={size} onClick={() => { setFontSize(size); setSaveStatus(false); }}
                            className={cn("px-4 py-2 rounded-lg border text-xs transition-all capitalize",
                              fontSize === size ? "border-green-500/50 bg-green-600/10 text-green-400" : "border-slate-700 text-slate-500 hover:border-slate-600"
                            )}>{size}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1 block">
                        <Languages className="w-3.5 h-3.5" />Interface Language
                      </label>
                      <select value={language} onChange={(e) => { setLanguage(e.target.value); setSaveStatus(false); }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500">
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Feature 41: Security tab */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                      <div>
                        <p className="text-sm text-slate-300 font-medium">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</p>
                      </div>
                      <ToggleSwitch defaultChecked={twoFAEnabled} onChange={(v) => { setTwoFAEnabled(v); setSaveStatus(false); }} />
                    </div>
                    {twoFAEnabled && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
                        <p className="text-xs text-green-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />2FA is enabled. Use your authenticator app.
                        </p>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm text-slate-400">Session Timeout</p>
                          <p className="text-xs text-slate-600">Auto-logout after inactivity</p>
                        </div>
                        <span className="text-xs text-green-400 font-medium">{sessionTimeout} min</span>
                      </div>
                      <input type="range" min={5} max={120} step={5} value={sessionTimeout}
                        onChange={(e) => { setSessionTimeout(parseInt(e.target.value)); setSaveStatus(false); }}
                        className="w-full accent-green-500" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>5 min</span><span>120 min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { device: "Chrome · Windows 11", location: "Mumbai, IN", current: true, time: "Now" },
                      { device: "Safari · iPhone 15", location: "Mumbai, IN", current: false, time: "2h ago" },
                      { device: "Firefox · macOS", location: "Bangalore, IN", current: false, time: "3d ago" },
                    ].map((session) => (
                      <div key={session.device} className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-300">{session.device}</span>
                            {session.current && <Badge variant="success" className="text-[10px]">Current</Badge>}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{session.location} · {session.time}</p>
                        </div>
                        {!session.current && (
                          <button className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                        )}
                      </div>
                    ))}
                    <Button variant="danger" size="sm" className="w-full mt-2">Revoke All Other Sessions</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>IP Allowlist</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                      <div>
                        <p className="text-sm text-slate-300">Enable IP Restrictions</p>
                        <p className="text-xs text-slate-500">Only allow access from specified IPs</p>
                      </div>
                      <ToggleSwitch defaultChecked={false} onChange={() => setSaveStatus(false)} />
                    </div>
                    <Input label="Add IP / CIDR Range" placeholder="e.g. 192.168.1.0/24" />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
