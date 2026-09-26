"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { mockUsers, mockDocuments, mockNotifications } from "@/lib/mock-data";
import {
  ShieldCheck, Users, FileText, Activity, Plus, Search,
  Edit, Trash2, Lock, Unlock, Key, Bell,
  CheckCircle2, XCircle, Clock, Download, Filter,
  ChevronDown, X, Mail, UserPlus, RefreshCw, Eye
} from "lucide-react";

const roleConfig: Record<string, { variant: "default" | "success" | "warning" | "error" | "info"; label: string }> = {
  ADMIN: { variant: "error", label: "Admin" },
  MANAGER: { variant: "warning", label: "Manager" },
  ANALYST: { variant: "info", label: "Analyst" },
  EMPLOYEE: { variant: "default", label: "Employee" },
};

const rbacMatrix = [
  { permission: "View all documents", ADMIN: true, MANAGER: true, ANALYST: false, EMPLOYEE: false },
  { permission: "Upload documents", ADMIN: true, MANAGER: true, ANALYST: false, EMPLOYEE: false },
  { permission: "Delete documents", ADMIN: true, MANAGER: false, ANALYST: false, EMPLOYEE: false },
  { permission: "View AI chat", ADMIN: true, MANAGER: true, ANALYST: true, EMPLOYEE: true },
  { permission: "Access analytics", ADMIN: true, MANAGER: true, ANALYST: true, EMPLOYEE: false },
  { permission: "Manage users", ADMIN: true, MANAGER: false, ANALYST: false, EMPLOYEE: false },
  { permission: "View agent runs", ADMIN: true, MANAGER: true, ANALYST: false, EMPLOYEE: false },
  { permission: "Configure agents", ADMIN: true, MANAGER: false, ANALYST: false, EMPLOYEE: false },
  { permission: "View cost data", ADMIN: true, MANAGER: false, ANALYST: false, EMPLOYEE: false },
  { permission: "Run evaluations", ADMIN: true, MANAGER: false, ANALYST: true, EMPLOYEE: false },
];

const tabs = ["Users", "Permissions", "Audit Log", "API Keys", "System Health"];

