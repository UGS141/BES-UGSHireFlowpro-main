import React from "react";
import { motion } from "framer-motion";
import { UserCircle2, ShieldCheck, CalendarCheck, Trophy, FileCheck2, Sparkles } from "lucide-react";

const STAGES = [
  { icon: UserCircle2, label: "Student Profile", desc: "Register in 5 min",   grad: "from-blue-500 to-blue-600",       accent: "text-blue-600" },
  { icon: ShieldCheck, label: "Profile Verified",  desc: "Team review",       grad: "from-cyan-500 to-blue-500",       accent: "text-cyan-600" },
  { icon: CalendarCheck, label: "Interview",       desc: "Scheduled",         grad: "from-indigo-500 to-purple-500",   accent: "text-indigo-600" },
  { icon: Trophy, label: "Selected",               desc: "You made it!",      grad: "from-purple-500 to-pink-500",     accent: "text-purple-600" },
  { icon: FileCheck2, label: "Offer Letter",       desc: "Signed & sealed",   grad: "from-amber-500 to-orange-500",    accent: "text-amber-600" },
  { icon: Sparkles, label: "Placed",               desc: "Career started",    grad: "from-emerald-500 to-teal-500",    accent: "text-emerald-600" },
];

export function RecruitmentJourney() {
  return (
    <div className="relative w-full h-[440px] md:h-[500px]">
      {/* Central connecting spine */}
      <motion.div
        className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-px hidden md:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent, hsl(var(--primary)/0.35) 15%, hsl(var(--primary)/0.35) 85%, transparent)",
        }}
      />
      {/* Traveling dot */}
      <motion.span
        className="absolute left-1/2 -translate-x-1/2 hidden md:block h-3 w-3 rounded-full bg-primary shadow-[0_0_0_5px_rgba(37,99,235,0.18)]"
        animate={{ top: ["4%", "94%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating cards */}
      {STAGES.map((s, i) => {
        const isLeft = i % 2 === 0;
        const topPct = 4 + i * 16;   // 4, 20, 36, 52, 68, 84
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 10 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.03 }}
            className={`absolute w-[220px] md:w-[240px] ${
              isLeft ? "left-0 md:left-2" : "right-0 md:right-2"
            }`}
            style={{ top: `${topPct}%` }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="glass rounded-2xl p-3.5 border border-white/40 dark:border-white/10 soft-shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.grad} grid place-items-center text-white shadow-md shrink-0`}>
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className={`overline text-[9px] ${s.accent}`}>Step {i + 1}</div>
                  <div className="font-display font-semibold text-sm truncate">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.desc}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Floating background sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary/40"
          style={{ left: `${15 + i * 12}%`, top: `${10 + i * 13}%` }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}
