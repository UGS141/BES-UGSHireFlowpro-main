import React from "react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { AmbientBackground } from "@/components/animated/AmbientBackground";
import { Reveal, Stagger, staggerItem } from "@/components/animated/Reveal";
import { Rocket, Heart, Users2 } from "lucide-react";

export default function About() {
  return (
    <div className="relative">
      <AmbientBackground />
      <div className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <div className="overline text-primary">About UGS IT Solutions</div>
          <h1 className="mt-3 font-display text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05]">
            15 years. One mission.<br /><span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Zero spreadsheets.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            UGS IT Solutions has been building software for consultancies since 2010. After watching one recruiting firm run 15 years of business on Excel, we built HireFlow — a modern recruitment OS designed to replace spreadsheets from day one.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <motion.img src="https://images.pexels.com/photos/1313534/pexels-photo-1313534.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="office" className="mt-10 rounded-3xl w-full h-96 object-cover soft-shadow-lg"
            whileHover={{ scale: 1.01 }} transition={{ duration: 0.4 }} />
        </Reveal>
        <Stagger className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { k: 500, s: "+", v: "Placements Automated", icon: Rocket },
            { k: 40, s: "+", v: "Consultancies Served", icon: Users2 },
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
