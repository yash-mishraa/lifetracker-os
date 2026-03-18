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

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/40">
          {["Features", "Pricing", "Changelog"].map(label => (
            <a key={label} href="#"
              className="hover:text-white/80 transition-colors duration-200">
              {label}
            </a>
          ))}
        </div>

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
          <a href="#features"
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