import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Users, Award, TrendingUp, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusDot";
import api from "@/lib/api";

export default function EmployeeDetail() {
  const { id } = useParams();
  const { data: e, isLoading } = useQuery({
    queryKey: ["employee-detail", id],
    queryFn: async () => (await api.get(`/employees/${id}`)).data,
  });
  if (isLoading || !e) return <div className="text-muted-foreground">Loading...</div>;
  const w = e.workload || {};
  return (
    <div className="space-y-6" data-testid="employee-detail-page">
      <Link to="/app/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white grid place-items-center font-display text-2xl font-bold">{e.full_name?.[0]}</div>
          <div>
            <div className="overline text-primary">Recruiter</div>
            <h1 className="font-display text-3xl font-bold tracking-tighter">{e.full_name}</h1>
            <div className="text-sm text-muted-foreground">{e.designation || "Recruiter"} · {e.department || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">{e.email} · {e.phone || "—"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Assigned" value={w.assigned || 0} tone="text-primary" />
        <StatCard icon={TrendingUp} label="Active Pipeline" value={w.active_pipeline || 0} tone="text-blue-600" />
        <StatCard icon={Award} label="Placed" value={w.placed || 0} tone="text-emerald-600" />
        <StatCard icon={Activity} label="Activity Events" value={(e.activity || []).length} tone="text-purple-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 border-border">
          <div className="font-display font-semibold mb-4">Assigned Candidates</div>
          {(e.assigned_candidates || []).length === 0 && <div className="text-sm text-muted-foreground">No candidates assigned</div>}
          <div className="space-y-2">
            {(e.assigned_candidates || []).slice(0, 20).map(c => (
              <Link key={c.id} to={`/app/candidates/${c.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <div className="text-sm font-medium">{c.full_name}</div>
                  <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email}</div>
                </div>
                <StatusPill status={c.status} />
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5 border-border">
          <div className="font-display font-semibold mb-4">Stage Breakdown</div>
          <div className="space-y-2">
            {Object.entries(e.stage_counts || {}).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between">
                <StatusPill status={s} />
                <span className="text-sm font-medium">{n}</span>
              </div>
            ))}
            {Object.keys(e.stage_counts || {}).length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          </div>
        </Card>
      </div>

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-4">Recent Activity</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(e.activity || []).map(a => (
            <div key={a.id} className="text-sm border-l-2 border-primary/40 pl-3">
              <div>{a.description}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
          {(e.activity || []).length === 0 && <div className="text-sm text-muted-foreground">No activity yet</div>}
        </div>
      </Card>

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Login History</div>
        {(e.login_history || []).length === 0 && <div className="text-sm text-muted-foreground">No login events yet</div>}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {(e.login_history || []).map(l => (
            <div key={l.id} className="flex items-center gap-3 text-sm">
              <span className={`h-2 w-2 rounded-full ${l.action === "user.login" ? "bg-emerald-500" : "bg-slate-400"}`} />
              <span>{l.action === "user.login" ? "Signed in" : "Signed out"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <Card className="p-5 border-border">
    <Icon className={`h-5 w-5 ${tone}`} />
    <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </Card>
);
