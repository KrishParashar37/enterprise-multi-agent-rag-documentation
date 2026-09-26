"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, Zap, Users, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const billingHistory = [
  { date: "Sep 01, 2026", amount: "$840.00", status: "Paid", invoice: "INV-2026-09" },
  { date: "Aug 01, 2026", amount: "$790.50", status: "Paid", invoice: "INV-2026-08" },
  { date: "Jul 01, 2026", amount: "$710.20", status: "Paid", invoice: "INV-2026-07" },
];

const spendData = [
  { month: "Apr", spend: 400 },
  { month: "May", spend: 450 },
  { month: "Jun", spend: 580 },
  { month: "Jul", spend: 710 },
  { month: "Aug", spend: 790 },
  { month: "Sep", spend: 840 },
];

export default function BillingPage() {
  return (
    <MainLayout title="Billing & Subscriptions" subtitle="Manage your enterprise plan and usage limits">
      <div className="p-6 space-y-6 animate-fade-in">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <Card className="lg:col-span-1 border-emerald-500/30 shadow-lg shadow-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" /> Enterprise Plan
              </CardTitle>
              <CardDescription>Billed at $999/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium flex items-center gap-1"><Users className="w-4 h-4"/> Seats</span>
                  <span className="font-semibold">24 / 50</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[48%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium flex items-center gap-1"><Database className="w-4 h-4"/> Vector Storage</span>
                  <span className="font-semibold">4.2GB / 10GB</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[42%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium flex items-center gap-1"><CreditCard className="w-4 h-4"/> Model Usage</span>
                  <span className="font-semibold">$14.20 / $500</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[5%]" />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>

          {/* Spend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Spend History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={spendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice ID</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((invoice, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoice}</td>
                      <td className="px-4 py-3 text-slate-500">{invoice.date}</td>
                      <td className="px-4 py-3 font-medium">{invoice.amount}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
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
