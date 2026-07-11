import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Users, X, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api from "@/lib/api";

export default function BatchDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: b, isLoading } = useQuery({
    queryKey: ["batch-detail", id],
    queryFn: async () => (await api.get(`/batches/${id}`)).data,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["batch-detail", id] });

  if (isLoading || !b) return <div className="text-muted-foreground">Loading...</div>;

  const remove = async (cid) => {
    const fd = new FormData(); fd.append("candidate_id", cid);
    await api.post(`/batches/${id}/remove-candidate`, fd);
    toast.success("Removed"); refresh();
  };
  const setRunning = async () => { await api.post(`/batches/${id}/mark-running`); toast.success("Running"); refresh(); };
  const setCompleted = async () => { await api.post(`/batches/${id}/mark-completed`); toast.success("Completed"); refresh(); };

  return (
    <div className="space-y-6" data-testid="batch-detail-page">
      <Link to="/app/batches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to batches
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary grid place-items-center"><GraduationCap className="h-7 w-7" /></div>
          <div>
            <div className="overline text-primary">Batch</div>
            <h1 className="font-display text-3xl font-bold tracking-tighter">{b.name}</h1>
            <div className="text-sm text-muted-foreground">{b.technology} · Trainer: {b.trainer || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">{b.start_date} → {b.end_date}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={b.status} />
          {b.status !== "running" && <Button size="sm" variant="outline" onClick={setRunning} data-testid="mark-running"><Play className="h-3.5 w-3.5 mr-1" /> Mark Running</Button>}
          {b.status !== "completed" && <Button size="sm" variant="outline" onClick={setCompleted} data-testid="mark-completed"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Completed</Button>}
        </div>
      </div>

      {b.description && <p className="text-slate-600 dark:text-slate-300 max-w-4xl">{b.description}</p>}

      <Card className="p-5 border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Assigned Candidates ({(b.candidates || []).length})</div>
        </div>
        {(b.candidates || []).length === 0 && <div className="text-sm text-muted-foreground">No candidates assigned to this batch</div>}
        <div className="space-y-2">
          {(b.candidates || []).map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <Link to={`/app/candidates/${c.id}`} className="flex-1">
                <div className="text-sm font-medium text-primary hover:underline">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email}</div>
              </Link>
              <StatusPill status={c.status} />
              <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-red-500 hover:text-red-600"><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
