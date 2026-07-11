import React from "react";

const COLOR = {
  placed: "bg-emerald-500",
  interview_scheduled: "bg-blue-500",
  round_1: "bg-blue-500",
  round_2: "bg-blue-500",
  technical: "bg-blue-500",
  hr: "bg-blue-500",
  waiting: "bg-yellow-500",
  pending_verification: "bg-orange-500",
  rejected: "bg-red-500",
  assigned: "bg-purple-500",
  verified: "bg-cyan-500",
  profile_reviewed: "bg-cyan-500",
  company_assigned: "bg-indigo-500",
  selected: "bg-emerald-500",
  offer_released: "bg-emerald-500",
  joined: "bg-emerald-500",
  inactive: "bg-gray-400",
  // payment
  completed: "bg-emerald-500",
  paid: "bg-emerald-500",
  partial: "bg-yellow-500",
  pending: "bg-red-500",
  // job
  open: "bg-emerald-500",
  closed: "bg-gray-400",
  on_hold: "bg-yellow-500",
  running: "bg-blue-500",
  active: "bg-emerald-500",
  paused: "bg-yellow-500",
};

const LABEL = {
  pending_verification: "Pending Verification",
  interview_scheduled: "Interview Scheduled",
  round_1: "Round 1",
  round_2: "Round 2",
  company_assigned: "Company Assigned",
  offer_released: "Offer Released",
  profile_reviewed: "Profile Reviewed",
};

export function StatusDot({ status, className = "" }) {
  const color = COLOR[status] || "bg-slate-400";
  return (
    <span className={`glow-dot ${color} ${className}`} data-testid={`status-dot-${status}`} />
  );
}

export function StatusPill({ status, className = "" }) {
  const color = COLOR[status] || "bg-slate-400";
  const label = LABEL[status] || (status ? status.replace(/_/g, " ") : "—");
  return (
    <span
      data-testid={`status-pill-${status}`}
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="capitalize">{label}</span>
    </span>
  );
}
