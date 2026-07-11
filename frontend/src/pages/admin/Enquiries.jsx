import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Trash2, CheckCheck, Reply, Mail, Phone, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api, { API_BASE } from "@/lib/api";

export default function Enquiries() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["enquiries", q, status],
    queryFn: async () => (await api.get("/enquiries", { params: { q, status } })).data,
  });
  const items = data?.items || [];

  const markRead = async (id) => {
    await api.post(`/enquiries/${id}/mark-read`);
    qc.invalidateQueries({ queryKey: ["enquiries"] });
    qc.invalidateQueries({ queryKey: ["enquiries-unread"] });
  };
  const del = async (id) => {
    if (!confirm("Delete this enquiry?")) return;
    await api.delete(`/enquiries/${id}`);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["enquiries"] });
  };
  const exportXlsx = async () => {
    const token = localStorage.getItem("ugs_token");
    const r = await fetch(`${API_BASE}/enquiries/export/xlsx`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return toast.error("Export failed");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "enquiries.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="enquiries-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="overline text-primary">Website</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Website Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Contact form submissions from your public website. {data?.unread > 0 && <span className="ml-1 rounded-full bg-red-500 text-white px-2 py-0.5 text-[10px] font-semibold">{data.unread} unread</span>}</p>
        </div>
        <Button variant="outline" onClick={exportXlsx} data-testid="export-enq-btn"><Download className="h-4 w-4 mr-2" /> Export Excel</Button>
      </div>

      <Card className="p-4 border-border">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone, subject, message..." className="pl-9" data-testid="enq-search" />
          </div>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44" data-testid="enq-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading && <div className="text-muted-foreground">Loading...</div>}
      {!isLoading && items.length === 0 && (
        <Card className="p-12 border-border text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40" strokeWidth={1} />
          <div className="mt-4 font-display text-lg">No enquiries</div>
        </Card>
      )}

      <div className="space-y-2">
        {items.map(e => (
          <Card key={e.id} className={`p-4 border-border flex flex-wrap items-center gap-3 cursor-pointer transition ${e.status === "unread" ? "bg-primary/5 border-primary/20" : ""}`}
            onClick={() => { setSelected(e); if (e.status === "unread") markRead(e.id); }}
            data-testid={`enq-row-${e.id}`}>
            {e.status === "unread" && <span className="h-2 w-2 rounded-full bg-primary" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{e.name}</span>
                <span className="text-xs text-muted-foreground truncate">{e.email}</span>
                {e.phone && <span className="text-xs text-muted-foreground">· {e.phone}</span>}
              </div>
              {e.subject && <div className="text-sm font-medium mt-0.5">{e.subject}</div>}
              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{e.message}</div>
            </div>
            <div className="text-right">
              <StatusBadge s={e.status} />
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString()}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={(ev) => { ev.stopPropagation(); del(e.id); }} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>

      <EnquiryDialog enquiry={selected} onClose={() => setSelected(null)} onDone={() => qc.invalidateQueries({ queryKey: ["enquiries"] })} />
    </div>
  );
}

function StatusBadge({ s }) {
  const tone = s === "unread" ? "bg-red-500/15 text-red-700 dark:text-red-400"
    : s === "replied" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : "bg-slate-500/15 text-slate-700 dark:text-slate-400";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tone}`}>{s}</span>;
}

function EnquiryDialog({ enquiry, onClose, onDone }) {
  const [notes, setNotes] = useState("");
  if (!enquiry) return null;
  const markReplied = async () => {
    const fd = new FormData(); fd.append("reply_notes", notes);
    await api.post(`/enquiries/${enquiry.id}/mark-replied`, fd);
    toast.success("Marked as replied");
    onDone(); onClose();
  };
  return (
    <Dialog open={!!enquiry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{enquiry.subject || "Enquiry from " + enquiry.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {enquiry.email}</div>
          {enquiry.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {enquiry.phone}</div>}
          <div className="rounded-lg border border-border p-3 whitespace-pre-wrap">{enquiry.message}</div>
          <div className="text-xs text-muted-foreground">Received {new Date(enquiry.created_at).toLocaleString()}</div>
          {enquiry.status !== "replied" && (
            <div>
              <label className="text-xs mb-1.5 block">Reply notes (optional)</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you tell them?" />
            </div>
          )}
          {enquiry.reply_notes && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs">
              <div className="overline text-[10px] text-emerald-700 dark:text-emerald-400 mb-1">Reply notes</div>
              <div>{enquiry.reply_notes}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {enquiry.status !== "replied" && <Button onClick={markReplied} data-testid="mark-replied-btn"><Reply className="h-4 w-4 mr-1" /> Mark Replied</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
