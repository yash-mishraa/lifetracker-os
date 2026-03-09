"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Repeat, Heart, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export function QuickAddFab() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Hide FAB on login/onboarding routes
  const hiddenPaths = ["/login", "/onboarding"];
  if (hiddenPaths.includes(pathname)) return null;

  const actions = [
    { icon: CheckSquare, label: "Add Task", color: "bg-blue-500", onClick: () => router.push("/tasks?add=true") },
    { icon: Repeat, label: "Add Habit", color: "bg-emerald-500", onClick: () => router.push("/habits?add=true") },
    { icon: Heart, label: "Log Health", color: "bg-rose-500", onClick: () => router.push("/health?log=true") },
    { icon: Timer, label: "Start Timer", color: "bg-purple-500", onClick: () => router.push("/dashboard?timer=true") },
  ];

  // Prevent scrolling when open in mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-20 right-6 z-[60] flex flex-col-reverse items-end lg:bottom-10 lg:right-10">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-95 z-20 ${
          isOpen ? "bg-zinc-800 text-white hover:bg-zinc-900" : "bg-primary text-primary-foreground hover:bg-primary/95"
        }`}
      >
        <motion.div animate={{ rotate: isOpen ? 135 : 0 }} transition={{ duration: 0.3, type: "spring" }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col gap-4 mb-5 items-end relative z-20"
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center gap-4 group cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
              >
                <div className="bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-border/50 text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </div>
                <div className={`h-12 w-12 rounded-full shadow-lg text-white ${action.color} flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95`}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
