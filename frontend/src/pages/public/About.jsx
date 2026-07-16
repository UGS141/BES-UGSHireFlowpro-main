import React from "react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { AmbientBackground } from "@/components/animated/AmbientBackground";
import { Reveal, Stagger, staggerItem } from "@/components/animated/Reveal";
import { Rocket, Heart, Users2 } from "lucide-react";

export default function About() {
  React.useEffect(() => {
    // Dynamic SEO
    document.title = "About Us | BES Info Tech - Trusted Placement Services";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Learn about BES Info Tech, India's trusted placement and recruitment partner since 2010. We connect freshers and experienced candidates with leading companies.");
    }
    
    // Schema Structured Data
    const scriptId = "seo-schema-about";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About BES Info Tech",
      "description": "Learn about BES Info Tech, India's trusted placement and recruitment partner since 2010.",
      "publisher": {
        "@type": "Organization",
        "name": "BES Info Tech",
        "logo": {
          "@type": "ImageObject",
          "url": window.location.origin + "/bes_logo.png"
        }
      }
    });
    
    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, []);

  return (
    <div className="relative">
      <AmbientBackground />
      <div className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <div className="overline text-primary">About BES Info Tech</div>
          <h1 className="mt-3 font-display text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05]">
            15 years. One mission.<br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Connecting Talent to Opportunities.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            BES Info Tech has been helping job seekers and employers connect since 2010. Having built a strong reputation as a trusted recruitment partner, we provide comprehensive placement services across multiple domains including IT, Non-IT, and Campus Placements. Our focus is on bridging the gap between industry requirements and talented professionals.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <motion.img src="https://images.pexels.com/photos/1313534/pexels-photo-1313534.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="office" className="mt-10 rounded-3xl w-full h-96 object-cover soft-shadow-lg"
            whileHover={{ scale: 1.01 }} transition={{ duration: 0.4 }} />
        </Reveal>
        <Stagger className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { k: 1500, s: "+", v: "Successful Placements", icon: Rocket },
            { k: 300, s: "+", v: "Corporate Clients", icon: Users2 },
            { k: 15, s: " yrs", v: "Domain Expertise", icon: Heart },
          ].map(x => (
            <motion.div key={x.v} variants={staggerItem} whileHover={{ y: -4 }}
              className="rounded-2xl border border-border p-6 bg-white dark:bg-slate-900/40 soft-shadow">
              <x.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <div className="mt-3 font-display text-4xl font-bold text-primary">
                <AnimatedCounter end={x.k} suffix={x.s} />
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{x.v}</div>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
