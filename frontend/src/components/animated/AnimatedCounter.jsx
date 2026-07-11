import React, { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

/** Counter that animates from 0 to `end` when it scrolls into view. */
export function AnimatedCounter({ end = 0, suffix = "", duration = 1600, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * end));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return <span ref={ref} className={className}>{val.toLocaleString("en-IN")}{suffix}</span>;
}
