"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatCost } from "@/lib/utils";
import {
  mockQueryTrend, mockAgentStats, mockTokenUsage, mockLatencyDistribution, mockKPIs
} from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Scatter
} from "recharts";
import { TrendingUp, TrendingDown, Zap, DollarSign, Clock, Activity, Download, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const TOKEN_COLORS = ["#7c3aed", "#059669", "#f59e0b"];

const userActivityData = [
  { hour: "00", active: 12 }, { hour: "02", active: 5 }, { hour: "04", active: 3 },
  { hour: "06", active: 18 }, { hour: "08", active: 82 }, { hour: "10", active: 145 },
  { hour: "12", active: 110 }, { hour: "14", active: 168 }, { hour: "16", active: 142 },
  { hour: "18", active: 90 }, { hour: "20", active: 45 }, { hour: "22", active: 28 },
];

const errorRateData = [
  { date: "Mon", rate: 2.1 }, { date: "Tue", rate: 1.8 }, { date: "Wed", rate: 3.2 },
  { date: "Thu", rate: 2.0 }, { date: "Fri", rate: 1.5 }, { date: "Sat", rate: 1.2 }, { date: "Sun", rate: 1.0 },
];

// Feature 30: Department usage breakdown data
const deptUsageData = [
  { dept: "HR", queries: 18420, cost: 48.2, color: "#2d6a4f" },
  { dept: "Engineering", queries: 14280, cost: 37.6, color: "#10b981" },
  { dept: "Finance", queries: 8940, cost: 22.1, color: "#059669" },
  { dept: "Sales", queries: 4820, cost: 12.8, color: "#10b981" },
  { dept: "Security", queries: 1831, cost: 7.7, color: "#f59e0b" },
];

// Feature 31: User satisfaction score trend
const satisfactionData = [
  { month: "Jan", score: 82 }, { month: "Feb", score: 85 }, { month: "Mar", score: 83 },
  { month: "Apr", score: 87 }, { month: "May", score: 89 }, { month: "Jun", score: 91 },
  { month: "Jul", score: 90 }, { month: "Aug", score: 92 }, { month: "Sep", score: 93 },
  { month: "Oct", score: 94 }, { month: "Nov", score: 95 }, { month: "Dec", score: 96 },
];

const metricCards = [
  { label: "Total Queries", value: formatNumber(0), change: "+8.2%", up: true, icon: Activity, color: "text-green-400", bg: "kpi-green" },
  { label: "Tokens Consumed", value: "28.4M", change: "+12.1%", up: true, icon: Zap, color: "text-green-400", bg: "kpi-green" },
  { label: "Total Cost", value: formatCost(0), change: "+$18.2", up: false, icon: DollarSign, color: "text-amber-400", bg: "kpi-amber" },
  { label: "Avg Latency", value: "0s", change: "-0.2s", up: true, icon: Clock, color: "text-teal-400", bg: "kpi-teal" },
];

export default function AnalyticsPage() {
  // Feature 32: Time range for all charts
  const [timeRange, setTimeRange] = useState("12m");
  // Feature 33: Chart type toggle for main chart
  const [mainChartType, setMainChartType] = useState<"area" | "bar" | "line">("area");

  // Feature 34: Export analytics CSV
  const handleExportCSV = () => {
    const rows = [
      ["Month", "Queries", "Cost"],
      ...mockQueryTrend.map((d) => [d.date, d.queries.toString(), d.cost.toString()]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = timeRange === "3m" ? mockQueryTrend.slice(-3)
    : timeRange === "6m" ? mockQueryTrend.slice(-6)
      : timeRange === "7d" ? mockQueryTrend.slice(-2)
        : mockQueryTrend;

  return (
    <MainLayout title="Analytics" subtitle="Platform usage, performance, and cost intelligence">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {/* Feature 32: Time range */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
              {["7d", "30d", "3m", "6m", "12m"].map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={cn("px-3 py-1.5 transition-colors flex items-center gap-1",
                    timeRange === r ? "bg-green-600 text-white" : "text-slate-500 hover:text-slate-300 bg-slate-800"
                  )}>
                  <Calendar className="w-3 h-3" />{r}
                </button>
              ))}
            </div>
          </div>
          {/* Feature 34: Export */}
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map(({ label, value, change, up, icon: Icon, color, bg }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div className={cn("flex items-center gap-1 text-xs font-medium", up ? "text-emerald-400" : "text-red-400")}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {change}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Main chart with type switcher — Feature 33 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Query Volume Trend</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                  {(["area", "bar", "line"] as const).map((t) => (
                    <button key={t} onClick={() => setMainChartType(t)}
                      className={cn("px-3 py-1.5 transition-colors capitalize",
                        mainChartType === t ? "bg-green-600 text-white" : "text-slate-500 bg-slate-800 hover:text-slate-300"
                      )}>{t}</button>
                  ))}
                </div>
                <Badge variant="info">{timeRange}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              {mainChartType === "area" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="qGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Area type="monotone" dataKey="queries" stroke="#2d6a4f" fill="url(#qGrad2)" strokeWidth={2} name="Queries" />
                </AreaChart>
              ) : mainChartType === "bar" ? (
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="queries" fill="#2d6a4f" radius={[4, 4, 0, 0]} name="Queries" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="queries" stroke="#2d6a4f" strokeWidth={2} dot={false} name="Queries" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost + hourly activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cost Trend</CardTitle>
                <Badge variant="warning">MTD: $128.42</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={false} name="Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hourly User Activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={userActivityData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="active" fill="#38bdf8" radius={[3, 3, 0, 0]} name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Token usage + latency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Latency Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockLatencyDistribution} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#2d6a4f" radius={[4, 4, 0, 0]} name="Queries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Token Usage by Model</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={mockTokenUsage} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="tokens">
                      {mockTokenUsage.map((_, i) => <Cell key={i} fill={TOKEN_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {mockTokenUsage.map(({ model, tokens, cost, percentage }, i) => (
                  <div key={model} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: TOKEN_COLORS[i] }} />
                      <span className="text-slate-400 truncate max-w-[100px]">{model}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-300">{formatCost(cost)}</span>
                      <span className="text-slate-600 ml-1">({percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature 30: Department usage breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usage by Department</CardTitle>
              <Badge variant="info">This month</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deptUsageData.map((dept) => (
                <div key={dept.dept} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-medium text-slate-400 shrink-0">{dept.dept}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500">
                      <span>{formatNumber(dept.queries)} queries</span>
                      <span>{formatCost(dept.cost)}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(dept.queries / 18420) * 100}%`, background: dept.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature 31: User satisfaction */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Satisfaction Score (CSAT %)</CardTitle>
              <Badge variant="success">96% avg this month</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={satisfactionData}>
                <defs>
                  <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "CSAT"]} />
                <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#satGrad)" strokeWidth={2} name="CSAT" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly error rate */}
        <Card>
          <CardHeader><CardTitle>Weekly Error Rate</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={errorRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} formatter={(v) => [`${v}%`, "Error Rate"]} />
                <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} name="Error Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Performance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agent Performance Summary</CardTitle>
              <Badge variant="success">All Active</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-700/30">
            <div className="grid grid-cols-6 gap-4 px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Agent</div>
              <div>Total Runs</div>
              <div>Success Rate</div>
              <div>Avg Latency</div>
              <div>Performance</div>
            </div>
            {mockAgentStats.map((agent) => (
              <div key={agent.name} className="grid grid-cols-6 gap-4 px-6 py-3 items-center hover:bg-slate-800/30">
                <div className="col-span-2"><span className="text-sm font-medium text-slate-300">{agent.name}</span></div>
                <div><span className="text-sm text-slate-400">{formatNumber(agent.runs)}</span></div>
                <div>
                  <span className={cn("text-sm font-medium", agent.success >= 96 ? "text-emerald-400" : agent.success >= 90 ? "text-amber-400" : "text-red-400")}>
                    {agent.success}%
                  </span>
                </div>
                <div><span className="text-sm text-slate-400">{agent.avgLatency}ms</span></div>
                <div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-24">
                    <div className="h-full rounded-full" style={{ width: `${agent.success}%`, background: agent.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
