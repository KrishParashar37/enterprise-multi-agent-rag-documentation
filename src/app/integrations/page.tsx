"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Blocks, CheckCircle2, XCircle, RefreshCw, Plus, ExternalLink, Activity, Settings2 } from "lucide-react";

const integrations = [
  { id: "slack", name: "Slack", category: "Communication", status: "connected", lastSync: "2 mins ago", icon: "💬", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "notion", name: "Notion", category: "Knowledge Base", status: "connected", lastSync: "15 mins ago", icon: "📓", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "jira", name: "Jira Software", category: "Project Management", status: "disconnected", lastSync: "Never", icon: "🎫", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "github", name: "GitHub", category: "Code Repository", status: "error", lastSync: "1 hour ago", icon: "🐙", color: "bg-slate-100 text-slate-800 border-slate-300" },
  { id: "salesforce", name: "Salesforce", category: "CRM", status: "disconnected", lastSync: "Never", icon: "☁️", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "confluence", name: "Confluence", category: "Knowledge Base", status: "connected", lastSync: "5 mins ago", icon: "📄", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

export default function IntegrationsPage() {
  return (
    <MainLayout title="Integrations" subtitle="Connect external data sources and tools to your agents">
      <div className="p-6 space-y-6 animate-fade-in">
        
        <div className="flex justify-between items-center bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Blocks className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">Unified Data Connectors</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Sync your organization's data across platforms. Our RAG engine automatically ingests, chunks, and vectorizes connected data sources for your agents.
            </p>
          </div>
          <div className="relative z-10">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"><Plus className="w-4 h-4 mr-2" /> Add Custom Webhook</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((app) => (
            <Card key={app.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${app.color}`}>
                    {app.icon}
                  </div>
                  {app.status === 'connected' && <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Connected</Badge>}
                  {app.status === 'disconnected' && <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Not Connected</Badge>}
                  {app.status === 'error' && <Badge variant="error" className="bg-rose-50 text-rose-600 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Sync Error</Badge>}
                </div>
                <div className="mt-4">
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="mt-1">{app.category}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-2 mb-6">
                  <Activity className="w-4 h-4" /> Last sync: {app.lastSync}
                </div>
                <div className="flex gap-2 w-full">
                  {app.status === 'connected' ? (
                    <>
                      <Button variant="outline" className="flex-1"><RefreshCw className="w-4 h-4 mr-2"/> Force Sync</Button>
                      <Button variant="outline" size="icon"><Settings2 className="w-4 h-4"/></Button>
                    </>
                  ) : app.status === 'error' ? (
                    <>
                      <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Resolve Issue</Button>
                    </>
                  ) : (
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">Connect</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
