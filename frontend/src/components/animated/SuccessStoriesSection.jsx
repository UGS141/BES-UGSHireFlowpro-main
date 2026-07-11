import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, Briefcase, IndianRupee, Calendar, Building2 } from "lucide-react";
import { Reveal } from "@/components/animated/Reveal";
import api, { API_BASE } from "@/lib/api";

/** Successfully Placed marquee — auto-scroll, pause on hover, glass cards. */
export function SuccessStoriesSection() {
  const [placements, setPlacements] = useState([]);
  useEffect(() => {
    api.get("/public/placements").then(r => setPlacements(r.data || [])).catch(() => {});
  }, []);

  if (!placements.length) return null;

  // Double the list for seamless infinite scroll
  const doubled = [...placements, ...placements];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Award className="h-3.5 w-3.5" /> Real people. Real placements.
            </div>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tighter">
              <span className="text-2xl align-middle">🎉</span> Recent Success Stories
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Congratulations to our recently placed candidates. Every success story inspires another career.
            </p>
          </div>
        </Reveal>
      </div>

      <div
        className="mt-14 relative group"
        onMouseEnter={(e) => { e.currentTarget.querySelectorAll(".marquee-track").forEach(t => t.style.animationPlayState = "paused"); }}
        onMouseLeave={(e) => { e.currentTarget.querySelectorAll(".marquee-track").forEach(t => t.style.animationPlayState = "running"); }}
      >
        {/* Edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        <div className="flex marquee-track animate-marquee" style={{ width: "max-content" }}>
          {doubled.map((p, idx) => <PlacementCard key={`${p.id}-${idx}`} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function PlacementCard({ p }) {
  const photoUrl = p.candidate_photo_file_id
    ? `${API_BASE}/files/${p.candidate_photo_file_id}/download`
    : null;
  const logoUrl = p.company_logo_file_id
    ? `${API_BASE}/files/${p.company_logo_file_id}/download`
    : null;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="mx-3 w-[320px] shrink-0"
    >
      <div className="relative rounded-2xl glass border border-white/50 dark:border-white/10 soft-shadow-lg p-5 overflow-hidden">
        {/* Placed badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-semibold shadow-lg shadow-emerald-500/30">
          <Award className="h-3 w-3" /> Placed
        </div>

        <div className="flex items-center gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={p.candidate_name} className="h-14 w-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center text-white font-bold text-xl shadow-md">
              {p.candidate_name?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-display font-semibold text-base truncate">{p.candidate_name}</div>
            <div className="text-xs text-muted-foreground truncate">{p.job_role}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-border/40 p-3">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={p.company_name} className="h-8 w-8 rounded-lg object-contain bg-white p-1 border border-border/40" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Building2 className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Placed at</div>
              <div className="text-sm font-semibold truncate">{p.company_name}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          {p.package && (
            <div className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <IndianRupee className="h-3 w-3" /> {p.package}
            </div>
          )}
          {p.placement_date && (
            <div className="inline-flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" /> {new Date(p.placement_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </div>
          )}
        </div>

        {p.short_description && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
            "{p.short_description}"
          </p>
        )}
      </div>
    </motion.div>
  );
}
