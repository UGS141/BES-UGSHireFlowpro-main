import React from "react";

/** Ambient background: floating gradient blobs + faint grid. Non-interactive. */
export function AmbientBackground({ variant = "hero" }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }} />
      {/* Blobs */}
      <div className="absolute -top-40 -left-20 h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[110px] animate-blob" />
      <div className="absolute top-32 right-0 h-[480px] w-[480px] rounded-full bg-emerald-400/25 blur-[110px] animate-blob-delayed" />
      <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-[100px] animate-blob-slow" />
      {variant === "hero" && (
        <>
          {/* soft light ray */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] bg-gradient-to-b from-white/40 via-white/0 to-white/0 dark:from-white/5 blur-3xl" />
        </>
      )}
    </div>
  );
}