// Feature 44: System health data
const systemComponents = [
  { name: "API Gateway", status: "healthy", latency: "12ms", uptime: "99.98%" },
  { name: "Vector DB", status: "healthy", latency: "28ms", uptime: "99.95%" },
  { name: "PostgreSQL", status: "healthy", latency: "8ms", uptime: "99.99%" },
  { name: "LLM Proxy", status: "degraded", latency: "380ms", uptime: "97.20%" },
  { name: "File Storage", status: "healthy", latency: "45ms", uptime: "99.97%" },
  { name: "Redis Cache", status: "healthy", latency: "3ms", uptime: "100%" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Users");
  const [userSearch, setUserSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("EMPLOYEE");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewUser, setViewUser] = useState<typeof mockUsers[0] | null>(null);
  // Real DB users
  const [dbUsers, setDbUsers] = useState<typeof mockUsers>([...mockUsers]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { if (data.data?.length) setDbUsers(data.data); })
      .catch(() => { })
      .finally(() => setUsersLoading(false));
  }, []);

  const filteredUsers = dbUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Feature 48: Export audit log
  const handleExportAuditLog = () => {
    const rows = [["User", "Action", "Resource", "Time", "Status"]].concat(
      auditLog.map((l) => [l.user, l.action, l.resource, timeAgo(l.time), l.status])
    );
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const auditLog = [
    { user: "Rahul Sharma", action: "Uploaded document", resource: "Benefits Guide 2025", time: new Date(), status: "success" },
    { user: "Priya Singh", action: "Queried AI", resource: "Remote work policy question", time: new Date(Date.now() - 300000), status: "success" },
    { user: "Amit Kumar", action: "Login", resource: "Web application", time: new Date(Date.now() - 600000), status: "success" },
    { user: "System", action: "Document indexing failed", resource: "Deployment Runbook", time: new Date(Date.now() - 900000), status: "error" },
    { user: "Rahul Sharma", action: "User role changed", resource: "Ananya Roy → ANALYST", time: new Date(Date.now() - 86400000), status: "success" },
    { user: "Vikram Patel", action: "Failed login attempt", resource: "Web application", time: new Date(Date.now() - 172800000), status: "error" },
    { user: "Rahul Sharma", action: "API key generated", resource: "Production API Key", time: new Date(Date.now() - 259200000), status: "success" },
    { user: "Priya Singh", action: "Document deleted", resource: "Old Policy v1", time: new Date(Date.now() - 345600000), status: "warning" },
  ];

  return (
    <MainLayout title="Admin Console" subtitle="User management, permissions, and system configuration">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: mockUsers.length.toString(), icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Active Users", value: mockUsers.filter((u) => u.isActive).length.toString(), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Total Documents", value: mockDocuments.length.toString(), icon: FileText, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "System Alerts", value: "2", icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10" },
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

        {/* Tab Navigation */}
        <div className="border-b border-slate-700/50">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                  activeTab === tab ? "border-green-500 text-green-400" : "border-transparent text-slate-500 hover:text-slate-300"
                )}>{tab}</button>
            ))}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {/* Feature 46: Role filter */}
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {["All", "ADMIN", "MANAGER", "ANALYST", "EMPLOYEE"].map((r) => <option key={r}>{r}</option>)}
              </select>
              {/* Feature 45: Add user button */}
              <Button size="sm" onClick={() => setShowAddUser(true)}>
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </Button>
            </div>

            {/* Feature 45: Add user modal */}
            {showAddUser && (
              <Card className="border-green-500/20 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Add New User</CardTitle>
                    <button onClick={() => setShowAddUser(false)}><X className="w-4 h-4 text-slate-500" /></button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Full Name" placeholder="John Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                    <Input label="Email Address" placeholder="john@company.com" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Role</label>
                      <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500">
                        {["EMPLOYEE", "ANALYST", "MANAGER", "ADMIN"].map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={async () => {
                      if (!newUserName || !newUserEmail) { alert("Name and email required"); return; }
                      try {
                        const res = await fetch("/api/users", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: newUserName, email: newUserEmail, password: "password", role: newUserRole }),
                        });
                        const data = await res.json();
                        if (res.status === 409) {
                          alert("Email already exists. Use a different email.");
                          return;
                        }
                        if (!res.ok) { alert(data.error || "Failed to create user"); return; }
                        setDbUsers((prev) => [...prev, data.user]);
                        setShowAddUser(false); setNewUserName(""); setNewUserEmail("");
                      } catch { alert("Network error"); }
                    }}>
                      <Plus className="w-3.5 h-3.5" />Create User
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddUser(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-slate-500 mb-1">
              Showing <span className="text-slate-300">{filteredUsers.length}</span> of {mockUsers.length} users
            </div>

            <Card>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-700/50 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Joined</div>
                <div className="col-span-1">Actions</div>
              </div>
              <div className="divide-y divide-slate-700/30">
                {filteredUsers.map((user) => {
                  const roleCfg = roleConfig[user.role] || { variant: "default" as const, label: user.role };
                  return (
                    <div key={user.id} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-slate-800/30 transition-colors items-center group">
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-slate-200 truncate">{user.name}</span>
                      </div>
                      <div className="col-span-3"><span className="text-sm text-slate-400 truncate">{user.email}</span></div>
                      <div className="col-span-2"><Badge variant={roleCfg.variant}>{roleCfg.label}</Badge></div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-red-500")} />
                          <span className={cn("text-xs", user.isActive ? "text-emerald-400" : "text-red-400")}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-1"><span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span></div>
                      <div className="col-span-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Feature 47: View user detail */}
                        <button onClick={() => setViewUser(user)} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors" title="View details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className={cn("p-1 rounded transition-colors", user.isActive ? "hover:bg-amber-500/20 text-slate-500 hover:text-amber-400" : "hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400")}>
                          {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Feature 47: User detail side panel */}
            {viewUser && (
              <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700/50 shadow-2xl z-50 overflow-y-auto animate-slide-in">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-slate-200">User Details</h3>
                    <button onClick={() => setViewUser(null)}><X className="w-4 h-4 text-slate-500" /></button>
                  </div>
                  <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-700/50 mb-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                      {viewUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-200">{viewUser.name}</p>
                      <p className="text-xs text-slate-500">{viewUser.email}</p>
                      <div className="flex items-center gap-2 mt-2 justify-center">
                        <Badge variant={roleConfig[viewUser.role]?.variant || "default"}>{roleConfig[viewUser.role]?.label || viewUser.role}</Badge>
                        <Badge variant={viewUser.isActive ? "success" : "error"}>{viewUser.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: "User ID", value: viewUser.id.slice(0, 12) + "..." },
                      { label: "Joined", value: formatDate(viewUser.createdAt) },
                      { label: "Last Active", value: "2h ago" },
                      { label: "Queries (30d)", value: "142" },
                      { label: "Documents Uploaded", value: "8" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-600">{label}</span>
                        <span className="text-slate-300">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-2">
                    <Button size="sm" className="w-full"><Mail className="w-3.5 h-3.5" />Send Email</Button>
                    <Button size="sm" variant="secondary" className="w-full"><Edit className="w-3.5 h-3.5" />Edit User</Button>
                    <Button size="sm" variant="danger" className="w-full"><Lock className="w-3.5 h-3.5" />Suspend Account</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === "Permissions" && (
          <Card className="animate-fade-in">
            <CardHeader><CardTitle>Role-Based Access Control (RBAC)</CardTitle></CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Permission</th>
                      {["ADMIN", "MANAGER", "ANALYST", "EMPLOYEE"].map((role) => (
                        <th key={role} className="text-center px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                          <Badge variant={roleConfig[role]?.variant || "default"}>{role}</Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {rbacMatrix.map((row) => (
                      <tr key={row.permission} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-2.5 text-sm text-slate-400">{row.permission}</td>
                        {["ADMIN", "MANAGER", "ANALYST", "EMPLOYEE"].map((role) => (
                          <td key={role} className="px-4 py-2.5 text-center">
                            {row[role as keyof typeof row]
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                              : <XCircle className="w-4 h-4 text-slate-700 mx-auto" />
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Log Tab */}
        {activeTab === "Audit Log" && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Audit Log</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{auditLog.length} recent events</Badge>
                  {/* Feature 48: Export audit log */}
                  <Button size="sm" variant="outline" onClick={handleExportAuditLog}>
                    <Download className="w-3.5 h-3.5" />Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-700/30">
              {auditLog.map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/20 transition-colors">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    log.status === "success" ? "bg-emerald-500/20" : log.status === "warning" ? "bg-amber-500/20" : "bg-red-500/20"
                  )}>
                    {log.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      : log.status === "warning" ? <Clock className="w-3.5 h-3.5 text-amber-400" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">{log.user}</span>
                      <span className="text-xs text-slate-500">→</span>
                      <span className="text-xs text-slate-400">{log.action}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.resource}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{timeAgo(log.time)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* API Keys Tab */}
        {activeTab === "API Keys" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => alert("API Key generated: eak_new_" + Math.random().toString(36).slice(2, 18))}>
                <Plus className="w-3.5 h-3.5" /> Generate API Key
              </Button>
            </div>
            {[
              { name: "Production API Key", key: "eak_prod_••••••••••••••••••1f9a", created: "2025-01-15", lastUsed: "2m ago", status: "active", requests: "12,841" },
              { name: "Development API Key", key: "eak_dev_••••••••••••••••••8c2b", created: "2025-02-01", lastUsed: "1d ago", status: "active", requests: "2,284" },
              { name: "Analytics Integration", key: "eak_int_••••••••••••••••••3e7d", created: "2025-03-10", lastUsed: "5d ago", status: "inactive", requests: "428" },
            ].map((apiKey) => (
              <Card key={apiKey.name} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                      <Key className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{apiKey.name}</p>
                      <p className="text-xs font-mono text-slate-500">{apiKey.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right text-[10px] text-slate-600">
                      <p>Created: {apiKey.created}</p>
                      <p>Last used: {apiKey.lastUsed}</p>
                      {/* Feature 49: Request count */}
                      <p className="text-green-400">{apiKey.requests} requests</p>
                    </div>
                    <Badge variant={apiKey.status === "active" ? "success" : "outline"}>{apiKey.status}</Badge>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors" title="Copy key">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Revoke key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Feature 44: System Health tab */}
        {activeTab === "System Health" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {systemComponents.map((comp) => (
                <Card key={comp.name} className={cn("p-4", comp.status === "degraded" && "border-amber-500/20")}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-300">{comp.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", comp.status === "healthy" ? "bg-emerald-500" : comp.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500")} />
                      <span className={cn("text-xs", comp.status === "healthy" ? "text-emerald-400" : comp.status === "degraded" ? "text-amber-400" : "text-red-400")}>
                        {comp.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Latency</span>
                      <span className={cn("font-medium", parseInt(comp.latency) > 200 ? "text-amber-400" : "text-slate-300")}>{comp.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime (30d)</span>
                      <span className="font-medium text-emerald-400">{comp.uptime}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Feature 50: Maintenance mode toggle */}
            <Card>
              <CardHeader><CardTitle>Maintenance Controls</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Maintenance Mode", desc: "Disable all incoming queries during maintenance", danger: true },
                  { label: "Debug Logging", desc: "Enable verbose logging for troubleshooting", danger: false },
                  { label: "Rate Limiting Override", desc: "Temporarily disable rate limits for testing", danger: true },
                  { label: "Read-Only Mode", desc: "Prevent any write operations to the database", danger: false },
                ].map(({ label, desc, danger }) => (
                  <div key={label} className={cn("flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0", danger && "")}>
                    <div>
                      <p className={cn("text-sm font-medium", danger ? "text-amber-400" : "text-slate-300")}>{label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {danger && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Caution</span>}
                      <button
                        className="relative w-10 h-5 rounded-full bg-slate-700 transition-colors"
                        onClick={() => alert(`${label} toggled (simulated)`)}
                      >
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
