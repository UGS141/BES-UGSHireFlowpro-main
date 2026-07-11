import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/StatusDot";
import api from "@/lib/api";

const STAGES = [
  { key: "pending_verification", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "assigned", label: "Assigned" },
  { key: "company_assigned", label: "Company Assigned" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "round_1", label: "Round 1" },
  { key: "round_2", label: "Round 2" },
  { key: "technical", label: "Technical" },
  { key: "hr", label: "HR" },
  { key: "selected", label: "Selected" },
  { key: "offer_released", label: "Offer" },
  { key: "placed", label: "Placed" },
  { key: "rejected", label: "Rejected" },
];

export default function Pipeline() {
  const { data } = useQuery({ queryKey: ["pipeline"], queryFn: async () =>
    (await api.get("/candidates", { params: { limit: 500 } })).data });
  const items = data?.items || [];
  const byStage = STAGES.map(s => ({ ...s, list: items.filter(c => c.status === s.key) }));

  return (
    <div className="space-y-6" data-testid="pipeline-page">
      <div>
        <div className="overline text-primary">Interview Pipeline</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Kanban Board</h1>
      </div>
      <div className="flex gap-4 overflow-x-auto pipeline-scroll pb-4">
        {byStage.map(col => (
          <div key={col.key} className="min-w-[280px] w-[280px]">
            <div className="sticky top-0 z-10 glass rounded-t-xl px-3 py-2 flex items-center justify-between border border-border/60 border-b-0">
              <div className="flex items-center gap-2"><StatusDot status={col.key} /><span className="text-sm font-medium">{col.label}</span></div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{col.list.length}</span>
            </div>
            <div className="rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px] bg-slate-50/60 dark:bg-slate-900/30">
              {col.list.map(c => (
                <Link key={c.id} to={`/app/candidates/${c.id}`}>
                  <Card className="p-3 border-border hover:-translate-y-0.5 transition-transform">
                    <div className="font-medium text-sm truncate">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground">{c.candidate_code}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(c.skills || []).slice(0, 2).map(s => <span key={s} className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px]">{s}</span>)}
                    </div>
                  </Card>
                </Link>
              ))}
              {col.list.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Empty</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
