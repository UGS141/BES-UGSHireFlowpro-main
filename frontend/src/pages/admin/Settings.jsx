import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });
  const change = async (e) => {
    e.preventDefault();
    try { await api.post("/auth/change-password", pwd); toast.success("Password changed"); setPwd({ current_password: "", new_password: "" }); }
    catch (er) { toast.error(er?.response?.data?.detail || "Failed"); }
  };

  const { data: org, isLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => (await api.get("/settings/organization")).data,
  });
  const [orgForm, setOrgForm] = useState(null);
  React.useEffect(() => { if (org && !orgForm) setOrgForm(org); }, [org, orgForm]);
  const onOrg = (k) => (e) => setOrgForm({ ...orgForm, [k]: e.target.value });
  const saveOrg = async (e) => {
    e.preventDefault();
    try {
      await api.put("/settings/organization", orgForm);
      toast.success("Organization settings saved");
      qc.invalidateQueries({ queryKey: ["org-settings"] });
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-page">
      <div><div className="overline text-primary">Account</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Settings</h1></div>

      <Card className="p-6 border-border">
        <h3 className="font-display font-semibold mb-4">Profile</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><Label>Name</Label><Input value={user?.full_name || ""} disabled /></div>
          <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
          <div><Label>Role</Label><Input value={user?.role || ""} disabled className="capitalize" /></div>
        </div>
      </Card>

      <Card className="p-6 border-border">
        <h3 className="font-display font-semibold mb-4">Change Password</h3>
        <form onSubmit={change} className="grid md:grid-cols-2 gap-3">
          <div><Label>Current Password</Label><Input type="password" required value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} data-testid="current-pwd" /></div>
          <div><Label>New Password</Label><Input type="password" required minLength={6} value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} data-testid="new-pwd" /></div>
          <div className="md:col-span-2"><Button data-testid="change-pwd-btn">Update Password</Button></div>
        </form>
      </Card>

      {user?.role === "admin" && (
        <Card className="p-6 border-border">
          <h3 className="font-display font-semibold mb-4">Organization Information</h3>
          {isLoading || !orgForm ? <div className="text-muted-foreground">Loading...</div> : (
            <form onSubmit={saveOrg} className="grid md:grid-cols-2 gap-3">
              <div><Label>Company Name</Label><Input value={orgForm.company_name || ""} onChange={onOrg("company_name")} data-testid="org-name" /></div>
              <div><Label>Brand Name</Label><Input value={orgForm.brand_name || ""} onChange={onOrg("brand_name")} /></div>
              <div><Label>Contact Email</Label><Input value={orgForm.email || ""} onChange={onOrg("email")} /></div>
              <div><Label>Phone</Label><Input value={orgForm.phone || ""} onChange={onOrg("phone")} /></div>
              <div><Label>Website</Label><Input value={orgForm.website || ""} onChange={onOrg("website")} /></div>
              <div><Label>Working Hours</Label><Input value={orgForm.working_hours || ""} onChange={onOrg("working_hours")} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={orgForm.address || ""} onChange={onOrg("address")} rows={2} /></div>
              <div><Label>Default Registration Fee (₹)</Label><Input type="number" value={orgForm.default_registration_fee || 0} onChange={onOrg("default_registration_fee")} /></div>
              <div className="md:col-span-2"><Button type="submit" data-testid="save-org-btn">Save Organization Settings</Button></div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
