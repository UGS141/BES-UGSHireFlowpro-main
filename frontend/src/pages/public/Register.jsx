import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Upload, FileText, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE } from "@/lib/api";

const QUALIFICATIONS = [
  "Intermediate", "Diploma", "B.Tech", "B.E", "BCA", "MCA", "B.Sc", "M.Sc", "MBA", "M.Tech", "Other"
];

const NOTICE_PERIODS = [
  "Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"
];

const EXPERIENCE_OPTIONS = [
  "0.6 Years", "1 Year", "2 Years", "3 Years", "5 Years"
];

const CTC_OPTIONS = [
  "3.5 LPA", "5 LPA", "8 LPA"
];

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    highest_qualification: "",
    branch_specialization: "",
    tenth_percentage: "",
    intermediate_percentage: "",
    graduation_percentage: "",
    reference_name: "",
    experience_type: "Fresher",
    previous_company: "",
    designation: "",
    total_experience: "",
    current_ctc: "",
    notice_period: "",
  });
  const [files, setFiles] = useState({ resume: null });

  const on = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  
  const onFile = (k) => (e) => {
    const f = e.target.files?.[0];
    if (k === "resume" && f) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (ext !== "pdf") {
        toast.error("Only PDF resumes are accepted.");
        e.target.value = "";
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Maximum allowed file size is 5 MB.");
        e.target.value = "";
        return;
      }
    }
    setFiles(prev => ({ ...prev, [k]: f }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (
      !form.full_name || !form.email || !form.phone || 
      !form.highest_qualification || !form.branch_specialization || 
      !form.tenth_percentage || !form.intermediate_percentage || !form.graduation_percentage
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.experience_type === "Experienced") {
      if (!form.previous_company || !form.designation || !form.total_experience || !form.current_ctc || !form.notice_period) {
        toast.error("Please fill in all professional details.");
        return;
      }
    }
    if (!files.resume) {
      toast.error("Please upload your resume.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const payload = { ...form };
      if (payload.experience_type === "Fresher") {
        payload.previous_company = "";
        payload.designation = "";
        payload.total_experience = "";
        payload.current_ctc = "";
        payload.notice_period = "";
      }
      
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      fd.append("resume", files.resume);

      const resp = await fetch(`${API_BASE}/public/register-candidate-full`, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Registration failed");
      }

      toast.success("Application submitted successfully!");
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card className="p-8 text-center border-border soft-shadow flex flex-col items-center">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full grid place-items-center mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Application Submitted!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Thank you for registering with BES Consultancy. Your profile has been created successfully and is now awaiting verification.
          </p>
          <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-border text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between"><strong>Name:</strong> <span>{form.full_name}</span></div>
            <div className="flex justify-between"><strong>Email:</strong> <span>{form.email}</span></div>
            <div className="flex justify-between"><strong>Mobile:</strong> <span>{form.phone}</span></div>
            <div className="flex justify-between"><strong>Status:</strong> <span className="text-orange-600 font-semibold">Pending Verification</span></div>
          </div>
          <Link to="/" className="w-full">
            <Button className="w-full rounded-full">Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-3 mb-2 justify-center">
        <img src="/favicon.png" alt="UGS" className="h-8 w-8 object-contain" />
        <div className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-[#4A5FBF] via-[#5B8CB5] to-[#3EB489] bg-clip-text text-transparent">
          UGS HireFlow
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Submit Application</h1>
        <p className="text-sm text-slate-500 mt-1.5">Join the BES Consultancy talent network today.</p>
      </div>

      <Card className="p-6 md:p-8 soft-shadow border-border">
        <form onSubmit={submit} className="space-y-5">
          <Section icon={FileText} title="Application Form">
            <div className="grid md:grid-cols-2 gap-4">
              <F label="Full Name" required>
                <Input value={form.full_name} onChange={on("full_name")} required data-testid="reg-name" />
              </F>
              
              <F label="Email Address" required>
                <Input type="email" value={form.email} onChange={on("email")} required data-testid="reg-email" />
              </F>
              
              <F label="Mobile Number" required>
                <Input value={form.phone} onChange={on("phone")} required data-testid="reg-phone" />
              </F>
              
              <F label="Highest Qualification" required>
                <Select 
                  value={form.highest_qualification} 
                  onValueChange={(v) => setForm(f => ({ ...f, highest_qualification: v }))}
                >
                  <SelectTrigger data-testid="reg-highest-qualification">
                    <SelectValue placeholder="Select Qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map(q => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              
              <F label="Branch / Specialization" required>
                <Input 
                  value={form.branch_specialization} 
                  onChange={on("branch_specialization")} 
                  placeholder="e.g. Computer Science, Finance"
                  required 
                  data-testid="reg-branch-specialization" 
                />
              </F>

              <div className="md:col-span-2">
                <Label className="text-xs mb-1.5 block">Experience *</Label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="experience_type" 
                      value="Fresher" 
                      checked={form.experience_type === "Fresher"} 
                      onChange={(e) => setForm(f => ({ ...f, experience_type: e.target.value }))}
                      className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    Fresher
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="experience_type" 
                      value="Experienced" 
                      checked={form.experience_type === "Experienced"} 
                      onChange={(e) => setForm(f => ({ ...f, experience_type: e.target.value }))}
                      className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    Experienced
                  </label>
                </div>
              </div>

              {form.experience_type === "Experienced" && (
                <>
                  <F label="Previous Company Name" required>
                    <Input 
                      value={form.previous_company} 
                      onChange={on("previous_company")} 
                      placeholder="e.g. Acme Corp" 
                      required 
                      data-testid="reg-prev-company" 
                    />
                  </F>
                  <F label="Current / Previous Designation" required>
                    <Input 
                      value={form.designation} 
                      onChange={on("designation")} 
                      placeholder="e.g. Software Engineer" 
                      required 
                      data-testid="reg-designation" 
                    />
                  </F>
                  <F label="Total Experience" required>
                    <Select 
                      value={form.total_experience} 
                      onValueChange={(v) => setForm(f => ({ ...f, total_experience: v }))}
                    >
                      <SelectTrigger data-testid="reg-total-experience">
                        <SelectValue placeholder="Select Experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Current / Previous CTC" required>
                    <Select 
                      value={form.current_ctc} 
                      onValueChange={(v) => setForm(f => ({ ...f, current_ctc: v }))}
                    >
                      <SelectTrigger data-testid="reg-current-ctc">
                        <SelectValue placeholder="Select CTC" />
                      </SelectTrigger>
                      <SelectContent>
                        {CTC_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Notice Period" required>
                    <Select 
                      value={form.notice_period} 
                      onValueChange={(v) => setForm(f => ({ ...f, notice_period: v }))}
                    >
                      <SelectTrigger data-testid="reg-notice-period">
                        <SelectValue placeholder="Select Notice Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTICE_PERIODS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>
                </>
              )}
              
              <F label="10th Percentage / CGPA" required>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={form.tenth_percentage} 
                  onChange={on("tenth_percentage")} 
                  placeholder="e.g. 85.5 or 9.2"
                  required 
                  data-testid="reg-tenth-percentage" 
                />
              </F>
              
              <F label="Intermediate / Diploma % / CGPA" required>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={form.intermediate_percentage} 
                  onChange={on("intermediate_percentage")} 
                  placeholder="e.g. 91.2"
                  required 
                  data-testid="reg-intermediate-percentage" 
                />
              </F>
              
              <F label="Graduation Percentage / CGPA" required>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={form.graduation_percentage} 
                  onChange={on("graduation_percentage")} 
                  placeholder="e.g. 78.4"
                  required 
                  data-testid="reg-graduation-percentage" 
                />
              </F>

              <F label="Reference Name (Optional)">
                <Input 
                  value={form.reference_name} 
                  onChange={on("reference_name")} 
                  placeholder="Who referred you?" 
                  data-testid="reg-ref-name" 
                />
              </F>

              <div className="md:col-span-2">
                <FileField 
                  label="Resume Upload *" 
                  hint="Accepted Format: PDF only | Maximum File Size: 5 MB" 
                  onChange={onFile("resume")} 
                  value={files.resume} 
                  testid="reg-resume" 
                />
              </div>
            </div>
          </Section>

          <div className="flex items-center justify-between border-t border-border pt-5">
            <span className="text-xs text-muted-foreground">
              Already registered? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
            </span>
            <Button type="submit" disabled={loading} data-testid="reg-submit" className="rounded-full">
              {loading ? "Submitting..." : (
                <>Submit Application <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const Section = ({ icon: Icon, title, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="font-display text-lg font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const F = ({ label, required, full, children }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <Label className="text-xs mb-1.5 block">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
    {children}
  </div>
);

const FileField = ({ label, hint, onChange, value, testid, full }) => {
  const summary = value?.name || "No file selected";
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      <label className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Upload className="h-4 w-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{summary}</div>
          <div className="text-xs text-slate-400">{hint || "Any file"}</div>
        </div>
        <input type="file" onChange={onChange} className="hidden" data-testid={testid} />
      </label>
    </div>
  );
};
