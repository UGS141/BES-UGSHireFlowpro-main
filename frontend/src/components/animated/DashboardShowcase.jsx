import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Kanban, Briefcase, BarChart3, TrendingUp, Award, Clock } from "lucide-react";

const SCREENS = [
  {
    key: "dashboard", title: "Admin Dashboard", icon: LayoutDashboard,
    content: (
      <div className="p-4 grid grid-cols-4 gap-2 text-[10px]">
        {[
          { k: "Total", v: "1,248", c: "bg-blue-500" },
          { k: "Pending", v: "42", c: "bg-orange-500" },
          { k: "Placed", v: "312", c: "bg-emerald-500" },
          { k: "In Pipeline", v: "184", c: "bg-purple-500" },
        ].map(x => (
          <div key={x.k} className="rounded-lg bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`h-2 w-2 rounded-full ${x.c}`} />
            <div className="mt-1 text-base font-bold">{x.v}</div>
            <div className="text-[9px] text-slate-500">{x.k}</div>
          </div>
        ))}
        <div className="col-span-4 rounded-lg bg-white dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700 h-24 flex items-end justify-around">
          {[45, 60, 30, 70, 50, 80, 65].map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05 }}
              className="w-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" />
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "candidate", title: "Candidate Workspace", icon: Users,
    content: (
      <div className="p-4 space-y-2 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center text-white text-sm font-bold">A</div>
          <div><div className="font-semibold text-sm">Arjun Kapoor</div><div className="text-[9px] text-slate-500">UGS-C-0001</div></div>
        </div>
        <div className="flex gap-1.5">
          {["Overview", "Pipeline", "Docs", "Payments"].map((t, i) => (
            <div key={t} className={`px-2 py-1 rounded text-[9px] ${i === 1 ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{t}</div>
          ))}
        </div>
        <div className="space-y-1.5 pl-2 border-l-2 border-blue-500">
          {["Verified", "Assigned", "Interview scheduled", "Round 1 cleared"].map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5">
              <div className="text-[10px] font-medium">{s}</div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "pipeline", title: "Interview Pipeline", icon: Kanban,
    content: (
      <div className="p-3 grid grid-cols-4 gap-1.5 text-[9px]">
        {["Verified", "Assigned", "Interview", "Placed"].map((col, ci) => (
          <div key={col} className="min-w-0">
            <div className="font-semibold mb-1.5 truncate">{col}</div>
            {[0, 1, 2].map(i => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (ci * 3 + i) * 0.05 }}
                className="mb-1.5 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5">
                <div className="text-[9px] font-medium truncate">Candidate {ci * 3 + i + 1}</div>
                <div className="text-[8px] text-slate-500">Skill</div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "jobs", title: "Job Workspace", icon: Briefcase,
    content: (
      <div className="p-4 space-y-2 text-[10px]">
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white p-3">
          <div className="font-semibold text-sm">Senior React Engineer</div>
          <div className="text-[9px] opacity-80">Infogain Systems · Bangalore</div>
          <div className="mt-2 flex gap-2 text-[9px]">
            <div>3-6 yrs</div><div>·</div><div>₹12-20L</div><div>·</div><div>3 vacancies</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[["Vac", 3], ["Alloc", 8], ["Placed", 1], ["Left", 2]].map(([l, v]) => (
            <div key={l} className="rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 text-center">
              <div className="text-sm font-bold">{v}</div>
              <div className="text-[8px] text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "reports", title: "Reports", icon: BarChart3,
    content: (
      <div className="p-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5">
          <div className="font-semibold mb-1.5 text-[10px]">Placements/mo</div>
          <div className="h-16 flex items-end justify-around">
            {[35, 42, 55, 48, 62, 70].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.06 }}
                className="w-2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t" />
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5">
          <div className="font-semibold mb-1.5 text-[10px]">Revenue</div>
          <div className="h-16 relative">
            <svg viewBox="0 0 100 40" className="w-full h-full">
              <motion.path d="M0,30 Q20,20 40,22 T80,10 T100,5" fill="none"
                stroke="url(#g)" strokeWidth="2" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }} />
              <defs><linearGradient id="g"><stop offset="0" stopColor="#2563EB" /><stop offset="1" stopColor="#10B981" /></linearGradient></defs>
            </svg>
          </div>
        </div>
      </div>
    ),
  },
];

export function DashboardShowcase() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SCREENS.length), 3400);
    return () => clearInterval(t);
  }, []);
  const s = SCREENS[idx];
  return (
    <div className="relative">
      {/* Browser chrome */}
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-slate-900 soft-shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex gap-1.5">
            {["bg-red-400", "bg-yellow-400", "bg-emerald-400"].map(c => <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
          </div>
          <div className="flex-1 mx-4 h-6 rounded-md bg-white dark:bg-slate-800 border border-border/60 flex items-center px-3">
            <div className="text-[10px] text-muted-foreground truncate">app.ugshireflow.com/{s.key}</div>
          </div>
        </div>
        {/* Content */}
        <div className="flex min-h-[280px] bg-slate-50/60 dark:bg-slate-950/40">
          {/* Mini sidebar */}
          <div className="hidden sm:flex flex-col gap-0.5 py-3 px-2 border-r border-border/60 bg-white dark:bg-slate-900/40">
            {SCREENS.map((sc, i) => (
              <div key={sc.key} className={`h-8 w-8 rounded-lg grid place-items-center transition-colors ${idx === i ? "bg-primary text-primary-foreground" : "text-slate-500"}`}>
                <sc.icon className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0 relative">
            <AnimatePresence mode="wait">
              <motion.div key={s.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}>
                <div className="px-4 pt-3 flex items-center gap-2 text-xs font-semibold">
                  <s.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{s.title}</span>
                </div>
                {s.content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Screen dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 border-t border-border/60">
          {SCREENS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-slate-300 dark:bg-slate-700"}`} />
          ))}
        </div>
      </div>

      {/* Floating cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="absolute -bottom-6 -left-6 hidden md:block glass rounded-2xl p-3 soft-shadow-lg w-48">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 grid place-items-center"><Award className="h-4 w-4" /></div>
          <div>
            <div className="text-xs text-muted-foreground overline">Placed today</div>
            <div className="font-display font-bold text-lg leading-none mt-0.5">+12</div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="absolute -top-4 -right-4 hidden md:block glass rounded-2xl p-3 soft-shadow-lg w-52">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary grid place-items-center"><TrendingUp className="h-4 w-4" /></div>
          <div>
            <div className="text-xs text-muted-foreground overline">Pipeline velocity</div>
            <div className="font-display font-bold text-lg leading-none mt-0.5">+18.4%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
