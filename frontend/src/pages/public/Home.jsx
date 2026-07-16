import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Users2, Building2, Briefcase, GraduationCap,
  Handshake, BarChart3, Sparkles, Zap, Shield, TrendingUp, Award, Rocket,
  Database, Layers, Clock, ChevronDown, Star, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AmbientBackground } from "@/components/animated/AmbientBackground";
import { WorkflowAnimation } from "@/components/animated/WorkflowAnimation";
import { DashboardShowcase } from "@/components/animated/DashboardShowcase";
import { RecruitmentJourney } from "@/components/animated/RecruitmentJourney";
import { SuccessStoriesSection } from "@/components/animated/SuccessStoriesSection";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { Reveal, Stagger, staggerItem } from "@/components/animated/Reveal";

const STATS = [
  { end: 15, suffix: "+", label: "Years Experience" },
  { end: 25000, suffix: "+", label: "Candidates Managed" },
  { end: 1500, suffix: "+", label: "Placements" },
  { end: 300, suffix: "+", label: "Hiring Companies" },
  { end: 100, suffix: "%", label: "Centralized Workflow" },
];

const FEATURES = [
  { icon: Users2, title: "Candidate Management", desc: "One workspace for every candidate — profile, documents, payments, interview timeline, partner info.", tone: "from-blue-500/15 to-blue-500/5", ic: "text-blue-600" },
  { icon: Building2, title: "Company Management", desc: "Manage clients, HR contacts, hiring status, and full company hiring history.", tone: "from-indigo-500/15 to-indigo-500/5", ic: "text-indigo-600" },
  { icon: BarChart3, title: "Recruitment Pipeline", desc: "Kanban board across 14+ interview stages with a full audit trail on every transition.", tone: "from-purple-500/15 to-purple-500/5", ic: "text-purple-600" },
  { icon: Briefcase, title: "Employee Workspace", desc: "Recruiter workload, stage breakdown, activity, and login history — track every performer.", tone: "from-cyan-500/15 to-cyan-500/5", ic: "text-cyan-600" },
  { icon: Handshake, title: "Partner Tracking", desc: "Every candidate linked to one partner. Search, filter, and count referrals in one click.", tone: "from-emerald-500/15 to-emerald-500/5", ic: "text-emerald-600" },
  { icon: GraduationCap, title: "Batch Management", desc: "Training batches with candidate assignments, status transitions, and trainer records.", tone: "from-pink-500/15 to-pink-500/5", ic: "text-pink-600" },
  { icon: Database, title: "Excel Migration Ready", desc: "Import 15 years of Excel data with preview, duplicate detection, and one-click export.", tone: "from-orange-500/15 to-orange-500/5", ic: "text-orange-600" },
  { icon: BarChart3, title: "Analytics Ready", desc: "KPIs, revenue, status distribution, and placement reports built on live data.", tone: "from-teal-500/15 to-teal-500/5", ic: "text-teal-600" },
];

const BENEFITS = [
  { icon: Rocket, title: "Replace Excel", desc: "Every operation your team runs on spreadsheets — done in one enterprise CRM." },
  { icon: Clock, title: "Save Time", desc: "3-click ops. Verify, assign, and schedule interviews without leaving the workspace." },
  { icon: Database, title: "Centralized Data", desc: "One source of truth. No lost files, no version chaos, no email threads." },
  { icon: Shield, title: "Bank-grade Security", desc: "JWT auth, role-based access, audit logs on every action." },
  { icon: TrendingUp, title: "Actionable Insights", desc: "Recruiter performance, revenue, placement velocity — live dashboards for admins." },
  { icon: Layers, title: "Interconnected", desc: "Candidate → Recruiter → Company → Job → Batch → Partner — everything linked." },
];

const TESTIMONIALS = [
  { name: "Rakesh Menon", role: "Managing Partner, TechHire Consulting", stars: 5, quote: "We moved 15 years of Excel to BES Consultancy in a weekend. Our team stopped fighting spreadsheets and started closing placements." },
  { name: "Sneha Patel", role: "Head of Recruitment, ScaleForce Talent", stars: 5, quote: "The pipeline view alone paid for the platform. We can see every candidate, every stage, in real time." },
  { name: "Vivek Rao", role: "Founder, BluePeak Placements", stars: 5, quote: "Partner tracking transformed our referral business. We now pay commissions on time and partners send us 3× the candidates." },
];

