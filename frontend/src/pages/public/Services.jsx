import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Rocket, GraduationCap, Building2, Users2 } from "lucide-react";
import { AmbientBackground } from "@/components/animated/AmbientBackground";
import { Reveal, Stagger, staggerItem } from "@/components/animated/Reveal";

const services = [
  { icon: Rocket, title: "IT Consultancy", desc: "Recruitment for tech, product, and engineering roles across India.", tone: "from-blue-500/15 to-blue-500/5", ic: "text-blue-600" },
  { icon: Users2, title: "Non-IT Placement", desc: "Sales, operations, finance, and HR — end-to-end recruitment lifecycle.", tone: "from-emerald-500/15 to-emerald-500/5", ic: "text-emerald-600" },
  { icon: GraduationCap, title: "Training Batches", desc: "Full-stack, DevOps, and cloud training batches. Hire-ready professionals in 8 weeks.", tone: "from-purple-500/15 to-purple-500/5", ic: "text-purple-600" },
  { icon: Building2, title: "Corporate Hiring", desc: "Volume hiring campaigns with dedicated recruiter pods for enterprises.", tone: "from-orange-500/15 to-orange-500/5", ic: "text-orange-600" },
];

export default function Services() {
  React.useEffect(() => {
    document.title = "Our Services | BES Consultancy - IT & Non-IT Placements";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Explore recruitment and placement services by BES Consultancy. We offer IT consultancy, Non-IT placements, training batches, and corporate volume hiring.");
    }
    
    const scriptId = "seo-schema-services";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Recruitment & Placement Services",
      "provider": {
        "@type": "Organization",
        "name": "BES Consultancy"
      },
      "areaServed": "India",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Recruitment Categories",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "IT Consultancy"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Non-IT Placement"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Training Batches"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Corporate Hiring"
            }
          }
        ]
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
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <div className="overline text-primary">Our Services</div>
          <h1 className="mt-3 font-display text-5xl lg:text-6xl font-bold tracking-tighter">Recruitment done right.</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">From candidate sourcing to placement, BES Consultancy powers every stage.</p>
        </Reveal>
        <Stagger className="mt-14 grid md:grid-cols-2 gap-5">
          {services.map(s => (
            <motion.div key={s.title} variants={staggerItem} whileHover={{ y: -6 }}
              className={`rounded-2xl border border-border p-8 bg-gradient-to-br ${s.tone} soft-shadow relative overflow-hidden`}>
              <div className={`h-12 w-12 rounded-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur grid place-items-center ${s.ic} shadow-sm`}>
                <s.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{s.desc}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
