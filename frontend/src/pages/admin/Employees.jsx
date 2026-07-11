import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Employees() {
  const qc = useQueryClient();
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", designation: "", department: "", password: "" });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try { await api.post("/employees", form); toast.success("Employee created"); setOpen(false);
      setForm({ full_name: "", email: "", phone: "", designation: "", department: "", password: "" });
      qc.invalidateQueries({ queryKey: ["employees"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  return (
    <div className="space-y-6" data-testid="employees-page">
      <div className="flex items-center justify-between">
        <div><div className="overline text-primary">Team</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Employees</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="add-employee-btn"><Plus className="h-4 w-4 mr-1" /> Add Employee</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Employee</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {[["Full Name", "full_name"], ["Email", "email"], ["Phone", "phone"], ["Designation", "designation"], ["Department", "department"], ["Password", "password"]].map(([l, k]) => (
                <div key={k}><Label>{l}</Label><Input type={k === "password" ? "password" : "text"} value={form[k]} onChange={on(k)} data-testid={`emp-${k}`} /></div>
              ))}
            </div>
            <DialogFooter><Button onClick={submit} data-testid="emp-submit">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emps.map(e => (
          <Link key={e.id} to={`/app/employees/${e.id}`}>
            <Card className="p-5 border-border hover:-translate-y-0.5 transition-transform cursor-pointer h-full">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center font-display font-bold">{e.full_name?.[0]}</div>
                <div>
                  <div className="font-display font-semibold">{e.full_name}</div>
                  <div className="text-xs text-muted-foreground">{e.designation || "Recruiter"}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>{e.email}</div><div>{e.phone || "—"}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{e.department || "—"}</span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{e.assigned_count || 0} candidates</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
