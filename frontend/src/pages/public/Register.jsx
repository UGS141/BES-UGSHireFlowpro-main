import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Upload, User, GraduationCap, Briefcase, FileText, Users2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE } from "@/lib/api";

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    alternate_phone: "", date_of_birth: "", gender: "",
    address: "", city: "", state: "", country: "India", pincode: "",
    skills: "", total_experience_years: "0",
    current_salary: "", expected_salary: "", notice_period_days: "30",
    preferred_locations: "",
    education_degree: "", education_institution: "", education_year: "",
    experience_company: "", experience_role: "", experience_duration: "",
    reference_name: "", reference_phone: "",
    emergency_name: "", emergency_phone: "",
  });
  const [files, setFiles] = useState({
    photo: null, resume: null,
    certificates: [], experience_documents: [], supporting_documents: [],
  });

  const on = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const onFile = (k, multiple = false) => (e) => {
    const f = multiple ? Array.from(e.target.files) : e.target.files?.[0];
    setFiles(prev => ({ ...prev, [k]: f }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.phone) {
        toast.error("Name, email and phone are required"); return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast.error("Invalid email"); return false;
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(4, s + 1)); };
  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (files.photo) fd.append("photo", files.photo);
      if (files.resume) fd.append("resume", files.resume);
      (files.certificates || []).forEach(f => fd.append("certificates", f));
      (files.experience_documents || []).forEach(f => fd.append("experience_documents", f));
      (files.supporting_documents || []).forEach(f => fd.append("supporting_documents", f));

      const resp = await fetch(`${API_BASE}/public/register-candidate-full`, {
        method: "POST", body: fd,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }
      toast.success("Registration successful! Sign in with your credentials.");
      nav("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <img src="/favicon.png" alt="UGS" className="h-10 w-10 object-contain" />
        <div>
          <div className="overline text-primary">Candidate Registration</div>
          <h1 className="font-display text-3xl font-bold tracking-tighter">Join UGS HireFlow</h1>
        </div>
      </div>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Complete your profile and upload documents so our team can match you with opportunities right away.</p>

      {/* Steps */}
      <div className="mt-6 flex items-center gap-2">
        {[
          { n: 1, label: "Personal" },
          { n: 2, label: "Professional" },
          { n: 3, label: "Documents" },
          { n: 4, label: "References" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              step === s.n ? "bg-primary text-primary-foreground"
                : step > s.n ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              <span className="h-5 w-5 rounded-full grid place-items-center bg-white/20 text-[10px] font-bold">
                {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
              </span>
              {s.label}
            </div>
            {i < 3 && <div className="flex-1 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <Card className="mt-6 p-6 md:p-8 soft-shadow border-border">
        <form onSubmit={submit} className="space-y-5">
          {step === 1 && (
            <Section icon={User} title="Personal Information">
              <div className="grid md:grid-cols-2 gap-4">
                <F label="Full Name" required><Input value={form.full_name} onChange={on("full_name")} required data-testid="reg-name" /></F>
                <F label="Email" required><Input type="email" value={form.email} onChange={on("email")} required data-testid="reg-email" /></F>
                <F label="Phone" required><Input value={form.phone} onChange={on("phone")} required data-testid="reg-phone" /></F>
                <F label="Alternate Phone"><Input value={form.alternate_phone} onChange={on("alternate_phone")} /></F>
                <F label="Password (for candidate login)"><Input type="password" value={form.password} onChange={on("password")} data-testid="reg-password" /></F>
                <F label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={on("date_of_birth")} /></F>
                <F label="Gender">
                  <Select value={form.gender || "unspecified"} onValueChange={(v) => setForm({ ...form, gender: v === "unspecified" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Prefer not to say</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="City"><Input value={form.city} onChange={on("city")} data-testid="reg-city" /></F>
                <F label="State"><Input value={form.state} onChange={on("state")} /></F>
                <F label="Pincode"><Input value={form.pincode} onChange={on("pincode")} /></F>
                <F full label="Address"><Input value={form.address} onChange={on("address")} /></F>
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section icon={Briefcase} title="Professional Information">
              <div className="grid md:grid-cols-2 gap-4">
                <F full label="Skills (comma separated)"><Input value={form.skills} onChange={on("skills")} placeholder="React, Python, AWS" data-testid="reg-skills" /></F>
                <F label="Total Experience (years)"><Input type="number" step="0.5" value={form.total_experience_years} onChange={on("total_experience_years")} /></F>
                <F label="Notice Period (days)"><Input type="number" value={form.notice_period_days} onChange={on("notice_period_days")} /></F>
                <F label="Current Salary (₹)"><Input type="number" value={form.current_salary} onChange={on("current_salary")} /></F>
                <F label="Expected Salary (₹)"><Input type="number" value={form.expected_salary} onChange={on("expected_salary")} /></F>
                <F full label="Preferred Locations (comma separated)"><Input value={form.preferred_locations} onChange={on("preferred_locations")} placeholder="Bangalore, Remote" /></F>
                <F label="Highest Degree"><Input value={form.education_degree} onChange={on("education_degree")} /></F>
                <F label="Institution"><Input value={form.education_institution} onChange={on("education_institution")} /></F>
                <F label="Year"><Input value={form.education_year} onChange={on("education_year")} /></F>
                <F label="Latest Company"><Input value={form.experience_company} onChange={on("experience_company")} /></F>
                <F label="Latest Role"><Input value={form.experience_role} onChange={on("experience_role")} /></F>
                <F label="Duration"><Input value={form.experience_duration} onChange={on("experience_duration")} placeholder="e.g., 2 years" /></F>
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section icon={FileText} title="Documents & Photo">
              <p className="text-sm text-muted-foreground -mt-2">Upload during registration — no need to add them later.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <FileField label="Profile Photo" hint="JPG/PNG" onChange={onFile("photo")} value={files.photo} testid="reg-photo" />
                <FileField label="Resume" hint="PDF/DOC" onChange={onFile("resume")} value={files.resume} testid="reg-resume" />
                <FileField multiple label="Educational Certificates" hint="Add multiple" onChange={onFile("certificates", true)} value={files.certificates} testid="reg-certificates" />
                <FileField multiple label="Experience Documents" hint="Offer letters, relieving letters" onChange={onFile("experience_documents", true)} value={files.experience_documents} testid="reg-exp-docs" />
                <FileField multiple full label="Other Supporting Documents" onChange={onFile("supporting_documents", true)} value={files.supporting_documents} testid="reg-supp-docs" />
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section icon={Users2} title="References & Emergency Contact">
              <div className="grid md:grid-cols-2 gap-4">
                <F label="Reference Person Name">
                  <Input value={form.reference_name} onChange={on("reference_name")} placeholder="Who referred you?" data-testid="reg-ref-name" />
                </F>
                <F label="Reference Mobile Number">
                  <Input value={form.reference_phone} onChange={on("reference_phone")} data-testid="reg-ref-phone" />
                </F>
                <F label="Emergency Contact Name"><Input value={form.emergency_name} onChange={on("emergency_name")} /></F>
                <F label="Emergency Contact Phone"><Input value={form.emergency_phone} onChange={on("emergency_phone")} /></F>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-slate-700 dark:text-slate-300">
                <strong>Note:</strong> Reference information helps our admin link you to the correct partner during verification. Both fields are optional.
              </div>
            </Section>
          )}

          <div className="flex items-center justify-between border-t border-border pt-5">
            <span className="text-sm text-muted-foreground">Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link></span>
            <div className="flex gap-2">
              {step > 1 && <Button type="button" variant="outline" onClick={back} data-testid="reg-back">Back</Button>}
              {step < 4 && <Button type="button" onClick={next} data-testid="reg-next">Next <ArrowRight className="h-4 w-4 ml-1.5" /></Button>}
              {step === 4 && <Button type="submit" disabled={loading} data-testid="reg-submit">{loading ? "Submitting..." : "Complete Registration"}</Button>}
            </div>
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
      <h2 className="font-display text-xl font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const F = ({ label, required, full, children }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <Label className="text-xs mb-1.5 block">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
    {children}
  </div>
);

const FileField = ({ label, hint, multiple, onChange, value, testid, full }) => {
  const summary = multiple
    ? (value && value.length ? `${value.length} file(s) selected` : "No files")
    : (value?.name || "No file");
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      <label className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Upload className="h-4 w-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{summary}</div>
          <div className="text-xs text-muted-foreground">{hint || "Any file"}</div>
        </div>
        <input type="file" multiple={multiple} onChange={onChange} className="hidden" data-testid={testid} />
      </label>
    </div>
  );
};
