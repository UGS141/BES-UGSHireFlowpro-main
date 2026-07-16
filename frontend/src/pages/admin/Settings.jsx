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

      {user?.role === "admin" && <BannersManagement />}
    </div>
  );
}

function BannersManagement() {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => (await api.get("/banners")).data,
  });

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    if (link) fd.append("link", link);

    try {
      await api.post("/banners", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Banner uploaded successfully");
      setTitle("");
      setLink("");
      setFile(null);
      const fileInput = document.getElementById("banner-file-input");
      if (fileInput) fileInput.value = "";
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bid) => {
    try {
      await api.delete(`/banners/${bid}`);
      toast.success("Banner deleted");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  return (
    <Card className="p-6 border-border">
      <h3 className="font-display font-semibold mb-4">Landing Page Banners & Newsletters</h3>
      
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4 mb-6 border-b border-border pb-6">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="banner-file-input">Banner Image *</Label>
            <Input 
              id="banner-file-input" 
              type="file" 
              accept="image/*" 
              required 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </div>
          <div>
            <Label>Title (Optional)</Label>
            <Input 
              placeholder="e.g. Campus Recruitment Drive 2026" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>
          <div className="md:col-span-2">
            <Label>Redirect Link (Optional)</Label>
            <Input 
              placeholder="e.g. https://example.com/details" 
              value={link} 
              onChange={(e) => setLink(e.target.value)} 
            />
          </div>
        </div>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Banner"}
        </Button>
      </form>

      {/* Banners List */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Current Banners</h4>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="text-muted-foreground text-sm">No banners uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="flex gap-4 p-3 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                <div className="h-16 w-28 bg-muted rounded overflow-hidden shrink-0">
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL || ""}/api/files/${b.file_id}/download`} 
                    alt={b.title || "Banner"} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-sm truncate">{b.title || "Untitled Banner"}</div>
                    {b.link && <div className="text-xs text-muted-foreground truncate">{b.link}</div>}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="self-start text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={() => handleDelete(b.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
