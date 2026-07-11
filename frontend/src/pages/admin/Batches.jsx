import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, GraduationCap, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Batches() {
  const qc = useQueryClient();
  const { data: batches = [] } = useQuery({ queryKey: ["batches"], queryFn: async () => (await api.get("/batches")).data });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", technology: "", trainer: "", start_date: "", end_date: "", description: "" });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try { await api.post("/batches", form); toast.success("Batch created"); setOpen(false); qc.invalidateQueries({ queryKey: ["batches"] }); }
    catch { toast.error("Failed"); }
  };
  return (
    <div className="space-y-6" data-testid="batches-page">
      <div className="flex items-center justify-between">
        <div><div className="overline text-primary">Training</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Batches</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="add-batch-btn"><Plus className="h-4 w-4 mr-1" /> Add Batch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Batch</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={on("name")} data-testid="batch-name" /></div>
              <div><Label>Technology</Label><Input value={form.technology} onChange={on("technology")} /></div>
              <div><Label>Trainer</Label><Input value={form.trainer} onChange={on("trainer")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start</Label><Input type="date" value={form.start_date} onChange={on("start_date")} /></div>
                <div><Label>End</Label><Input type="date" value={form.end_date} onChange={on("end_date")} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={on("description")} rows={2} /></div>
            </div>
            <DialogFooter><Button onClick={submit} data-testid="batch-submit">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {batches.map(b => (
          <Link key={b.id} to={`/app/batches/${b.id}`}>
            <Card className="p-5 border-border hover:-translate-y-0.5 transition-transform cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center"><GraduationCap className="h-5 w-5" /></div>
                <StatusPill status={b.status} />
              </div>
              <div className="mt-3 font-display font-semibold text-lg">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.technology} · Trainer: {b.trainer || "—"}</div>
              {b.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{b.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{b.start_date} → {b.end_date}</span>
                <span className="inline-flex items-center gap-1 text-primary"><Users2 className="h-3 w-3" />{(b.candidate_ids || []).length}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
