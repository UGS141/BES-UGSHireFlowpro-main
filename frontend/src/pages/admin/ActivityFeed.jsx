import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import api from "@/lib/api";

export default function ActivityFeed() {
  const { data = [] } = useQuery({ queryKey: ["activity-all"], queryFn: async () => (await api.get("/activity-logs", { params: { limit: 200 } })).data });
  return (
    <div className="space-y-6" data-testid="activity-page">
      <div><div className="overline text-primary">Audit</div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Activity Log</h1></div>
      <Card className="p-6 border-border">
        <div className="space-y-3">
          {data.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No activity yet</div>}
          {data.map(a => (
            <div key={a.id} className="flex gap-3 py-2 border-b border-border/40 last:border-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0"><Activity className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium">{a.actor_name || "System"}</span> · {a.actor_role || "—"} · {new Date(a.created_at).toLocaleString()} · <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.action}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
