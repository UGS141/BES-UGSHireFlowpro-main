import React from "react";

/** Renders the UGS logo. Two variants: 'mark' (icon only) or 'full' (mark + brand name). */
export function Logo({ variant = "mark", size = 36, showTagline = false, className = "" }) {
  if (variant === "full") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img src="/favicon.png" alt="UGS HireFlow" style={{ width: size, height: size }}
             className="object-contain" />
        <div className="leading-none">
          <div className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-[#4A5FBF] via-[#5B8CB5] to-[#3EB489] bg-clip-text text-transparent">
            UGS HireFlow
          </div>
          {showTagline && <div className="text-[10px] text-muted-foreground overline mt-0.5">by UGS IT Solutions</div>}
        </div>
      </div>
    );
  }
  return (
    <img src="/favicon.png" alt="UGS HireFlow"
         style={{ width: size, height: size }}
         className={`object-contain ${className}`} />
  );
}
