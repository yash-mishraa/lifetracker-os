"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── Typewriter (install first: npx shadcn@latest add https://21st.dev/r/preetsuthar17/typewriter-text)
// If not yet installed, replace with a simple span temporarily
let Typewriter: any;
try { Typewriter = require("@/components/ui/typewriter-text").Typewriter; } catch { Typewriter = null; }

const ease = [0.22, 1, 0.36, 1] as const;

// ── Grain overlay
function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 opacity-[0.035]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        mixBlendMode: "overlay",
      }}
    />
  );
}

// ── Shader background using CSS gradient (replaces ShaderGradient if package not ready)
function AnimatedBackground() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 30 });

  const bgX = useTransform(springX, [0, 1], ["-8%", "8%"]);
  const bgY = useTransform(springY, [0, 1], ["-8%", "8%"]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-[-10%]"
      >
        {/* ShaderGradient placeholder — replace inner div with <ShaderGradient .../> once installed */}
        <div
          className="w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 40%, rgba(234,98,168,0.35) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 80% 60%, rgba(138,245,255,0.25) 0%, transparent 60%),
              radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,1) 40%, transparent 100%)
            `,
            backgroundColor: "#000",
          }}
        />
      </motion.div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

// ── useInView helper
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const STEPS = [
  {
    num: "01",
    title: "Add your tasks & plan your day",
    desc: "Create tasks with priority, deadlines and time estimates. Drop them into the planner as time blocks — the two stay in sync automatically. Complete a block, the task is done.",
    accent: "from-blue-500/20 to-transparent",
    dot: "bg-blue-500",
    detail: ["Drag-to-reorder timeline", "Auto-creates tasks from blocks", "Calendar view for future days"],
  },
  {
    num: "02",
    title: "Build habits that actually stick",
    desc: "Set daily or custom-schedule habits. Track streaks, see your monthly heatmap, and let the dashboard show you whether you're consistent or slipping.",
    accent: "from-orange-500/20 to-transparent",
    dot: "bg-orange-500",
    detail: ["Streak tracking with history", "Completion rings on dashboard", "Reminder times per habit"],
  },
  {
    num: "03",
    title: "Log your health, effortlessly",
    desc: "One tap to log sleep, water, steps and workouts. Charts show trends over 7 or 14 days. Goals adjust the scoring so you hit targets that matter to you.",
    accent: "from-emerald-500/20 to-transparent",
    dot: "bg-emerald-500",
    detail: ["Sleep, water, steps, workout", "14-day trend charts", "Custom goal thresholds"],
  },
  {
    num: "04",
    title: "Set goals, track milestones",
    desc: "Long-term goals broken into milestones. Progress rings show how close you are. The discipline score ties everything together into a single daily number.",
    accent: "from-purple-500/20 to-transparent",
    dot: "bg-purple-500",
    detail: ["Milestone-based progress", "Category filters", "Discipline score (0–100)"],
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const { ref, inView } = useInView(0.15);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, ease, delay: index * 0.1 }}
      className="group relative"
    >
      {/* Connector line */}
      {index < STEPS.length - 1 && (
        <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-full h-px bg-white/[0.04]" />
      )}

      <div className={`relative bg-gradient-to-br ${step.accent} border border-white/[0.06] rounded-2xl p-7 h-full transition-all duration-500 group-hover:border-white/[0.1] group-hover:bg-white/[0.03]`}>
        {/* Step number */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-2 w-2 rounded-full ${step.dot} shadow-[0_0_8px_currentColor]`} />
          <span className="text-[11px] tracking-[0.15em] text-white/20 font-medium uppercase">{step.num}</span>
        </div>

        {/* Title */}
        <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-white/85 leading-snug mb-3">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-white/35 leading-relaxed mb-5">
          {step.desc}
        </p>

        {/* Detail list */}
        <ul className="space-y-2">
          {step.detail.map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-[12px] text-white/25">
              <span className="h-px w-3 bg-white/20 shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function HowItWorks() {
  const { ref, inView } = useInView(0.1);
  return (
    <section id="how-it-works" className="relative z-20 px-8 md:px-14 py-24">
      {/* Section header */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease }}
        className="text-center mb-16"
      >
        <p className="text-[11px] tracking-[0.2em] uppercase text-white/20 mb-3">How it works</p>
        <h2 className="text-[2.2rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-white/80 leading-tight max-w-xl mx-auto">
          Everything connected.<br />
          <span className="text-white/25">Nothing left out.</span>
        </h2>
      </motion.div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {STEPS.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, ease, delay: 0.6 }}
        className="text-center mt-14"
      >
        <Link href="/login"
          className="inline-flex items-center gap-2 bg-white text-black text-[14px] font-medium px-8 py-3.5 rounded-full hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.08)]">
          Start building your system
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBackground />
      <Grain />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-20 flex items-center justify-between px-8 py-6 md:px-14"
      >
        {/* Wordmark */}
        <div>
          <div className="flex items-baseline gap-[3px]">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">Life</span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/30">OS</span>
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/20 mt-[1px] ml-[1px]">Tracker</p>
        </div>

        {/* Nav links — removed */}

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-[13px] text-white/40 hover:text-white/80 transition-colors">
            Sign in
          </Link>
          <Link href="/login"
            className="flex items-center gap-1.5 bg-white text-black text-[13px] font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-all">
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="inline-flex items-center gap-2 border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm rounded-full px-3.5 py-1.5 text-[11px] text-white/40 tracking-wide mb-10"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Now in beta · Free to start
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="text-[3.5rem] md:text-[5.5rem] font-semibold tracking-[-0.04em] leading-[0.95] text-white max-w-4xl"
        >
          Your life,<br />
          <span className="text-white/30">finally organized.</span>
        </motion.h1>

        {/* Typewriter subline */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease, delay: 0.5 }}
          className="mt-6 text-[1.1rem] text-white/40 h-8 flex items-center"
        >
          {mounted && Typewriter ? (
            <Typewriter
              text={["Welcome back.", "Your system, organized.", "LifeOS begins here."]}
              speed={70}
              loop={true}
              className="text-[1.1rem] text-white/50 font-light tracking-[-0.01em]"
            />
          ) : (
            <span className="text-[1.1rem] text-white/40 font-light">
              Tasks · Habits · Health · Goals — one place.
            </span>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-12"
        >
          <Link href="/login"
            className="flex items-center gap-2 bg-white text-black font-medium text-[14px] px-7 py-3.5 rounded-full hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]">
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how-it-works"
            className="text-[14px] text-white/35 hover:text-white/60 transition-colors px-4 py-3.5">
            See how it works →
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 1 }}
          className="mt-10 text-[11px] text-white/20 tracking-wide"
        >
          Built for people who take their days seriously.
        </motion.p>
      </div>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Feature strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.9 }}
        className="relative z-20 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-0"
      >
        {[
          { label: "Tasks", desc: "Unified planner & task system" },
          { label: "Habits", desc: "Daily streaks & consistency" },
          { label: "Health", desc: "Sleep, water, steps, workouts" },
          { label: "Goals", desc: "Long-term milestones" },
        ].map((item, i) => (
          <div key={i}
            className="px-8 py-8 border-r border-white/[0.04] last:border-r-0 group">
            <p className="text-[11px] tracking-[0.12em] uppercase text-white/25 mb-1.5">{item.label}</p>
            <p className="text-[13px] text-white/50 group-hover:text-white/70 transition-colors leading-snug">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}