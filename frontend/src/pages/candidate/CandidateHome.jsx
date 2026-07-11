import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { StatusPill, StatusDot } from "@/components/StatusDot";
import { Building2, Briefcase, User } from "lucide-react";
import api from "@/lib/api";

export default function CandidateHome() {
  const { data } = useQuery({ queryKey: ["me-dash"], queryFn: async () => (await api.get("/dashboard/candidate")).data });
  const c = data?.candidate;
  if (!c) return <div className="text-muted-foreground">Loading your workspace...</div>;

  return (
    <div className="space-y-6 max-w-4xl" data-testid="candidate-workspace">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="overline text-primary">Your Workspace</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Hi, {c.full_name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">{c.candidate_code}</div>
        </div>
        <div className="flex gap-2"><StatusPill status={c.status} /><StatusPill status={c.payment_status} /></div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 border-border">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><span className="overline text-[10px] text-muted-foreground">Recruiter</span></div>
          <div className="mt-2 font-display font-semibold">{c.assigned_employee?.full_name || "Not assigned"}</div>
          {c.assigned_employee && <div className="text-xs text-muted-foreground">{c.assigned_employee.email}</div>}
        </Card>
        <Card className="p-5 border-border">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="overline text-[10px] text-muted-foreground">Company</span></div>
          <div className="mt-2 font-display font-semibold">{c.assigned_company?.name || "—"}</div>
          {c.assigned_company && <div className="text-xs text-muted-foreground">{c.assigned_company.industry}</div>}
        </Card>
        <Card className="p-5 border-border">
          <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /><span className="overline text-[10px] text-muted-foreground">Job Role</span></div>
          <div className="mt-2 font-display font-semibold">{c.assigned_job?.title || "—"}</div>
        </Card>
      </div>

      <Card className="p-6 border-border">
        <h3 className="font-display font-semibold mb-4">Interview Timeline</h3>
        {(c.interview_timeline || []).length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No interview events yet.</div>
        ) : (
          <div className="relative pl-6 border-l-2 border-border/60 space-y-4">
            {c.interview_timeline.map(e => (
              <div key={e.id} className="relative">
                <div className="absolute -left-[27px] top-1"><StatusDot status={e.stage} /></div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <StatusPill status={e.stage} />
                    <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  {e.remarks && <p className="mt-2 text-sm">{e.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 border-border">
        <h3 className="font-display font-semibold mb-4">Payment Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><div className="overline text-[10px] text-muted-foreground">Fee</div><div className="font-display text-2xl font-bold mt-1">₹{(c.registration_fee || 0).toLocaleString("en-IN")}</div></div>
          <div><div className="overline text-[10px] text-muted-foreground">Paid</div><div className="font-display text-2xl font-bold mt-1 text-emerald-600">₹{(c.amount_paid || 0).toLocaleString("en-IN")}</div></div>
          <div><div className="overline text-[10px] text-muted-foreground">Due</div><div className="font-display text-2xl font-bold mt-1 text-red-600">₹{Math.max(0, (c.registration_fee || 0) - (c.amount_paid || 0)).toLocaleString("en-IN")}</div></div>
        </div>
      </Card>
    </div>
  );
}
