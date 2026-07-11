import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Briefcase, Users, Award, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusDot";
import api from "@/lib/api";

export default function CompanyDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["company-history", id],
    queryFn: async () => (await api.get(`/companies/${id}/hiring-history`)).data,
  });
  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const { company: co, stats, jobs } = data;
  return (
    <div className="space-y-6" data-testid="company-detail-page">
      <Link to="/app/companies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Building2 className="h-7 w-7" /></div>
          <div>
            <div className="overline text-primary">Company</div>
            <h1 className="font-display text-3xl font-bold tracking-tighter">{co.name}</h1>
            <div className="text-sm text-muted-foreground">{co.industry} · {co.location}</div>
            {co.website && <a href={co.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> {co.website}</a>}
          </div>
        </div>
        <StatusPill status={co.hiring_status} />
      </div>

      {co.about && <p className="text-slate-600 dark:text-slate-300 max-w-3xl">{co.about}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SC icon={Briefcase} label="Total Jobs" value={stats.total_jobs} tone="text-primary" />
        <SC icon={Briefcase} label="Open Jobs" value={stats.open_jobs} tone="text-emerald-600" />
        <SC icon={Users} label="Active Candidates" value={stats.active_candidates} tone="text-blue-600" />
        <SC icon={Award} label="Placed" value={stats.total_placed} tone="text-purple-600" />
      </div>

      <Card className="p-5 border-border">
        <div className="font-display font-semibold mb-3">HR Contacts</div>
        {(co.hr_contacts || []).length === 0 && <div className="text-sm text-muted-foreground">No HR contacts</div>}
        <div className="grid md:grid-cols-2 gap-3">
          {(co.hr_contacts || []).map((h, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-muted-foreground">{h.role || "—"}</div>
              <div className="text-xs mt-1">{h.email} · {h.phone}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-semibold">Job Openings</div>
          <span className="text-xs text-muted-foreground">{jobs.length} total</span>
        </div>
        {jobs.length === 0 && <div className="text-sm text-muted-foreground">No jobs yet for this company</div>}
        <div className="space-y-2">
          {jobs.map(j => (
            <Link key={j.id} to={`/app/jobs/${j.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-border/40">
              <div>
                <div className="font-medium text-sm">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.location} · {j.vacancies} vacancy · {(j.assigned_candidate_ids || []).length} candidates</div>
              </div>
              <StatusPill status={j.status} />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
const SC = ({ icon: Icon, label, value, tone }) => (
  <Card className="p-5 border-border">
    <Icon className={`h-5 w-5 ${tone}`} />
    <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </Card>
);
