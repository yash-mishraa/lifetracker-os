"use client";

import React, { useState, useMemo, useRef, useEffect, forwardRef, useCallback, type JSX } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type PanInfo } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/services/auth-service";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
type ButtonProps = ComponentProps<typeof Button>;import { cn } from "@/lib/utils";

let Typewriter: any;
try { Typewriter = require("@/components/ui/typewriter-text").Typewriter; } catch { Typewriter = null; }

const ease = [0.22, 1, 0.36, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CanvasRevealEffect
// ─────────────────────────────────────────────────────────────────────────────

type Uniforms = { [key: string]: { value: number[] | number[][] | number; type: string } };

interface ShaderProps { source: string; uniforms: Uniforms; maxFps?: number; }

const ShaderMaterialComponent = ({ source, uniforms, maxFps = 60 }: { source: string; uniforms: Uniforms; maxFps?: number }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat: any = ref.current.material;
    mat.uniforms.u_time.value = clock.getElapsedTime();
  });
  const getUniforms = () => {
    const prep: any = {};
    for (const k in uniforms) {
      const u: any = uniforms[k];
      switch (u.type) {
        case "uniform1f": prep[k] = { value: u.value }; break;
        case "uniform1i": prep[k] = { value: u.value }; break;
        case "uniform1fv": prep[k] = { value: u.value }; break;
        case "uniform3fv": prep[k] = { value: u.value.map((v: number[]) => new THREE.Vector3().fromArray(v)) }; break;
        default: break;
      }
    }
    prep["u_time"] = { value: 0 };
    prep["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return prep;
  };
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `precision mediump float; uniform vec2 u_resolution; out vec2 fragCoord;
      void main(){ gl_Position = vec4(position.xy, 0.0, 1.0);
      fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
      fragCoord.y = u_resolution.y - fragCoord.y; }`,
    fragmentShader: source,
    uniforms: getUniforms(),
    glslVersion: THREE.GLSL3,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor,
  }), [size.width, size.height, source]);
  return <mesh ref={ref as any}><planeGeometry args={[2, 2]} /><primitive object={material} attach="material" /></mesh>;
};

const ShaderCanvas: React.FC<ShaderProps> = ({ source, uniforms }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterialComponent source={source} uniforms={uniforms} />
  </Canvas>
);

