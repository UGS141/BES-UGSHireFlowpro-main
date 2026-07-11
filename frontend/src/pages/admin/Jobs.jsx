import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Briefcase, MapPin, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Jobs() {
  const qc = useQueryClient();
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: async () => (await api.get("/jobs")).data });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: async () => (await api.get("/companies")).data });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", company_id: "", description: "", skills: "",
    experience_min: 0, experience_max: 5, salary_min: "", salary_max: "", location: "", vacancies: 1 });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    try {
      await api.post("/jobs", {
        ...form,
        company_id: form.company_id,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        experience_min: parseFloat(form.experience_min) || 0,
        experience_max: parseFloat(form.experience_max) || 0,
        salary_min: parseFloat(form.salary_min) || null,
        salary_max: parseFloat(form.salary_max) || null,
        vacancies: parseInt(form.vacancies) || 1,
      });
      toast.success("Job created"); setOpen(false);
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="jobs-page">
      <div className="flex items-center justify-between">
        <div><div className="overline text-primary">Vacancies</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Job Openings</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="add-job-btn"><Plus className="h-4 w-4 mr-1" /> Add Job</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Job Opening</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={on("title")} data-testid="job-title" /></div>
              <div className="col-span-2"><Label>Company</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                  <SelectTrigger data-testid="job-company"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Skills (comma)</Label><Input value={form.skills} onChange={on("skills")} /></div>
              <div><Label>Exp min</Label><Input type="number" value={form.experience_min} onChange={on("experience_min")} /></div>
              <div><Label>Exp max</Label><Input type="number" value={form.experience_max} onChange={on("experience_max")} /></div>
              <div><Label>Salary min</Label><Input type="number" value={form.salary_min} onChange={on("salary_min")} /></div>
              <div><Label>Salary max</Label><Input type="number" value={form.salary_max} onChange={on("salary_max")} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={on("location")} /></div>
              <div><Label>Vacancies</Label><Input type="number" value={form.vacancies} onChange={on("vacancies")} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={on("description")} rows={3} /></div>
            </div>
            <DialogFooter><Button onClick={submit} data-testid="job-submit">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {jobs.map(j => (
          <Link key={j.id} to={`/app/jobs/${j.id}`}>
            <Card className="p-5 border-border hover:-translate-y-0.5 transition-transform cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center"><Briefcase className="h-5 w-5" /></div>
                <StatusPill status={j.status} />
              </div>
              <div className="mt-3 font-display font-semibold text-lg">{j.title}</div>
              <div className="text-xs text-muted-foreground">{j.company_name}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(j.skills || []).slice(0, 5).map(s => <span key={s} className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{s}</span>)}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location || "—"}</span>
                <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />{j.salary_min ? `${(j.salary_min / 100000).toFixed(1)}-${(j.salary_max / 100000).toFixed(1)}L` : "Not disclosed"}</span>
                <span>{j.experience_min}-{j.experience_max || "+"} yrs</span>
                <span>{j.vacancies} vacancy</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
