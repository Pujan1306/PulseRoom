"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";

import type { Participant } from "@/hooks/use-room-events";
import { ParticipantTile } from "@/components/room/participant-tile";

interface ParticipantGridProps {
  roster: Participant[];
  remoteStreams: Record<string, MediaStream>;
  localStream: MediaStream;
  me: string | null;
  presenterId: string | null;
  layout?: "full" | "side";
  className?: string;
}

export function ParticipantGrid({
  roster,
  remoteStreams,
  localStream,
  me,
  presenterId,
  layout = "full",
  className,
}: ParticipantGridProps) {
  const [expanded, setExpanded] = useState(false);

  const capacity = layout === "full" ? 16 : 8;
  const visible = roster.slice(0, capacity);
  const overflow = roster.slice(capacity);

  function streamFor(p: Participant): MediaStream | null {
    return p.socketId === me ? localStream : remoteStreams[p.socketId] ?? null;
  }

  const cols =
    layout === "full"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-1 xl:grid-cols-2";

  return (
    <div className={`relative grid h-full min-h-0 content-stretch gap-2 ${cols} ${className ?? ""}`}>
      {visible.map((p) => (
        <ParticipantTile
          key={p.socketId}
          name={p.name}
          role={p.role}
          isSelf={p.socketId === me}
          micEnabled={p.micEnabled}
          cameraEnabled={p.cameraEnabled}
          isPresenting={p.socketId === presenterId}
          stream={streamFor(p)}
        />
      ))}

      {overflow.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/40 text-muted-foreground transition hover:bg-muted"
          >
            <span className="flex flex-col items-center gap-1">
              <Users className="size-6" />
              <span className="text-sm font-medium">+{overflow.length}</span>
              <span className="text-[10px]">more</span>
            </span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
                onClick={() => setExpanded(false)}
              >
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  className="grid max-h-full w-fit grid-cols-2 gap-3 overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl sm:grid-cols-3 lg:grid-cols-4"
                >
                  {overflow.map((p) => (
                    <div key={p.socketId} className="w-40">
                      <ParticipantTile
                        name={p.name}
                        role={p.role}
                        isSelf={p.socketId === me}
                        micEnabled={p.micEnabled}
                        cameraEnabled={p.cameraEnabled}
                        isPresenting={p.socketId === presenterId}
                        stream={streamFor(p)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="col-span-full rounded-lg bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                  >
                    close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
