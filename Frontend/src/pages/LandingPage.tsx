"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bolt,
  DoorClosed,
  KeyRound,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoomDialog } from "@/components/room-dialog";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { useTheme } from "@/components/theme-provider";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
  },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease,
    },
  }),
};

const features = [
  { icon: KeyRound, label: "No account needed" },
  { icon: Bolt, label: "Instant room code" },
  { icon: Radio, label: "Real-time presence" },
];


export default function LandingPage() {
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <DoorClosed className="size-5" />
          </span>
          <div className="leading-none">
            <p className="text-base font-semibold tracking-tight">Roomly</p>
            <p className="text-[11px] text-muted-foreground">rooms, live</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatedThemeToggler theme={theme === "dark" ? "dark" : "light"} onThemeChange={setTheme} />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10 pt-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Live rooms happening now
            <span className="text-foreground/30">·</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              No sign-up
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            A single door to{" "}
            <span className="text-gradient-brand">every room.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            Create a new room or drop into one that&apos;s already alive — one
            button, your call. No accounts, no friction, just instant presence.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-9 flex flex-col items-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="cta-glow group h-14 rounded-full px-8 text-base font-semibold shadow-2xl shadow-primary/30 transition-transform hover:scale-[1.03] active:scale-100"
            >
              <span>
                Create or Join a Room
              </span>

              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Button>

            <p className="text-xs text-muted-foreground">
              Free forever · Works in any browser
            </p>
          </motion.div>

          <motion.ul
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/80"
          >
            <ShieldCheck className="size-3.5" />
            End-to-end presence · Codes expire when the room goes quiet
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto border-t border-border/50 bg-background/40 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Roomly. All rooms reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground transition-colors cursor-default">
              Privacy
            </span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Terms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>

      <RoomDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
