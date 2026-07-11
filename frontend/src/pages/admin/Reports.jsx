import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatusPill } from "@/components/StatusDot";
import api, { API_BASE } from "@/lib/api";
import { toast } from "sonner";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#64748B"];

export default function Reports() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: async () => (await api.get("/reports/summary")).data });
  const { data: placements = [] } = useQuery({ queryKey: ["placements"], queryFn: async () => (await api.get("/reports/placements")).data });

  const exportCsv = async () => {
    const token = localStorage.getItem("ugs_token");
    const r = await fetch(`${API_BASE}/candidates/export/csv`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return toast.error("Export failed");
    const blob = await r.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "candidates.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return <div className="text-muted-foreground">Loading...</div>;
  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div><div className="overline text-primary">Analytics</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Reports</h1></div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-border">
          <h3 className="font-display text-lg font-semibold mb-2">Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.status_distribution || []} dataKey="count" nameKey="status" outerRadius={100} innerRadius={50} label>
                  {(data.status_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6 border-border">
          <h3 className="font-display text-lg font-semibold mb-2">Candidates by Stage</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.status_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                <YAxis /><Tooltip /><Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="p-6 border-border">
        <h3 className="font-display text-lg font-semibold mb-4">Placement Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left overline text-[10px] text-muted-foreground">
              <th className="py-2">Code</th><th>Name</th><th>Email</th><th>Status</th><th>Payment</th><th>Placed On</th>
            </tr></thead>
            <tbody>
              {placements.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No placements yet</td></tr>}
              {placements.map(p => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="py-2">{p.candidate_code}</td>
                  <td>{p.full_name}</td><td className="text-muted-foreground">{p.email}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td><StatusPill status={p.payment_status} /></td>
                  <td className="text-muted-foreground">{p.placed_at ? new Date(p.placed_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
