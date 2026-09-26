"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, Filter, AlertTriangle, AlertCircle, Info, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const logsData = [
  { id: "L-9021", time: "10:24:12 AM", level: "ERROR", service: "SQL Agent", message: "Failed to connect to primary database cluster" },
  { id: "L-9020", time: "10:23:45 AM", level: "WARN", service: "RAG Pipeline", message: "High latency detected during document retrieval (840ms)" },
  { id: "L-9019", time: "10:21:05 AM", level: "INFO", service: "Auth Service", message: "User admin@company.com logged in successfully" },
  { id: "L-9018", time: "10:15:30 AM", level: "INFO", service: "Ingestion", message: "Indexed 452 chunks from Employee_Handbook_2024.pdf" },
  { id: "L-9017", time: "10:12:11 AM", level: "ERROR", service: "LLM Gateway", message: "Rate limit exceeded for provider: Anthropic" },
  { id: "L-9016", time: "10:10:00 AM", level: "INFO", service: "System", message: "Scheduled maintenance check completed" },
  { id: "L-9015", time: "10:05:22 AM", level: "INFO", service: "API", message: "200 OK POST /v1/chat/completions" },
];

const errorFreqData = [
  { time: "06:00", count: 2 },
  { time: "07:00", count: 1 },
  { time: "08:00", count: 5 },
  { time: "09:00", count: 12 },
  { time: "10:00", count: 8 },
  { time: "11:00", count: 3 },
];

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'ERROR': return <AlertCircle className="w-4 h-4 text-rose-500" />;
    case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    default: return <Info className="w-4 h-4 text-blue-500" />;
  }
}

export default function LogsPage() {
  return (
    <MainLayout title="System Logs" subtitle="Real-time application auditing and debugging">
      <div className="p-6 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-100px)]">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 shrink-0">
          <Card className="lg:col-span-3">
             <CardHeader className="pb-2">
              <CardTitle>Error Frequency (Last 6 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={errorFreqData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col justify-center items-center text-center p-6 bg-slate-900 text-white">
            <ScrollText className="w-8 h-8 text-slate-400 mb-3" />
            <h3 className="text-3xl font-bold">1.2M</h3>
            <p className="text-sm text-slate-400 mt-1">Logs Processed (24h)</p>
          </Card>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search logs by message, trace ID, or service..." className="pl-9" />
                </div>
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
                <div className="flex items-center gap-2 text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Streaming
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-sm">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logsData.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.time}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className={log.level === 'ERROR' ? 'text-rose-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'}>
                          {log.level}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">{log.service}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 w-full">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
