import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, EyeOff, Edit3, Trash2, Award, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import api, { API_BASE } from "@/lib/api";

export default function PlacementGallery() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["placements-admin"],
    queryFn: async () => (await api.get("/placements")).data,
  });

  const publish = async (id, publish) => {
    await api.post(`/placements/${id}/${publish ? "publish" : "hide"}`);
    toast.success(publish ? "Published" : "Hidden");
    qc.invalidateQueries({ queryKey: ["placements-admin"] });
  };
  const del = async (id) => {
    if (!confirm("Delete this placement?")) return;
    await api.delete(`/placements/${id}`); toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["placements-admin"] });
  };

  return (
    <div className="space-y-6" data-testid="placements-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="overline text-primary">Website</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Placement Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Curate the success stories shown on your public website homepage.</p>
        </div>
        <PlacementDialog onDone={() => qc.invalidateQueries({ queryKey: ["placements-admin"] })} />
      </div>

      {isLoading && <div className="text-muted-foreground">Loading...</div>}
      {!isLoading && data.length === 0 && (
        <Card className="p-12 border-border text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground/40" strokeWidth={1} />
          <div className="mt-4 font-display text-lg">No placements yet</div>
          <div className="mt-1 text-sm text-muted-foreground">Add your first success story to display on the website.</div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(p => {
          const photo = p.candidate_photo_file_id ? `${API_BASE}/files/${p.candidate_photo_file_id}/download` : null;
          const logo = p.company_logo_file_id ? `${API_BASE}/files/${p.company_logo_file_id}/download` : null;
          return (
            <Card key={p.id} className={`p-5 border-border ${!p.is_published ? "opacity-60" : ""}`} data-testid={`placement-${p.id}`}>
              <div className="flex items-center gap-3">
                {photo ? <img src={photo} alt="" className="h-14 w-14 rounded-xl object-cover" /> :
                  <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xl">{p.candidate_name?.[0]}</div>}
                <div className="min-w-0">
                  <div className="font-display font-semibold truncate">{p.candidate_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.job_role}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {logo ? <img src={logo} alt="" className="h-6 w-6 object-contain bg-white rounded" /> : null}
                <span className="font-medium truncate">{p.company_name}</span>
                {p.package && <span className="ml-auto text-emerald-600 text-xs font-semibold">{p.package}</span>}
              </div>
              {p.short_description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.short_description}</p>}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Order: {p.display_order}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => publish(p.id, !p.is_published)} title={p.is_published ? "Hide" : "Publish"}>
                    {p.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <PlacementDialog placement={p} onDone={() => qc.invalidateQueries({ queryKey: ["placements-admin"] })} />
                  <Button size="icon" variant="ghost" onClick={() => del(p.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PlacementDialog({ placement, onDone }) {
  const editing = !!placement;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    candidate_name: placement?.candidate_name || "",
    company_name: placement?.company_name || "",
    job_role: placement?.job_role || "",
    package: placement?.package || "",
    placement_date: placement?.placement_date || "",
    short_description: placement?.short_description || "",
    display_order: placement?.display_order ?? 0,
    is_published: placement?.is_published ?? true,
  });
  const [candidatePhoto, setCandidatePhoto] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [busy, setBusy] = useState(false);

  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (candidatePhoto) fd.append("candidate_photo", candidatePhoto);
      if (companyLogo) fd.append("company_logo", companyLogo);
      if (editing) {
        await api.patch(`/placements/${placement.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Updated");
      } else {
        await api.post("/placements", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Added");
      }
      setOpen(false); onDone();
    } catch { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing
          ? <Button size="icon" variant="ghost" data-testid={`edit-placement-${placement.id}`}><Edit3 className="h-4 w-4" /></Button>
          : <Button data-testid="add-placement-btn"><Plus className="h-4 w-4 mr-1" /> Add Placement</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} Placement</DialogTitle>
          <DialogDescription>This will appear on the public website homepage.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Candidate Name*</Label><Input value={form.candidate_name} onChange={on("candidate_name")} data-testid="pl-name" /></div>
          <div><Label>Company Name*</Label><Input value={form.company_name} onChange={on("company_name")} data-testid="pl-company" /></div>
          <div><Label>Job Role*</Label><Input value={form.job_role} onChange={on("job_role")} data-testid="pl-role" /></div>
          <div><Label>Package</Label><Input value={form.package} onChange={on("package")} placeholder="₹8 LPA" /></div>
          <div><Label>Placement Date</Label><Input type="date" value={form.placement_date} onChange={on("placement_date")} /></div>
          <div className="col-span-2"><Label>Short Description</Label><Textarea rows={2} value={form.short_description} onChange={on("short_description")} /></div>
          <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={on("display_order")} /></div>
          <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
          <FileInput label="Candidate Photo" onSelect={setCandidatePhoto} file={candidatePhoto} testid="pl-photo" />
          <FileInput label="Company Logo" onSelect={setCompanyLogo} file={companyLogo} testid="pl-logo" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="pl-submit">{busy ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileInput({ label, onSelect, file, testid }) {
  return (
    <div>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      <label className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <Upload className="h-4 w-4 text-primary" />
        <span className="text-xs truncate">{file?.name || "Click to upload"}</span>
        <input type="file" accept="image/*" onChange={(e) => onSelect(e.target.files?.[0])} className="hidden" data-testid={testid} />
      </label>
    </div>
  );
}
