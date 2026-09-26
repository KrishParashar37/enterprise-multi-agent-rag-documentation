"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

const apiKeys = [
  { id: "key_prod_1", name: "Production Gateway", prefix: "ent_pk_...", created: "Oct 12, 2025", lastUsed: "2 mins ago", scopes: ["Full Access"] },
  { id: "key_staging_1", name: "Staging Environment", prefix: "ent_test_...", created: "Sep 05, 2025", lastUsed: "1 hour ago", scopes: ["Read Only", "Agents"] },
  { id: "key_dev_1", name: "Developer Local (Rahul)", prefix: "ent_dev_...", created: "Nov 01, 2025", lastUsed: "3 days ago", scopes: ["Read Only"] },
];

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState<string | null>(null);

  return (
    <MainLayout title="API Keys" subtitle="Manage developer access tokens and authentication">
      <div className="p-6 space-y-6 animate-fade-in">
        
        <div className="bg-indigo-600 rounded-xl p-6 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-indigo-500 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Secure Access</h2>
            <p className="text-indigo-200 text-sm mt-1 max-w-xl">
              API keys grant programmatic access to your enterprise agents, document ingestion endpoints, and search capabilities. Keep these keys secure and rotate them regularly.
            </p>
          </div>
          <Button className="relative z-10 bg-white text-indigo-600 hover:bg-slate-100 font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Generate New Key
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active API Keys</CardTitle>
            <CardDescription>Keys that currently have access to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 border-y">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Secret Key</th>
                    <th className="px-4 py-3 font-medium">Scopes</th>
                    <th className="px-4 py-3 font-medium">Created On</th>
                    <th className="px-4 py-3 font-medium">Last Used</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <Key className="w-4 h-4 text-slate-400" /> {key.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md font-mono text-xs w-fit border border-slate-200 text-slate-600">
                          {showKey === key.id ? "ent_pk_9f8d7e6c5b4a3... (dummy)" : key.prefix + "******************"}
                          <button onClick={() => setShowKey(showKey === key.id ? null : key.id)} className="ml-2 text-slate-400 hover:text-slate-700">
                            {showKey === key.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button className="text-slate-400 hover:text-slate-700">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map(scope => (
                            <Badge key={scope} variant="outline" className="font-normal text-xs">{scope}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{key.created}</td>
                      <td className="px-4 py-4 text-slate-500">{key.lastUsed}</td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