const FAQ = [
  { q: "How different is BES Info Tech from other agencies?", a: "BES Info Tech is a premier recruitment consultancy with a purpose-built system. Every module — candidates, pipeline, partners, batches, payments — is optimized for real placement workflows, not generic sales." },
  { q: "Can we migrate our existing Excel data?", a: "Yes. Upload .xlsx or .csv files with a click. We preview the data, flag duplicates, and give you a full import summary." },
  { q: "How is data secured?", a: "JWT authentication, role-based access control (Admin / Recruiter / Candidate), encrypted passwords, and a complete audit log of every action." },
  { q: "Can our candidates track their own status?", a: "Yes. Every candidate can register on your public site and log in to a workspace showing their timeline, recruiter, company, job, and payment status." },
  { q: "How quickly can we onboard our team?", a: "Most recruiters are productive on day one. The interface is designed so a new team member can learn the system within a single working day." },
];

export default function Home() {
  const [banners, setBanners] = React.useState([]);
  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/public/banners`)
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(e => console.error("Failed to load banners:", e));
  }, []);

  React.useEffect(() => {
    document.title = "BES Info Tech | Premier Recruitment & Placement Services";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "BES Info Tech is India's leading recruitment partner since 2010. We connect top talent with premier companies for IT, Non-IT, and campus placements.");
    }
    
    const scriptId = "seo-schema-home";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.innerHTML = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BES Info Tech",
        "alternateName": "BES Consultancy",
        "url": window.location.origin,
        "logo": window.location.origin + "/bes_logo.png",
        "foundingDate": "2010"
      },
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "BES Info Tech",
        "image": window.location.origin + "/bes_logo.png",
        "@id": window.location.origin + "/#localbusiness",
        "url": window.location.origin,
        "telephone": "+91 90000 00000",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "HITEC City",
          "addressLocality": "Hyderabad",
          "addressRegion": "Telangana",
          "postalCode": "500081",
          "addressCountry": "IN"
        }
      }
    ]);
    
    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, []);

  return (
    <div>
      {/* ================ HERO ================ */}
      <section className="relative overflow-hidden">
        <AmbientBackground variant="hero" />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Placement Consultancy · Trusted since 2010
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 font-display text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter leading-[1.02]">
              Welcome to BES Info Tech
              <br />Your
              <span className="ml-3 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 bg-clip-text text-transparent">Career Starts Here</span>.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              For more than 15 years, BES Info Tech has helped thousands of students and professionals build successful careers. Register today and connect with India&apos;s leading companies.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" data-testid="hero-register-btn">
                  Register Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="rounded-full h-12 px-6 backdrop-blur bg-white/60 dark:bg-slate-900/60" data-testid="hero-explore-btn">
                  Explore Opportunities
                </Button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
              {["15+ Years of Excellence", "Trusted Placement Consultancy", "1000+ Successful Placements"].map(x => (
                <div key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{x}</div>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="lg:col-span-6">
            <RecruitmentJourney />
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-slate-400 text-xs"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="overline text-[10px]">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </section>

      {/* ================ SUCCESS STORIES (NEW SECTION 2) ================ */}
      <SuccessStoriesSection />

      {/* ================ STATS ================ */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-slate-950 text-white p-10 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" />
            <div className="relative grid grid-cols-2 md:grid-cols-5 gap-8">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.06}>
                  <div className="text-center md:text-left">
                    <div className="font-display text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">
                      <AnimatedCounter end={s.end} suffix={s.suffix} />
                    </div>
                    <div className="mt-2 text-xs md:text-sm text-slate-400">{s.label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================ WORKFLOW ================ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <div className="overline text-primary">Recruitment Workflow</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">From registration to placement — automated.</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">Every candidate flows through the same predictable stages. BES Info Tech tracks it, notifies your team, and never lets a candidate fall through the cracks.</p>
            </div>
          </Reveal>
          <div className="mt-14"><WorkflowAnimation /></div>
        </div>
      </section>

      {/* ================ MAIN OFFICE BANNER ================ */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/10 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="overline text-primary">Our Legacy & Core Values</div>
                <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">
                  Shaping Careers through Trust & Education.
                </h2>
                <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Established with the vision to bridge the gap between academic education and corporate requirements, <strong>BES Info Tech</strong> (part of BES Education Society, Nellore) has stood as a beacon of guidance for over 15 years.
                </p>
                <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Our state-of-the-art career development center operates with dedicated career counselors, recruitment managers, and academic advisors to ensure every student and professional receives the highest quality placement advice.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={0.15}>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 group bg-slate-900">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent z-10" />
                  <img 
                    src="/bes_banner.jpg" 
                    alt="BES Nellore Education Society Office" 
                    className="w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                    <div className="text-xs overline text-emerald-400 font-semibold tracking-wider">Career Hub</div>
                    <div className="text-lg font-display font-semibold mt-1">BES Career Counseling & Placements Center</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================ BANNERS & NEWSLETTERS ================ */}
      {banners.length > 0 && (
        <section className="py-16 bg-slate-50/50 dark:bg-slate-900/10 border-y border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="overline text-primary">Banners & Updates</div>
                <h2 className="mt-3 font-display text-3xl lg:text-4xl font-bold tracking-tighter">Latest Announcements & Newsletters</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {banners.map((b) => (
                <Reveal key={b.id}>
                  <div className="rounded-2xl border border-border bg-white dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
                      <img 
                        src={`${process.env.REACT_APP_BACKEND_URL || ""}/api/files/${b.file_id}/download`} 
                        alt={b.title || "Banner"}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {b.title && (
                      <div className="p-5 border-t border-border/50">
                        <h4 className="font-display font-semibold text-lg leading-snug">{b.title}</h4>
                        {b.link && (
                          <a 
                            href={b.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                          >
                            Learn More <ArrowRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================ FEATURES ================ */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="max-w-2xl">
              <div className="overline text-primary">Everything, connected</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">One workspace. Every stage of hiring.</h2>
            </div>
          </Reveal>
          <Stagger className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={staggerItem}
                whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300 }}
                className={`group relative rounded-2xl border border-border p-6 bg-gradient-to-br ${f.tone} overflow-hidden`}>
                <div className={`h-11 w-11 rounded-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur grid place-items-center ${f.ic} shadow-sm`}>
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="mt-4 font-display font-semibold text-lg">{f.title}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                <div className={`absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/40 dark:bg-white/5 blur-2xl transition-opacity opacity-0 group-hover:opacity-100`} />
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ================ PRODUCT SHOWCASE (larger) ================ */}
      <section className="py-20 bg-gradient-to-b from-transparent via-slate-100/40 to-transparent dark:via-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="overline text-primary">See it in action</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">Interconnected workspaces, not siloed pages.</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">Jump from a candidate to their recruiter, company, job, batch and partner without ever losing context. Every screen is designed to keep you moving.</p>
              <ul className="mt-6 space-y-3">
                {["Every list card links to a rich detail workspace",
                  "Global search across candidates / companies / jobs / employees / batches / partners",
                  "Kanban pipeline with 14+ interview stages",
                  "Real-time notifications for every important event"].map(x => (
                    <li key={x} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{x}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.15}><DashboardShowcase /></Reveal>
          </div>
        </div>
      </section>

      {/* ================ WHY CHOOSE US ================ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <div className="overline text-primary">Why BES Info Tech</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">Built for consultancies. Not sales teams.</h2>
            </div>
          </Reveal>
          <Stagger className="mt-14 grid md:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <motion.div key={b.title} variants={staggerItem}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border p-6 bg-white dark:bg-slate-900/40">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <b.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="mt-4 font-display font-semibold text-lg">{b.title}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ================ TESTIMONIALS ================ */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <div className="overline text-primary">Loved by consultancies</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">Trusted by teams that placed thousands.</h2>
            </div>
          </Reveal>
          <Stagger className="mt-14 grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <motion.div key={t.name} variants={staggerItem}
                className="rounded-2xl border border-border p-6 bg-white dark:bg-slate-900/40">
                <Quote className="h-6 w-6 text-primary/30" />
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white grid place-items-center font-bold text-sm">{t.name[0]}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ================ FAQ ================ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <div className="text-center">
              <div className="overline text-primary">FAQ</div>
              <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold tracking-tighter">Common questions.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="mt-10">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`i${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ================ CTA ================ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-blue-800 text-white p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,#10B981,transparent_40%)]" />
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter leading-tight">Ready to shut down Excel for good?</h2>
                  <p className="mt-3 text-white/85 max-w-lg">Sign in to your admin console or register as a candidate to begin.</p>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <Link to="/register"><Button size="lg" variant="secondary" className="rounded-full h-12 px-6 shadow-xl" data-testid="cta-register">Register now</Button></Link>
                  <Link to="/contact"><Button size="lg" className="rounded-full h-12 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur" data-testid="cta-contact">Talk to us</Button></Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