interface DotMatrixProps { colors?: number[][]; opacities?: number[]; totalSize?: number; dotSize?: number; shader?: string; center?: ("x"|"y")[]; }

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[255,255,255]], opacities = [0.03,0.03,0.03,0.05,0.05,0.05,0.08,0.08,0.08,0.12],
  totalSize = 20, dotSize = 2, shader = "", center = ["x","y"],
}) => {
  const uniforms = useMemo(() => {
    let ca = [colors[0],colors[0],colors[0],colors[0],colors[0],colors[0]];
    if (colors.length===2) ca=[colors[0],colors[0],colors[0],colors[1],colors[1],colors[1]];
    else if (colors.length===3) ca=[colors[0],colors[0],colors[1],colors[1],colors[2],colors[2]];
    return {
      u_colors: { value: ca.map(c=>[c[0]/255,c[1]/255,c[2]/255]), type:"uniform3fv" },
      u_opacities: { value: opacities, type:"uniform1fv" },
      u_total_size: { value: totalSize, type:"uniform1f" },
      u_dot_size: { value: dotSize, type:"uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active")?1:0, type:"uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  const cx = center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : "";
  const cy = center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : "";

  return (
    <ShaderCanvas uniforms={uniforms} source={`
      precision mediump float;
      in vec2 fragCoord;
      uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6];
      uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution;
      uniform int u_reverse;
      out vec4 fragColor;
      float PHI = 1.61803398874989484820459;
      float random(vec2 xy){ return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x); }
      void main(){
        vec2 st = fragCoord.xy;
        ${cx} ${cy}
        float opacity = step(0.0,st.x)*step(0.0,st.y);
        vec2 st2 = vec2(int(st.x/u_total_size),int(st.y/u_total_size));
        float show_offset = random(st2);
        float rand = random(st2*floor((u_time/5.0)+show_offset+5.0));
        opacity *= u_opacities[int(rand*10.0)];
        opacity *= (1.0-step(u_dot_size/u_total_size,fract(st.x/u_total_size)));
        opacity *= (1.0-step(u_dot_size/u_total_size,fract(st.y/u_total_size)));
        vec3 color = u_colors[int(show_offset*6.0)];
        float anim = 0.5;
        vec2 cg = u_resolution/2.0/u_total_size;
        float dist = distance(cg,st2);
        float t_in = dist*0.01+(random(st2)*0.15);
        float t_out = (distance(cg,vec2(0.0))-dist)*0.02+(random(st2+42.0)*0.2);
        float t = (u_reverse==1)?t_out:t_in;
        if(u_reverse==1){ opacity*=(1.0-step(t,u_time*anim)); opacity*=clamp(step(t+0.1,u_time*anim)*1.25,1.0,1.25); }
        else { opacity*=step(t,u_time*anim); opacity*=clamp((1.0-step(t+0.1,u_time*anim))*1.25,1.0,1.25); }
        fragColor = vec4(color,opacity); fragColor.rgb*=fragColor.a;
      }
    `} />
  );
};

export const CanvasRevealEffect = ({
  animationSpeed=3, opacities=[0.3,0.3,0.3,0.5,0.5,0.5,0.8,0.8,0.8,1],
  colors=[[255,255,255]], containerClassName, dotSize, showGradient=true, reverse=false,
}: { animationSpeed?:number; opacities?:number[]; colors?:number[][]; containerClassName?:string; dotSize?:number; showGradient?:boolean; reverse?:boolean }) => (
  <div className={cn("h-full relative w-full", containerClassName)}>
    <DotMatrix colors={colors} dotSize={dotSize??3} opacities={opacities}
      shader={`${reverse?"u_reverse_active":"false"}_; animation_speed_factor_${animationSpeed.toFixed(1)}_`}
      center={["x","y"]} />
    {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SlideButton
// ─────────────────────────────────────────────────────────────────────────────

const DRAG_CONSTRAINTS = { left: 0, right: 155 };
const DRAG_THRESHOLD = 0.9;

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const iconMap: Record<string, JSX.Element> = useMemo(() => ({
    loading: <Loader2 className="animate-spin" size={18} />,
    success: <Check size={18} />,
    error: <X size={18} />,
  }), []);
  if (!iconMap[status]) return null;
  return <motion.div key={status} initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>{iconMap[status]}</motion.div>;
};

const useButtonStatus = (resolveTo: "success"|"error") => {
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const handleSubmit = useCallback(() => { setStatus("loading"); setTimeout(()=>setStatus(resolveTo),2000); }, [resolveTo]);
  return { status, handleSubmit };
};

const SlideButton = forwardRef<HTMLButtonElement, ButtonProps & { onSlideComplete?: () => void }>(
  ({ className, onSlideComplete, ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const { status, handleSubmit } = useButtonStatus("success");
    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, { type:"spring", stiffness:400, damping:40, mass:0.8 } as any);
    const dragProgress = useTransform(springX, [0, DRAG_CONSTRAINTS.right], [0, 1]);
    const adjustedWidth = useTransform(springX, (x) => x + 10);
    const glowOpacity = useTransform(springX, [0, DRAG_CONSTRAINTS.right], [0, 0.6]);

    const handleDragEnd = () => {
      setIsDragging(false);
      if (dragProgress.get() >= DRAG_THRESHOLD) {
        setCompleted(true);
        handleSubmit();
        onSlideComplete?.();
      } else { dragX.set(0); }
    };
    const handleDrag = (_e: any, info: PanInfo) => {
      dragX.set(Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right)));
    };

    return (
      <motion.div
        animate={completed ? { width:"8rem" } : { width:"12rem" }}
        transition={{ type:"spring", stiffness:400, damping:40 }}
        className="relative flex h-10 items-center justify-center rounded-full bg-white/10 border border-white/[0.08] overflow-hidden"
      >
        {/* Glow */}
        <motion.div style={{ opacity: glowOpacity }}
          className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 rounded-full blur-sm pointer-events-none" />

        {/* Progress fill */}
        {!completed && (
          <motion.div style={{ width: adjustedWidth }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-gradient-to-r from-white/30 to-white/10" />
        )}

        <AnimatePresence>
          {!completed && (
            <motion.div
              drag="x" dragConstraints={DRAG_CONSTRAINTS} dragElastic={0.05} dragMomentum={false}
              onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd} onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-10 flex cursor-grab items-center active:cursor-grabbing"
            >
              <Button ref={ref} {...props} size="icon"
                className={cn("rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow", isDragging && "scale-105", className)}>
                <SendHorizontal className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completed && (
            <motion.div className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <motion.div animate={status==="success" ? { scale:[1,1.1,1] } : {}} transition={{ duration:0.4 }}>
                <Button ref={ref} {...props}
                  className={cn("size-full rounded-full bg-white text-black", className)}>
                  <AnimatePresence mode="wait"><StatusIcon status={status} /></AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!completed && (
          <span className="text-[11px] text-white/30 tracking-wide select-none pointer-events-none z-0">
            slide to sign in →
          </span>
        )}
      </motion.div>
    );
  }
);
SlideButton.displayName = "SlideButton";

// ─────────────────────────────────────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(true);
  const [reverseCanvas, setReverseCanvas] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirmation link sent." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ variant:"destructive", title:"Error", description: err.message });
    } finally { setIsLoading(false); }
  };

  const handleSlideComplete = () => {
    setReverseCanvas(true);
    setTimeout(() => setCanvasVisible(false), 50);
    handleAuth();
  };

  const handleGoogleAuth = async () => {
    try { await signInWithGoogle(); }
    catch (err: any) { toast({ variant:"destructive", title:"Google Error", description: err.message }); }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col">

      {/* ── Canvas background ── */}
      <div className="absolute inset-0 z-0">
        {canvasVisible && (
          <CanvasRevealEffect animationSpeed={3} colors={[[255,255,255]]} dotSize={5} reverse={false} />
        )}
        {reverseCanvas && (
          <CanvasRevealEffect animationSpeed={4} colors={[[255,255,255]]} dotSize={5} reverse={true} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ duration:0.6, ease }}
        className="relative z-20 flex items-center justify-between px-8 py-6"
      >
        <Link href="/">
          <div className="flex items-baseline gap-[3px]">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">Life</span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/30">OS</span>
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/20 mt-[1px] ml-[1px]">Tracker</p>
        </Link>
        <Link href="/" className="text-[12px] text-white/25 hover:text-white/50 transition-colors">← Back</Link>
      </motion.nav>

      {/* ── Form ── */}
      <div className="relative z-20 flex flex-1 items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity:0, y:24, filter:"blur(8px)" }}
          animate={{ opacity:1, y:0, filter:"blur(0px)" }}
          transition={{ duration:0.8, ease, delay:0.2 }}
          className="w-full max-w-[380px]"
        >
          {/* Heading with typewriter */}
          <div className="mb-10 space-y-2">
            <h1 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-white/90 leading-tight">
              {isSignUp ? "Create account" : "Welcome back"}
            </h1>
            <div className="h-6 flex items-center">
              {Typewriter ? (
                <Typewriter
                  text={["Welcome back.", "Your system, organized.", "LifeOS begins here."]}
                  speed={70} loop={true}
                  className="text-[13px] text-white/35 font-light tracking-[-0.01em]"
                />
              ) : (
                <p className="text-[13px] text-white/35">
                  {isSignUp ? "Start building your system today." : "Sign in to continue."}
                </p>
              )}
            </div>
          </div>

          {/* Google */}
          <button onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2.5 h-11 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/75 hover:bg-white/[0.08] rounded-xl text-[13px] transition-all mb-5">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-white/20 uppercase tracking-[0.06em]">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email + Password */}
          <form onSubmit={handleAuth} className="space-y-3 mb-6">
            <motion.input
              type="email" placeholder="Email address" required value={email}
              onChange={e => setEmail(e.target.value)}
              whileFocus={{ scale:1.01 }}
              className="w-full h-11 bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 rounded-xl px-4 text-[13px] outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
            />
            <motion.input
              type="password" placeholder="Password" required value={password}
              onChange={e => setPassword(e.target.value)}
              whileFocus={{ scale:1.01 }}
              className="w-full h-11 bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 rounded-xl px-4 text-[13px] outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
            />
            <div className="flex justify-end">
              {!isSignUp && <button type="button" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Forgot password?</button>}
            </div>

            {/* SlideButton for sign-in, regular for sign-up */}
            {!isSignUp ? (
              <div className="pt-1 flex justify-center">
                <SlideButton onSlideComplete={handleSlideComplete} />
              </div>
            ) : (
              <button type="submit" disabled={isLoading}
                className="w-full h-11 bg-white text-black font-medium text-[13px] rounded-xl hover:bg-white/90 transition-all mt-1">
                {isLoading ? "Creating account…" : "Create account"}
              </button>
            )}
          </form>

          {/* Toggle */}
          <p className="text-center text-[12px] text-white/25">
            {isSignUp ? "Have an account? " : "No account? "}
            <button onClick={() => setIsSignUp(!isSignUp)}
              className="text-white/50 hover:text-white/80 transition-colors font-medium">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p className="mt-8 text-center text-[10px] text-white/15 leading-relaxed">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}