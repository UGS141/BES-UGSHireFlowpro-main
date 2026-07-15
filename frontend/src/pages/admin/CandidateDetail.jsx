import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, User, Briefcase, GraduationCap,
  FileText, IndianRupee, Handshake, Clock, Plus, Upload, Archive, Trash2, RotateCcw, GitMerge, ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StatusPill, StatusDot } from "@/components/StatusDot";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const STAGES = ["verified", "assigned", "profile_reviewed", "company_assigned",
  "interview_scheduled", "round_1", "round_2", "technical", "hr",
  "selected", "offer_released", "joined", "placed", "rejected", "waiting"];

export default function CandidateDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => (await api.get(`/candidates/${id}`)).data,
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data,
    enabled: user?.role === "admin",
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-basic"], queryFn: async () => (await api.get("/companies")).data,
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"], queryFn: async () => (await api.get("/partners")).data,
    enabled: user?.role === "admin",
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["candidate", id] });
    qc.invalidateQueries({ queryKey: ["partners"] });
  };

  if (isLoading || !c) return <div className="text-muted-foreground">Loading...</div>;

  const assignEmp = async (empId) => {
    try {
      const fd = new FormData(); fd.append("employee_id", empId);
      await api.post(`/candidates/${id}/assign`, fd);
      toast.success("Assigned"); refresh();
    } catch { toast.error("Failed"); }
  };
  const archive = async () => {
    try { await api.post(`/candidates/${id}/archive`); toast.success("Archived"); refresh(); }
    catch { toast.error("Failed"); }
  };
  const restore = async () => {
    try { await api.post(`/candidates/${id}/restore`); toast.success("Restored"); refresh(); }
    catch { toast.error("Failed"); }
  };
  const softDelete = async () => {
    try { await api.post(`/candidates/${id}/soft-delete`); toast.success("Deleted"); window.location.href = "/app/candidates"; }
    catch { toast.error("Failed"); }
  };
  const permanentDelete = async () => {
    try { await api.delete(`/candidates/${id}/permanent`); toast.success("Permanently deleted"); window.location.href = "/app/candidates"; }
    catch { toast.error("Failed"); }
  };

  const linkedPartner = partners.find(p => p.id === c.partner_id);
  const linkedEmp = employees.find(e => e.id === c.assigned_employee_id);
  const linkedCo = companies.find(co => co.id === c.assigned_company_id);

  return (
    <div className="space-y-6" data-testid="candidate-detail-page">
      <Link to="/app/candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to candidates
      </Link>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT: Profile summary */}
        <Card className="lg:col-span-4 p-6 border-border h-fit sticky top-24">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white grid place-items-center font-display text-2xl font-bold">
              {c.full_name?.[0]}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-xl truncate">{c.full_name}</div>
              <div className="text-xs text-muted-foreground">{c.candidate_code}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={c.status} />
            <StatusPill status={c.payment_status} />
            {c.is_archived && <span className="rounded-full bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 text-xs font-medium">Archived</span>}
          </div>
          {typeof c.profile_completion === "number" && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Profile completion</span><span className="font-semibold">{c.profile_completion}%</span></div>
              <Progress value={c.profile_completion} className="h-1.5" />
            </div>
          )}
          <div className="mt-6 space-y-2.5 text-sm">
            <Row label="Email" value={c.email || "—"} />
            <Row label="Phone" value={c.phone || "—"} />
            <Row label="Experience" value={c.experience_type || "Fresher"} />
            {c.experience_type === "Experienced" && (
              <>
                <Row label="Prev. Company" value={c.previous_company || "—"} />
                <Row label="Notice Period" value={c.notice_period || "—"} />
              </>
            )}
            <Row label="Qualification" value={c.highest_qualification || "—"} />
          </div>

          {/* RELATED */}
          <div className="mt-6 pt-6 border-t border-border space-y-2">
            <div className="overline text-[10px] text-muted-foreground mb-2">Linked Records</div>
            {linkedEmp && <RelatedLink icon={User} label="Recruiter" text={linkedEmp.full_name} to={`/app/employees/${linkedEmp.id}`} />}
            {linkedCo && <RelatedLink icon={Briefcase} label="Company" text={linkedCo.name} to={`/app/companies/${linkedCo.id}`} />}
            {c.assigned_job_id && <RelatedLink icon={Briefcase} label="Job" text="Open Job" to={`/app/jobs/${c.assigned_job_id}`} />}
            {c.batch_id && <RelatedLink icon={GraduationCap} label="Batch" text="Batch" to={`/app/batches/${c.batch_id}`} />}
            {linkedPartner && <RelatedLink icon={Handshake} label="Partner" text={linkedPartner.name} to={`/app/candidates?partner_id=${linkedPartner.id}`} />}
            {!linkedEmp && !linkedCo && !c.batch_id && !linkedPartner && <div className="text-xs text-muted-foreground italic">No linked records yet</div>}
          </div>

          {user?.role === "admin" && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {c.status === "pending_verification" && (
                <VerifyDialog candidateId={c.id} candidate={c} partners={partners} onDone={refresh} />
              )}
              <div>
                <Label className="text-xs mb-1.5 block">Assign Recruiter</Label>
                <Select value={c.assigned_employee_id || "unassigned"} onValueChange={(v) => v !== "unassigned" && assignEmp(v)}>
                  <SelectTrigger data-testid="assign-employee-select"><SelectValue placeholder="Select recruiter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {!c.is_archived
                  ? <Button size="sm" variant="outline" onClick={archive} data-testid="archive-btn"><Archive className="h-3.5 w-3.5 mr-1" /> Archive</Button>
                  : <Button size="sm" variant="outline" onClick={restore} data-testid="restore-btn"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore</Button>}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" data-testid="delete-btn"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Soft-delete keeps records but hides the candidate. Permanent delete removes everything and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={softDelete}>Soft Delete</AlertDialogAction>
                      <AlertDialogAction onClick={permanentDelete} className="bg-red-600 hover:bg-red-700">Permanent Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <MergeDialog candidateId={c.id} candidateName={c.full_name} onDone={() => window.location.href = "/app/candidates"} />
              </div>
            </div>
          )}
        </Card>

        {/* RIGHT: Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="overview" data-testid="tab-overview"><User className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
              <TabsTrigger value="pipeline" data-testid="tab-pipeline"><Briefcase className="h-4 w-4 mr-1.5" />Pipeline</TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-documents"><FileText className="h-4 w-4 mr-1.5" />Documents</TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments"><IndianRupee className="h-4 w-4 mr-1.5" />Payments</TabsTrigger>
              <TabsTrigger value="partner" data-testid="tab-partner"><Handshake className="h-4 w-4 mr-1.5" />Partner</TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-activity"><Clock className="h-4 w-4 mr-1.5" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Profile Summary Card */}
              <Card className="p-6 border-border">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">Profile Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem label="Candidate Name" value={c.full_name} />
                  <InfoItem label="Candidate ID" value={c.candidate_code} />
                  <InfoItem label="Status" value={<StatusPill status={c.status} />} />
                  <InfoItem label="Recruiter" value={linkedEmp?.full_name || "—"} />
                  <InfoItem label="Partner" value={linkedPartner?.name || "—"} />
                  <InfoItem label="Payment Status" value={<StatusPill status={c.payment_status} />} />
                  <InfoItem label="Verification Status" value={c.status === "pending_verification" ? "Pending Verification" : "Verified"} />
                  <InfoItem 
                    label="Resume Status" 
                    value={
                      c.resume_file_id ? (
                        <a 
                          href={`${API_BASE}/files/${c.resume_file_id}/download?auth=${localStorage.getItem("ugs_token")}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary hover:underline font-semibold"
                        >
                          View Uploaded Resume (PDF)
                        </a>
                      ) : "Not Uploaded"
                    } 
                  />
                </div>
              </Card>

              {/* Personal Details Card */}
              <Card className="p-6 border-border">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">Personal & Education Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem label="Full Name" value={c.full_name} />
                  <InfoItem label="Email" value={c.email} />
                  <InfoItem label="Phone" value={c.phone} />
                  <InfoItem label="Highest Qualification" value={c.highest_qualification} />
                  <InfoItem label="Branch / Specialization" value={c.branch_specialization} />
                  <InfoItem label="10th Percentage / CGPA" value={c.tenth_percentage ? `${c.tenth_percentage}%` : "—"} />
                  <InfoItem label="Intermediate / Diploma %" value={c.intermediate_percentage ? `${c.intermediate_percentage}%` : "—"} />
                  <InfoItem label="Graduation %" value={c.graduation_percentage ? `${c.graduation_percentage}%` : "—"} />
                  <InfoItem label="Reference Name" value={c.reference_name || "—"} />
                </div>
              </Card>

              {/* Professional Details Card */}
              <Card className="p-6 border-border">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">Professional Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem label="Experience Status" value={c.experience_type || "Fresher"} />
                  {c.experience_type === "Experienced" && (
                    <>
                      <InfoItem label="Previous Company" value={c.previous_company} />
                      <InfoItem label="Designation" value={c.designation} />
                      <InfoItem label="Total Experience" value={c.total_experience} />
                      <InfoItem label="Current / Previous CTC" value={c.current_ctc} />
                      <InfoItem label="Notice Period" value={c.notice_period} />
                    </>
                  )}
                </div>
              </Card>

              {/* Skills section if any */}
              {c.skills && c.skills.length > 0 && (
                <Card className="p-6 border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-display font-semibold">Key Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map(s => <span key={s} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium">{s}</span>)}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="mt-6">
              <PipelineTab candidate={c} companies={companies} onUpdate={refresh} />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <DocumentsTab candidate={c} onUpdate={refresh} />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentsTab candidate={c} onUpdate={refresh} />
            </TabsContent>

            <TabsContent value="partner" className="mt-6">
              <PartnerTab candidate={c} onUpdate={refresh} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ActivityTab candidateId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right truncate">{value}</span>
  </div>
);
const InfoItem = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
    <span className="text-sm font-semibold text-slate-850 dark:text-slate-100">{value !== undefined && value !== null && value !== "" ? value : "—"}</span>
  </div>
);
const RelatedLink = ({ icon: Icon, label, text, to }) => (
  <Link to={to} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 hover:bg-primary/5 hover:border-primary/30 transition-colors">
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{text}</div>
      </div>
    </div>
    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  </Link>
);
const Section = ({ title, icon: Icon, children }) => (
  <Card className="p-5 border-border">
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <div className="font-display font-semibold">{title}</div>
    </div>
    {children}
  </Card>
);
const Empty = ({ text }) => <div className="text-sm text-muted-foreground italic">{text}</div>;

function PipelineTab({ candidate, companies, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("interview_scheduled");
  const [companyId, setCompanyId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const submit = async () => {
    try {
      await api.post(`/candidates/${candidate.id}/interview-events`, {
        stage, company_id: companyId || null, remarks,
        scheduled_at: scheduledAt || null, status: "scheduled",
      });
      toast.success("Stage updated"); setOpen(false); onUpdate();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display font-semibold">Interview Timeline</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" data-testid="add-stage-btn"><Plus className="h-4 w-4 mr-1" /> Add Stage</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Interview Stage</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Company</Label>
                <Select value={companyId || "none"} onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Scheduled at</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
              <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter><Button onClick={submit} data-testid="add-stage-submit">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative pl-6 border-l-2 border-border/60 space-y-5">
        {(candidate.interview_timeline || []).length === 0 && <Empty text="No events yet" />}
        {(candidate.interview_timeline || []).map(e => (
          <div key={e.id} className="relative">
            <div className="absolute -left-[27px] top-1"><StatusDot status={e.stage} /></div>
            <div className="rounded-xl border border-border p-4 bg-white dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <StatusPill status={e.stage} />
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              {e.remarks && <div className="mt-2 text-sm">{e.remarks}</div>}
              <div className="mt-2 text-xs text-muted-foreground">By {e.updated_by_name || "System"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab({ candidate, onUpdate }) {
  const [label, setLabel] = useState("resume");
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData();
    fd.append("file", file); fd.append("label", label); fd.append("candidate_id", candidate.id);
    try { await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Uploaded"); onUpdate();
    } catch { toast.error("Upload failed"); }
    e.target.value = "";
  };
  return (
    <div className="space-y-4">
      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">Upload Document</div>
        <div className="flex gap-3">
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="resume">Resume</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="id_proof">ID Proof</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="offer_letter">Offer Letter</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <label className="cursor-pointer">
            <input type="file" onChange={upload} className="hidden" data-testid="doc-upload-input" />
            <Button asChild><span><Upload className="h-4 w-4 mr-1" /> Upload</span></Button>
          </label>
        </div>
      </Card>
      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">Files</div>
        <div className="space-y-2 text-sm">
          {candidate.resume_file_id && <FileRow label="Resume" fileId={candidate.resume_file_id} />}
          {candidate.photo_file_id && <FileRow label="Photo" fileId={candidate.photo_file_id} />}
          {(candidate.documents || []).map(d => <FileRow key={d.id} label={d.label} fileId={d.file_id} />)}
          {!candidate.resume_file_id && !candidate.photo_file_id && (candidate.documents || []).length === 0 && <Empty text="No documents uploaded" />}
        </div>
      </Card>
    </div>
  );
}

function FileRow({ label, fileId }) {
  const token = localStorage.getItem("ugs_token");
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/files/${fileId}/download?auth=${token}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="capitalize">{label}</span></div>
      <span className="text-xs text-primary hover:underline">View</span>
    </a>
  );
}

function PaymentsTab({ candidate, onUpdate }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("upi");
  const [remarks, setRemarks] = useState("");
  
  const [vendorType, setVendorType] = useState(candidate.vendor_type || "");
  const [vendorPeriod, setVendorPeriod] = useState(candidate.vendor_payment_period || "");
  const [vendorStatus, setVendorStatus] = useState(candidate.vendor_payment_status || "Pending");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount) return;
    try {
      await api.post(`/candidates/${candidate.id}/payments`,
        { amount: parseFloat(amount), payment_mode: mode, remarks });
      toast.success("Payment recorded"); setAmount(""); setRemarks(""); onUpdate();
    } catch { toast.error("Failed"); }
  };

  const saveVendorSettings = async () => {
    setSaving(true);
    try {
      await api.patch(`/candidates/${candidate.id}`, {
        vendor_type: vendorType,
        vendor_payment_period: vendorPeriod,
        vendor_payment_status: vendorStatus
      });
      toast.success("Vendor settings saved");
      onUpdate();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const fee = candidate.registration_fee || 0;
  const paid = candidate.amount_paid || 0;
  
  const formatExpectedDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Fee" value={`₹${fee.toLocaleString("en-IN")}`} />
        <Stat label="Paid" value={`₹${paid.toLocaleString("en-IN")}`} tone="text-emerald-600" />
        <Stat label="Due" value={`₹${Math.max(0, fee - paid).toLocaleString("en-IN")}`} tone="text-red-600" />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border-border">
          <div className="font-display font-semibold mb-3">Record Fee Payment</div>
          <div className="grid grid-cols-1 gap-3">
            <Input placeholder="Amount ₹" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="payment-amount" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <Button onClick={submit} data-testid="add-payment-btn">Add Payment</Button>
          </div>
        </Card>

        <Card className="p-5 border-border">
          <div className="font-display font-semibold mb-3 font-semibold">Vendor Configuration</div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Vendor Type</Label>
                <Select value={vendorType || "none"} onValueChange={(v) => setVendorType(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Specified</SelectItem>
                    <SelectItem value="White Vendor">White Vendor</SelectItem>
                    <SelectItem value="Blue Vendor">Blue Vendor</SelectItem>
                    <SelectItem value="Green Vendor">Green Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Period</Label>
                <Select value={vendorPeriod || "none"} onValueChange={(v) => setVendorPeriod(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Specified</SelectItem>
                    <SelectItem value="20 Days">20 Days</SelectItem>
                    <SelectItem value="30 Days">30 Days</SelectItem>
                    <SelectItem value="45 Days">45 Days</SelectItem>
                    <SelectItem value="60 Days">60 Days</SelectItem>
                    <SelectItem value="90 Days">90 Days</SelectItem>
                    <SelectItem value="120 Days">120 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Status</Label>
              <Select value={vendorStatus} onValueChange={setVendorStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveVendorSettings} className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Vendor Settings"}
            </Button>
          </div>
        </Card>
      </div>

      {candidate.expected_vendor_payment_date && (
        <Card className="p-5 border-border bg-slate-50 dark:bg-slate-900/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected Payment Date</div>
            <div className="font-semibold mt-1 text-slate-800 dark:text-slate-200">
              {formatExpectedDate(candidate.expected_vendor_payment_date)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining Days</div>
            <div className="font-semibold mt-1">
              {candidate.vendor_payment_status === "Received" ? (
                <span className="text-emerald-600 font-bold">Received</span>
              ) : candidate.vendor_remaining_days !== null ? (
                <span className={candidate.vendor_remaining_days < 0 ? "text-red-500 font-bold" : "text-slate-800 dark:text-slate-200"}>
                  {candidate.vendor_remaining_days} Days
                </span>
              ) : (
                "N/A"
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vendor Type</div>
            <div className="font-semibold mt-1 text-slate-800 dark:text-slate-200">{candidate.vendor_type || "N/A"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment Status</div>
            <div className="font-semibold mt-1">
              <span className={
                candidate.vendor_payment_status === "Received" ? "text-emerald-600 font-bold" :
                candidate.vendor_payment_status === "Hold" ? "text-amber-600 font-bold" :
                "text-red-500 font-bold"
              }>
                {candidate.vendor_payment_status || "Pending"}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">History</div>
        {(candidate.payments || []).length === 0 ? <Empty text="No payments yet" /> :
          <div className="space-y-2 text-sm">
            {candidate.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><div className="font-medium">₹{p.amount.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">{p.payment_mode} · {p.receipt_number}</div></div>
                <div className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>}
      </Card>
    </div>
  );
}

const Stat = ({ label, value, tone = "" }) => (
  <Card className="p-4 border-border">
    <div className="overline text-[10px] text-muted-foreground">{label}</div>
    <div className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</div>
  </Card>
);

function PartnerTab({ candidate, onUpdate }) {
  const p = candidate.partner || {};
  const [form, setForm] = useState({ name: p.name || "", contact: p.contact || "",
    email: p.email || "", commission_percent: p.commission_percent || "", notes: p.notes || "" });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try {
      await api.patch(`/candidates/${candidate.id}/partner`, {
        ...form, commission_percent: parseFloat(form.commission_percent) || null,
      });
      toast.success("Partner info updated"); onUpdate();
    } catch { toast.error("Failed"); }
  };
  return (
    <Card className="p-5 border-border">
      <div className="font-display font-semibold mb-3">Partner / Referral Info</div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><Label>Partner Name</Label><Input value={form.name} onChange={on("name")} data-testid="partner-name" /></div>
        <div><Label>Contact</Label><Input value={form.contact} onChange={on("contact")} /></div>
        <div><Label>Email</Label><Input value={form.email} onChange={on("email")} /></div>
        <div><Label>Commission %</Label><Input type="number" value={form.commission_percent} onChange={on("commission_percent")} /></div>
        <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={on("notes")} rows={3} /></div>
      </div>
      <Button onClick={submit} className="mt-4" data-testid="partner-save-btn">Save</Button>
    </Card>
  );
}

function ActivityTab({ candidateId }) {
  const { data = [] } = useQuery({
    queryKey: ["activity", candidateId],
    queryFn: async () => (await api.get("/activity-logs", { params: { entity_id: candidateId } })).data,
  });
  return (
    <Card className="p-5 border-border">
      <div className="font-display font-semibold mb-3">Activity Log</div>
      {data.length === 0 ? <Empty text="No activity yet" /> :
        <div className="space-y-3">{data.map(a => (
          <div key={a.id} className="text-sm border-l-2 border-primary/40 pl-3">
            <div>{a.description}</div>
            <div className="text-xs text-muted-foreground">{a.actor_name || "System"} · {new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))}</div>}
    </Card>
  );
}

/** Verify dialog: shows reference info from registration; admin picks existing partner
    from searchable dropdown OR creates a new one (pre-filled from reference). */
function VerifyDialog({ candidateId, candidate, partners, onDone }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("none");  // none | existing | new
  const [partnerId, setPartnerId] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [newPartner, setNewPartner] = useState({
    name: candidate.reference_name || "",
    phone: candidate.reference_phone || "",
    email: "", notes: "", commission_percent: "",
  });
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredPartners = partners.filter(p => {
    const q = partnerSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.phone || "").includes(q)
      || (p.partner_code || "").toLowerCase().includes(q);
  });

  React.useEffect(() => {
    // Auto-preselect if reference matches an existing partner by phone
    if (open && candidate.reference_phone) {
      const match = partners.find(p => p.phone === candidate.reference_phone);
      if (match) { setMode("existing"); setPartnerId(match.id); }
      else if (candidate.reference_name || candidate.reference_phone) { setMode("new"); }
    }
  }, [open]); // eslint-disable-line

  const submit = async () => {
    setBusy(true);
    try {
      const body = { remarks: remarks || null };
      if (mode === "existing" && partnerId) body.partner_id = partnerId;
      if (mode === "new" && newPartner.name && newPartner.phone) {
        body.new_partner = {
          ...newPartner,
          commission_percent: parseFloat(newPartner.commission_percent) || null,
        };
      }
      await api.post(`/candidates/${candidateId}/verify-v2`, body);
      toast.success("Candidate verified");
      setOpen(false); onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" data-testid="verify-btn">
          <CheckCircle2 className="h-4 w-4 mr-2" /> Verify Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verify Candidate</DialogTitle>
          <DialogDescription>Review reference information and link to a Partner (optional).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {(candidate.reference_name || candidate.reference_phone) && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <div className="overline text-[10px] text-primary mb-1">Reference from Registration</div>
              <div className="font-medium">{candidate.reference_name || "Not provided"}</div>
              <div className="text-xs text-muted-foreground">{candidate.reference_phone || "No phone"}</div>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1.5 block">Partner Linking</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={mode === "none" ? "default" : "outline"} onClick={() => setMode("none")}>None</Button>
              <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")} data-testid="mode-existing">Select existing</Button>
              <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")} data-testid="mode-new">Create new</Button>
            </div>
          </div>

          {mode === "existing" && (
            <div className="space-y-2">
              <Input placeholder="Search partners by name, phone, code..." value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)} data-testid="partner-search" />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                {filteredPartners.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No partners</div>}
                {filteredPartners.map(p => (
                  <button key={p.id} type="button" onClick={() => setPartnerId(p.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/40 last:border-0 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 ${partnerId === p.id ? "bg-primary/10" : ""}`}
                    data-testid={`partner-option-${p.id}`}>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.phone} · {p.partner_code} · {p.candidate_count || 0} candidates</div>
                    </div>
                    {partnerId === p.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "new" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Partner Name*</Label><Input value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} data-testid="new-partner-name" /></div>
              <div><Label className="text-xs">Phone*</Label><Input value={newPartner.phone}
                onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })} data-testid="new-partner-phone" /></div>
              <div><Label className="text-xs">Email</Label><Input value={newPartner.email}
                onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })} /></div>
              <div><Label className="text-xs">Commission %</Label><Input type="number" value={newPartner.commission_percent}
                onChange={(e) => setNewPartner({ ...newPartner, commission_percent: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea rows={2} value={newPartner.notes}
                onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })} /></div>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1.5 block">Verification Remarks (optional)</Label>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="verify-submit">{busy ? "Verifying..." : "Verify"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeDialog({ candidateId, candidateName, onDone }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const { data } = useQuery({
    queryKey: ["merge-candidates", search],
    queryFn: async () => (await api.get("/candidates", { params: { q: search, limit: 20 } })).data,
    enabled: open && search.length >= 2,
  });
  const submit = async () => {
    if (!selected) return;
    try {
      await api.post("/candidates/merge", { source_id: candidateId, target_id: selected });
      toast.success("Merged"); setOpen(false); onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Merge failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="merge-btn"><GitMerge className="h-3.5 w-3.5 mr-1" /> Merge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge candidate</DialogTitle>
          <DialogDescription>Merge <strong>{candidateName}</strong> into another candidate. Payments, timeline, notes and documents move over. This candidate will be soft-deleted.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search target candidate..." value={search} onChange={(e) => setSearch(e.target.value)} data-testid="merge-search" />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {(data?.items || []).filter(c => c.id !== candidateId).map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border ${selected === c.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
              <div className="text-sm font-medium">{c.full_name}</div>
              <div className="text-xs text-muted-foreground">{c.candidate_code} · {c.email}</div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!selected} data-testid="merge-submit">Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
