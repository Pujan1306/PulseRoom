"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Monitor } from "lucide-react";

export interface ReactionBubble {
  id: number;
  name: string;
  type: string;
}

interface ShareStageProps {
  screenStream: MediaStream | null;
  isSelfPresenting: boolean;
  presenterName: string;
  live: boolean;
  bubbles: ReactionBubble[];
  fullscreenControls?: React.ReactNode;
  faceCam?: React.ReactNode;
}

export function ShareStage({
  screenStream,
  isSelfPresenting,
  presenterName,
  live,
  bubbles,
  fullscreenControls,
  faceCam,
}: ShareStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const nowFullscreen = document.fullscreenElement === containerRef.current;
      setIsFullscreen(nowFullscreen);
      setShowControls(true);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const wake = () => {
      setShowControls(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
    };
    wake();
    document.addEventListener("pointermove", wake);

    return () => {
      window.clearTimeout(hideTimer.current);
      document.removeEventListener("pointermove", wake);
    };
  }, [isFullscreen]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch {
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black"
    >
      {isSelfPresenting ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
          <Monitor className="size-10 text-primary" />
          <p className="text-base font-medium">You're presenting</p>
          <p className="max-w-sm text-center text-xs text-white/60">
            Everyone else can see your screen. The preview of your own
            capture is hidden to avoid the infinite mirror effect.
          </p>
        </div>
      ) : screenStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
          <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-xs">Waiting for {presenterName}'s screen…</p>
        </div>
      )}

      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
        <Monitor className="size-3.5" />
        {isSelfPresenting ? "You" : presenterName} presenting
        {live && (
          <span className="ml-1 flex items-center gap-1 text-red-400">
            <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className={`absolute right-2 top-2 rounded-lg border border-white/20 bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80 ${
          isFullscreen && !showControls ? "opacity-0" : "opacity-100"
        }`}
      >
        {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </button>

      {faceCam}

      {isFullscreen && fullscreenControls && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex items-center justify-center pb-8 transition-opacity duration-300 ${
            showControls ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="rounded-2xl bg-black/80 p-4 backdrop-blur-sm">
            {fullscreenControls}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1 pb-2">
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              initial={{ opacity: 0, y: 16, scale: 0.8 }}
              animate={{ opacity: 1, y: -24, scale: 1 }}
              exit={{ opacity: 0, y: -48 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur"
            >
              {b.type} <span className="text-xs opacity-80">{b.name}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
