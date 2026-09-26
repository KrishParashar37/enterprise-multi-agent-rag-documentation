"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, UserPlus, MoreHorizontal, Shield, Mail, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const usersList = [
  { id: 1, name: "Rahul Sharma", email: "rahul@enterprise.com", role: "Admin", status: "Active", lastLogin: "2 mins ago", avatar: "RS" },
  { id: 2, name: "Ananya Roy", email: "ananya@enterprise.com", role: "Developer", status: "Active", lastLogin: "1 hour ago", avatar: "AR" },
  { id: 3, name: "David Chen", email: "david@enterprise.com", role: "Viewer", status: "Active", lastLogin: "5 hours ago", avatar: "DC" },
  { id: 4, name: "Sarah Jones", email: "sarah@enterprise.com", role: "Developer", status: "Offline", lastLogin: "2 days ago", avatar: "SJ" },
  { id: 5, name: "Michael Chang", email: "michael@enterprise.com", role: "Admin", status: "Active", lastLogin: "10 mins ago", avatar: "MC" },
];

const roleData = [
  { name: 'Admin', value: 2, color: '#8b5cf6' },
  { name: 'Developer', value: 14, color: '#3b82f6' },
  { name: 'Viewer', value: 8, color: '#10b981' },
];

export default function UsersPage() {
  return (
    <MainLayout title="User Management" subtitle="Manage team access, roles, and permissions">
      <div className="p-6 space-y-6 animate-fade-in">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 border-indigo-500/30 shadow-lg shadow-indigo-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" /> Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800">24</span>
                  <span className="text-xs text-slate-500">Total Users</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {roleData.map(role => (
                  <div key={role.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-slate-600">{role.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{role.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4 flex-1">
                <CardTitle>Team Directory</CardTitle>
                <div className="relative flex-1 max-w-sm hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search users by name or email..." className="pl-9 h-9" />
                </div>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white"><UserPlus className="w-4 h-4 mr-2" /> Invite User</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Last Active</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{user.name}</p>
                              <p className="text-xs text-slate-500 flex items-center mt-0.5"><Mail className="w-3 h-3 mr-1" />{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            user.role === 'Admin' ? 'border-purple-200 text-purple-700 bg-purple-50' : 
                            user.role === 'Developer' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                            'border-slate-200 text-slate-700 bg-slate-50'
                          }>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-sm text-slate-600">{user.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {user.lastLogin}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"><MoreHorizontal className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  );
}
