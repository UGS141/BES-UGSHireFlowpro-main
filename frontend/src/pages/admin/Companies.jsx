import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Companies() {
  const qc = useQueryClient();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: async () => (await api.get("/companies")).data });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "", website: "", location: "", about: "" });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try { await api.post("/companies", form); toast.success("Company added");
      setOpen(false); setForm({ name: "", industry: "", website: "", location: "", about: "" });
      qc.invalidateQueries({ queryKey: ["companies"] });
    } catch { toast.error("Failed"); }
  };
  return (
    <div className="space-y-6" data-testid="companies-page">
      <div className="flex items-center justify-between">
        <div><div className="overline text-primary">Clients</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Companies</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="add-company-btn"><Plus className="h-4 w-4 mr-1" /> Add Company</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={on("name")} data-testid="co-name" /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={on("industry")} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={on("website")} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={on("location")} /></div>
              <div><Label>About</Label><Textarea value={form.about} onChange={on("about")} rows={3} /></div>
            </div>
            <DialogFooter><Button onClick={submit} data-testid="co-submit">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => (
          <Link key={c.id} to={`/app/companies/${c.id}`}>
            <Card className="p-5 border-border hover:-translate-y-0.5 transition-transform cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center"><Building2 className="h-6 w-6" /></div>
                <StatusPill status={c.hiring_status} />
              </div>
              <div className="mt-3 font-display font-semibold text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.industry} · {c.location}</div>
              {c.about && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{c.about}</p>}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.open_jobs || 0} open jobs · {c.assigned_candidates || 0} candidates</span>
                {c.website && <a href={c.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Site</a>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
