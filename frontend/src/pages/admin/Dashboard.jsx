import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Building2, Briefcase, GraduationCap, TrendingUp, Clock, Award, IndianRupee } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusDot";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { Stagger, staggerItem } from "@/components/animated/Reveal";
import { CardSkeleton, Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#EF4444", "#64748B"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data, isLoading } = useQuery({
    queryKey: ["dash", user?.role],
    queryFn: async () => (await api.get(`/dashboard/${user.role}`)).data,
    enabled: !!user,
  });

  if (isLoading || !data) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-96" />
      <CardSkeleton count={8} />
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
  const k = data.kpis || {};

  const cards = isAdmin ? [
    { label: "Total Candidates", value: k.total_candidates, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Pending Verification", value: k.pending_verification, icon: Clock, tone: "bg-orange-500/10 text-orange-600" },
    { label: "In Pipeline", value: k.in_pipeline, icon: TrendingUp, tone: "bg-blue-500/10 text-blue-600" },
    { label: "Placed", value: k.placed, icon: Award, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Employees", value: k.employees, icon: Users, tone: "bg-purple-500/10 text-purple-600" },
    { label: "Companies", value: k.companies, icon: Building2, tone: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
    { label: "Open Jobs", value: k.open_jobs, icon: Briefcase, tone: "bg-cyan-500/10 text-cyan-600" },
    { label: "Active Batches", value: k.active_batches, icon: GraduationCap, tone: "bg-pink-500/10 text-pink-600" },
  ] : [
    { label: "Assigned", value: k.assigned, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "In Interview", value: k.interviews, icon: TrendingUp, tone: "bg-blue-500/10 text-blue-600" },
    { label: "Pending", value: k.pending, icon: Clock, tone: "bg-orange-500/10 text-orange-600" },
    { label: "Placed", value: k.placed, icon: Award, tone: "bg-emerald-500/10 text-emerald-600" },
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <div className="overline text-primary">Overview</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tighter">Hey {user?.full_name?.split(" ")[0]}, here&apos;s the pulse.</h1>
      </div>

      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <motion.div key={c.label} variants={staggerItem} whileHover={{ y: -4 }}>
            <Card className="p-5 border-border soft-shadow h-full">
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${c.tone}`}><c.icon className="h-5 w-5" /></div>
              <div className="mt-4 font-display text-3xl font-bold">
                <AnimatedCounter end={c.value ?? 0} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </Stagger>

      {isAdmin && data.vendor_stats && (
        <div className="space-y-3 mt-6">
          <div className="overline text-primary">Vendor Payments Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border soft-shadow">
              <div className="overline text-[10px] text-muted-foreground">Total Pending Payments</div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-800 dark:text-slate-200">
                {data.vendor_stats.total_pending}
              </div>
            </Card>
            <Card className="p-4 border-border soft-shadow">
              <div className="overline text-[10px] text-muted-foreground">Payments Due Today</div>
              <div className="mt-1 font-display text-2xl font-bold text-amber-600 dark:text-amber-500">
                {data.vendor_stats.due_today}
              </div>
            </Card>
            <Card className="p-4 border-border soft-shadow">
              <div className="overline text-[10px] text-muted-foreground">Overdue Payments</div>
              <div className="mt-1 font-display text-2xl font-bold text-red-500 dark:text-red-400">
                {data.vendor_stats.overdue}
              </div>
            </Card>
            <Card className="p-4 border-border soft-shadow">
              <div className="overline text-[10px] text-muted-foreground">Received This Month</div>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {data.vendor_stats.received_this_month}
              </div>
            </Card>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Status Distribution</h3>
              <span className="text-xs text-muted-foreground">All candidates</span>
            </div>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.status_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="font-display text-lg font-semibold">Revenue</h3>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-emerald-500/10 p-4">
                <div className="overline text-emerald-700 dark:text-emerald-400 text-[10px]">Total collected</div>
                <div className="mt-1 font-display text-3xl font-bold flex items-center"><IndianRupee className="h-6 w-6" />{(data.revenue?.total_paid || 0).toLocaleString("en-IN")}</div>
              </div>
              <div className="rounded-xl bg-red-500/10 p-4">
                <div className="overline text-red-700 dark:text-red-400 text-[10px]">Outstanding</div>
                <div className="mt-1 font-display text-3xl font-bold flex items-center"><IndianRupee className="h-6 w-6" />{(data.revenue?.total_due || 0).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card className="p-6 border-border mt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Vendor Payment Reminders</h3>
            <span className="text-xs text-muted-foreground">Sorted by nearest due date</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Vendor Type</th>
                  <th className="py-2.5 px-3">Remaining Days</th>
                  <th className="py-2.5 px-3">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.vendor_payment_reminders || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">No pending vendor payments</td>
                  </tr>
                ) : (
                  data.vendor_payment_reminders.map(r => (
                    <tr key={r.id} className="border-b border-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <Link to={`/app/candidates/${r.id}`} className="font-medium text-primary hover:underline">
                          {r.full_name} ({r.candidate_code || "N/A"})
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{r.vendor_type}</td>
                      <td className="py-2.5 px-3">
                        {r.vendor_remaining_days !== null ? (
                          <span className={
                            r.vendor_remaining_days < 0 
                              ? "text-red-500 font-bold" 
                              : r.vendor_remaining_days <= 3 
                                ? "text-amber-500 font-semibold animate-pulse" 
                                : "text-slate-700 dark:text-slate-300"
                          }>
                            {r.vendor_remaining_days < 0 
                              ? `Overdue (${Math.abs(r.vendor_remaining_days)} Days)` 
                              : r.vendor_remaining_days === 0 
                                ? "Due Today" 
                                : `${r.vendor_remaining_days} Days`
                            }
                          </span>
                        ) : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.vendor_payment_status === "Hold" 
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {r.vendor_payment_status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent Candidates</h3>
            <Link to="/app/candidates" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="mt-4 space-y-2">
            {(data.recent_candidates || []).map(c => (
              <Link key={c.id} to={`/app/candidates/${c.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{c.full_name}</div>
                  <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email}</div>
                </div>
                <StatusPill status={c.status} />
              </Link>
            ))}
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6 border-border">
            <h3 className="font-display text-lg font-semibold">Activity Stream</h3>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {(data.recent_activities || []).map(a => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0"><TrendingUp className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="font-medium">{a.description}</div>
                    <div className="text-xs text-muted-foreground">{a.actor_name || "System"} · {new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
