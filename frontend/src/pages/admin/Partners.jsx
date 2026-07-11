import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Handshake, Users2, Phone } from "lucide-react";
import api from "@/lib/api";

export default function Partners() {
  const { data = [], isLoading } = useQuery({ queryKey: ["partners"], queryFn: async () => (await api.get("/partners")).data });
  return (
    <div className="space-y-6" data-testid="partners-page">
      <div>
        <div className="overline text-primary">Referrals</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Partners are created when admins verify candidates. Every partner tracks all candidates they've referred.</p>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading...</div>}
      {!isLoading && data.length === 0 && (
        <Card className="p-12 border-border text-center">
          <Handshake className="h-12 w-12 mx-auto text-muted-foreground/40" strokeWidth={1} />
          <div className="mt-4 font-display text-lg">No partners yet</div>
          <div className="mt-1 text-sm text-muted-foreground">Verify a candidate and create a partner from their reference information.</div>
        </Card>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(p => (
          <Card key={p.id} className="p-5 border-border hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center"><Handshake className="h-5 w-5" /></div>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1"><Users2 className="h-3 w-3" /> {p.candidate_count || 0}</span>
            </div>
            <div className="mt-3 font-display font-semibold text-lg">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.partner_code}</div>
            <div className="mt-2 flex items-center gap-1.5 text-sm"><Phone className="h-3.5 w-3.5" /> {p.phone}</div>
            {p.email && <div className="text-xs text-muted-foreground mt-1">{p.email}</div>}
            <div className="mt-4 pt-3 border-t border-border/50">
              <Link to={`/app/candidates?partner_id=${p.id}`} className="text-xs text-primary hover:underline">View candidates →</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
