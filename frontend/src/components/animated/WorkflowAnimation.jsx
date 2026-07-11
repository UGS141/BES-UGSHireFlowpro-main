import React from "react";
import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, UserCog, Users, MessageSquareText, Award } from "lucide-react";

const STAGES = [
  { icon: UserPlus, label: "Registration", color: "from-blue-500 to-blue-600" },
  { icon: ShieldCheck, label: "Verification", color: "from-cyan-500 to-blue-500" },
  { icon: UserCog, label: "Assignment", color: "from-indigo-500 to-purple-500" },
  { icon: MessageSquareText, label: "Interview", color: "from-purple-500 to-pink-500" },
  { icon: Award, label: "Placement", color: "from-emerald-500 to-teal-500" },
];

export function WorkflowAnimation() {
  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-between gap-2 relative">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.label}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center gap-2 min-w-0"
            >
              <div className="relative">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${s.color} grid place-items-center text-white shadow-lg`}>
                  <s.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <motion.span
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "0 0 0 0 rgba(37,99,235,0.5)" }}
                  animate={{ boxShadow: ["0 0 0 0 rgba(37,99,235,0.35)", "0 0 0 14px rgba(37,99,235,0)"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                />
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{s.label}</div>
            </motion.div>
            {i < STAGES.length - 1 && (
              <div className="relative flex-1 h-px bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-emerald-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.2, duration: 0.8 }}
                />
                <motion.div
                  className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(37,99,235,0.2)]"
                  animate={{ left: ["-4px", "calc(100% - 6px)"] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Mobile: vertical */}
      <div className="md:hidden space-y-3">
        {STAGES.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center text-white`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium">{s.label}</div>
            {i < STAGES.length - 1 && <div className="ml-auto text-xs text-muted-foreground">↓</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
