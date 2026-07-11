import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, MapPin, IndianRupee, Users, Award, X, Plus, Lock, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api from "@/lib/api";

export default function JobWorkspace() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["job-workspace", id],
    queryFn: async () => (await api.get(`/jobs/${id}/workspace`)).data,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["job-workspace", id] });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const { job, company, candidates, stats } = data;

  const close = async () => { await api.post(`/jobs/${id}/close`); toast.success("Job closed"); refresh(); };
  const reopen = async () => { await api.post(`/jobs/${id}/reopen`); toast.success("Job reopened"); refresh(); };
  const removeCandidate = async (cid) => {
    const fd = new FormData(); fd.append("candidate_id", cid);
    await api.post(`/jobs/${id}/remove-candidate`, fd);
    toast.success("Removed"); refresh();
  };

  return (
    <div className="space-y-6" data-testid="job-workspace-page">
      <Link to="/app/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Briefcase className="h-7 w-7" /></div>
          <div>
            <div className="overline text-primary">Job Opening</div>
            <h1 className="font-display text-3xl font-bold tracking-tighter">{job.title}</h1>
            {company && <Link to={`/app/companies/${company.id}`} className="text-sm text-primary hover:underline">{company.name}</Link>}
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location || "—"}</span>
              <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />
                {job.salary_min ? `${(job.salary_min / 100000).toFixed(1)}-${(job.salary_max / 100000).toFixed(1)}L` : "Not disclosed"}
              </span>
              <span>{job.experience_min}-{job.experience_max || "+"} yrs</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          {job.status === "open"
            ? <Button variant="outline" size="sm" onClick={close} data-testid="close-job"><Lock className="h-3.5 w-3.5 mr-1" /> Close job</Button>
            : <Button variant="outline" size="sm" onClick={reopen} data-testid="reopen-job"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen</Button>}
          <AllocateDialog jobId={id} onDone={refresh} />
        </div>
      </div>

      {job.description && <p className="text-slate-600 dark:text-slate-300 max-w-4xl">{job.description}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SC label="Vacancies" value={job.vacancies} tone="text-primary" />
        <SC label="Allocated" value={stats.allocated} tone="text-blue-600" />
        <SC label="Placed" value={stats.placed} tone="text-emerald-600" />
        <SC label="Remaining" value={stats.vacancies_remaining} tone="text-purple-600" />
      </div>

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">Skills Required</div>
        <div className="flex flex-wrap gap-2">
          {(job.skills || []).map(s => <span key={s} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs">{s}</span>)}
          {(job.skills || []).length === 0 && <span className="text-sm text-muted-foreground">None specified</span>}
        </div>
      </Card>

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">Allocated Candidates ({candidates.length})</div>
        {candidates.length === 0 && <div className="text-sm text-muted-foreground">No candidates allocated yet. Click "Allocate" above.</div>}
        <div className="space-y-2">
          {candidates.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <Link to={`/app/candidates/${c.id}`} className="flex-1">
                <div className="text-sm font-medium text-primary hover:underline">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email} · {(c.skills || []).slice(0, 3).join(", ")}</div>
              </Link>
              <StatusPill status={c.status} />
              <Button variant="ghost" size="sm" onClick={() => removeCandidate(c.id)} className="text-red-500 hover:text-red-600" data-testid={`remove-${c.id}`}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AllocateDialog({ jobId, onDone }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const { data } = useQuery({
    queryKey: ["allocate-search", q, open],
    queryFn: async () => (await api.get("/candidates", { params: { q, limit: 30 } })).data,
    enabled: open,
  });
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const submit = async () => {
    if (!selected.length) return;
    await api.post(`/jobs/${jobId}/assign-candidates`, selected);
    toast.success(`Allocated ${selected.length} candidate(s)`);
    setOpen(false); setSelected([]); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" data-testid="allocate-btn"><Plus className="h-4 w-4 mr-1" /> Allocate Candidates</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bulk Allocate</DialogTitle><DialogDescription>Select candidates to add to this job.</DialogDescription></DialogHeader>
        <Input placeholder="Search candidates..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="alloc-search" />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {(data?.items || []).map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <div className="flex-1">
                <div className="text-sm font-medium">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email}</div>
              </div>
              <StatusPill status={c.status} />
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!selected.length} data-testid="alloc-submit">Allocate ({selected.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SC = ({ label, value, tone }) => (
  <Card className="p-5 border-border">
    <div className="overline text-[10px] text-muted-foreground">{label}</div>
    <div className={`mt-1 font-display text-3xl font-bold ${tone}`}>{value}</div>
  </Card>
);
