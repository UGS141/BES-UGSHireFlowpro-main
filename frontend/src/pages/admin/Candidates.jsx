import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, Search, X, Save, Filter as FilterIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusDot";
import { toast } from "sonner";
import api, { API_BASE } from "@/lib/api";

const STATUSES = ["pending_verification", "verified", "assigned", "company_assigned",
  "interview_scheduled", "round_1", "round_2", "technical", "hr", "selected",
  "offer_released", "joined", "placed", "rejected", "waiting"];

export default function Candidates() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [payment, setPayment] = useState(sp.get("payment_status") || "");
  const [employeeId, setEmployeeId] = useState(sp.get("employee_id") || "");
  const [partnerId, setPartnerId] = useState(sp.get("partner_id") || "");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [vendorType, setVendorType] = useState("");
  const [vendorPaymentStatus, setVendorPaymentStatus] = useState("");
  const [experience, setExperience] = useState("");
  const [remainingDays, setRemainingDays] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [prevCompany, setPrevCompany] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [ctcRange, setCtcRange] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "candidates", q, status, payment, employeeId, partnerId, includeArchived,
      vendorType, vendorPaymentStatus, experience, remainingDays,
      experienceType, prevCompany, noticePeriod, ctcRange
    ],
    queryFn: async () => (await api.get("/candidates", { params: {
      q, status, payment_status: payment,
      employee_id: employeeId, partner_id: partnerId,
      include_archived: includeArchived,
      vendor_type: vendorType,
      vendor_payment_status: vendorPaymentStatus,
      experience: experience ? parseFloat(experience) : undefined,
      remaining_days: remainingDays ? parseInt(remainingDays) : undefined,
      experience_type: experienceType,
      previous_company: prevCompany,
      notice_period: noticePeriod,
      ctc_range: ctcRange,
    } })).data,
  });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data });
  const { data: partners = [] } = useQuery({ queryKey: ["partners"], queryFn: async () => (await api.get("/partners")).data });
  const { data: savedFilters = [], refetch: refetchSaved } = useQuery({
    queryKey: ["saved-filters"],
    queryFn: async () => (await api.get("/filters/saved", { params: { entity: "candidates" } })).data,
  });

  const items = data?.items || [];
  const partnerObj = partners.find(p => p.id === partnerId);

  const clearFilters = () => {
    setQ(""); setStatus(""); setPayment(""); setEmployeeId(""); setPartnerId(""); setIncludeArchived(false);
    setVendorType(""); setVendorPaymentStatus(""); setExperience(""); setRemainingDays("");
    setExperienceType(""); setPrevCompany(""); setNoticePeriod(""); setCtcRange("");
    setSp({});
  };

  const saveCurrent = async () => {
    const name = prompt("Filter name?");
    if (!name) return;
    const fd = new FormData();
    fd.append("name", name); fd.append("entity", "candidates");
    fd.append("filters", JSON.stringify({ q, status, payment, employee_id: employeeId, partner_id: partnerId }));
    try { await api.post("/filters/saved", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Filter saved"); refetchSaved();
    } catch { toast.error("Save failed"); }
  };
  const applySaved = (f) => {
    setQ(f.filters.q || ""); setStatus(f.filters.status || "");
    setPayment(f.filters.payment || ""); setEmployeeId(f.filters.employee_id || "");
    setPartnerId(f.filters.partner_id || "");
  };
  const removeSaved = async (fid) => {
    await api.delete(`/filters/saved/${fid}`); refetchSaved();
  };

  const exportXlsx = async () => {
    const token = localStorage.getItem("ugs_token");
    const params = new URLSearchParams({ status, employee_id: employeeId, partner_id: partnerId, payment_status: payment });
    const r = await fetch(`${API_BASE}/candidates/export/xlsx?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return toast.error("Export failed");
    const blob = await r.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "candidates.xlsx"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to Excel");
  };

  return (
    <div className="space-y-6" data-testid="candidates-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="overline text-primary">Directory</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Candidates</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportXlsx} data-testid="export-xlsx-btn"><Download className="h-4 w-4 mr-2" /> Export Excel</Button>
          <Button variant="outline" onClick={() => setShowImport(true)} data-testid="open-import-btn"><Upload className="h-4 w-4 mr-2" /> Import Excel</Button>
        </div>
      </div>

      {/* Applied partner banner */}
      {partnerObj && (
        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <FilterIcon className="h-4 w-4 text-primary" />
            <span>Filtered by partner: <strong>{partnerObj.name}</strong> ({partnerObj.partner_code}) — {partnerObj.candidate_count || 0} candidates</span>
          </div>
          <button onClick={() => setPartnerId("")} className="text-xs text-primary hover:underline" data-testid="clear-partner-filter"><X className="h-3.5 w-3.5 inline" /> clear</button>
        </div>
      )}

      <Card className="p-4 border-border">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone, code, skills, reference..." className="pl-9" data-testid="candidates-search" />
          </div>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48" data-testid="candidates-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payment || "all"} onValueChange={(v) => setPayment(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="candidates-payment-filter"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={employeeId || "all"} onValueChange={(v) => setEmployeeId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-52" data-testid="candidates-employee-filter"><SelectValue placeholder="Recruiter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All recruiters</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={partnerId || "all"} onValueChange={(v) => setPartnerId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-56" data-testid="candidates-partner-filter"><SelectValue placeholder="Partner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partners</SelectItem>
              {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.candidate_count || 0})</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={vendorType || "all"} onValueChange={(v) => setVendorType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="candidates-vendor-type-filter"><SelectValue placeholder="Vendor Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              <SelectItem value="White Vendor">White Vendor</SelectItem>
              <SelectItem value="Blue Vendor">Blue Vendor</SelectItem>
              <SelectItem value="Green Vendor">Green Vendor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vendorPaymentStatus || "all"} onValueChange={(v) => setVendorPaymentStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44" data-testid="candidates-vendor-status-filter"><SelectValue placeholder="Vendor Pay Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendor Payments</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Hold">Hold</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Min Exp (Years)"
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-36"
            data-testid="candidates-experience-filter"
          />

          <Input
            placeholder="Max Rem. Days"
            type="number"
            value={remainingDays}
            onChange={(e) => setRemainingDays(e.target.value)}
            className="w-36"
            data-testid="candidates-remdays-filter"
          />

          <Select value={experienceType || "all"} onValueChange={(v) => setExperienceType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="candidates-experience-type-filter"><SelectValue placeholder="Exp Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Fresher/Exp)</SelectItem>
              <SelectItem value="Fresher">Fresher</SelectItem>
              <SelectItem value="Experienced">Experienced</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Previous Company"
            value={prevCompany}
            onChange={(e) => setPrevCompany(e.target.value)}
            className="w-40"
            data-testid="candidates-prev-company-filter"
          />

          <Select value={noticePeriod || "all"} onValueChange={(v) => setNoticePeriod(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="candidates-notice-period-filter"><SelectValue placeholder="Notice Period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notices</SelectItem>
              {["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"].map(np => (
                <SelectItem key={np} value={np}>{np}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ctcRange || "all"} onValueChange={(v) => setCtcRange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="candidates-ctc-range-filter"><SelectValue placeholder="CTC Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All CTCs</SelectItem>
              <SelectItem value="0-3">0-3 LPA</SelectItem>
              <SelectItem value="3-6">3-6 LPA</SelectItem>
              <SelectItem value="6-10">6-10 LPA</SelectItem>
              <SelectItem value="10+">10+ LPA</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={includeArchived ? "default" : "outline"} size="sm" onClick={() => setIncludeArchived(v => !v)} data-testid="toggle-archived">
            {includeArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters"><X className="h-3.5 w-3.5 mr-1" /> Clear</Button>
          <Button variant="ghost" size="sm" onClick={saveCurrent} data-testid="save-filter"><Save className="h-3.5 w-3.5 mr-1" /> Save filter</Button>
        </div>
        {savedFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground overline">Saved:</span>
            {savedFilters.map(f => (
              <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs">
                <button onClick={() => applySaved(f)} className="hover:text-primary">{f.name}</button>
                <button onClick={() => removeSaved(f.id)} className="text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass border-b border-border">
              <tr className="text-left">
                {["Code", "Name", "Contact", "Status", "Payment", "Experience", "Partner", "Created"].map(h =>
                  <th key={h} className="px-4 py-3 overline text-[10px] text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && items.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No candidates found</td></tr>}
              {items.map(c => {
                const partner = partners.find(p => p.id === c.partner_id);
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors" data-testid={`candidate-row-${c.id}`}>
                    <td className="px-4 py-3 font-medium text-xs">{c.candidate_code}</td>
                    <td className="px-4 py-3"><Link to={`/app/candidates/${c.id}`} className="font-medium text-primary hover:underline">{c.full_name}</Link>{c.is_archived && <span className="ml-2 text-[10px] uppercase text-yellow-600">archived</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}<br />{c.phone}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3"><StatusPill status={c.payment_status} /></td>
                    <td className="px-4 py-3">{c.experience_type === "Experienced" ? (c.total_experience || "Experienced") : "Fresher"}</td>
                    <td className="px-4 py-3 text-xs">{partner ? <span className="text-primary">{partner.name}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="text-xs text-muted-foreground">Total: {data?.total || 0}</div>

      <ExcelImportDialog open={showImport} onClose={() => setShowImport(false)} onImported={refetch} />
    </div>
  );
}

function ExcelImportDialog({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [skipDup, setSkipDup] = useState(true);

  const doPreview = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/candidates/import/xlsx/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview(r.data);
    } catch { toast.error("Preview failed"); }
    finally { setBusy(false); }
  };
  const doImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("skip_duplicates", skipDup);
      const r = await api.post("/candidates/import/xlsx", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported ${r.data.imported}, skipped ${r.data.skipped}`);
      onImported(); onClose(); setFile(null); setPreview(null);
    } catch (e) { toast.error(e?.response?.data?.detail || "Import failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Candidates from Excel</DialogTitle>
          <DialogDescription>Upload an .xlsx or .csv file with columns like full_name, email, phone, skills, city, experience, expected_salary, reference_name, reference_phone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <Upload className="h-5 w-5 text-primary" />
            <div className="flex-1"><div className="text-sm font-medium">{file?.name || "Click to select .xlsx / .csv"}</div>
              <div className="text-xs text-muted-foreground">Max 10MB</div></div>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }} className="hidden" data-testid="import-file" />
          </label>
          {file && !preview && <Button onClick={doPreview} disabled={busy} data-testid="preview-btn">{busy ? "Reading..." : "Preview data"}</Button>}
          {preview && (
            <div>
              <div className="mb-2 text-sm">
                <strong>{preview.total}</strong> rows found · <strong className="text-yellow-600">{preview.duplicates}</strong> potential duplicates
              </div>
              <div className="overflow-x-auto max-h-72 rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800"><tr>
                    {preview.headers.slice(0, 6).map(h => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}
                    <th className="px-2 py-1.5 text-left">Dup?</th>
                  </tr></thead>
                  <tbody>
                    {preview.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border/40">
                        {preview.headers.slice(0, 6).map(h => <td key={h} className="px-2 py-1.5 truncate max-w-[140px]">{String(r[h] || "")}</td>)}
                        <td>{r._duplicate ? <span className="text-yellow-600">yes</span> : <span className="text-emerald-600">no</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} /> Skip duplicates
              </label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {preview && <Button onClick={doImport} disabled={busy} data-testid="import-confirm">{busy ? "Importing..." : `Import ${preview.total} rows`}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
