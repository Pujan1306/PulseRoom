"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  LogOut,
  MessageSquare,
  Monitor,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ScreenSharer } from "@/hooks/use-room-events";
import { AnimatedThemeToggler } from "../animated-theme-toggler";

interface RoomHeaderProps {
  roomCode: string;
  hostStreaming: boolean;
  screenSharer: ScreenSharer | null;
  chatOpen: boolean;
  unreadCount: number;
  onToggleChat: () => void;
  onLeave: () => void;
}

export function RoomHeader({
  roomCode,
  hostStreaming,
  screenSharer,
  chatOpen,
  unreadCount,
  onToggleChat,
  onLeave,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success("Code copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">PulseRoom</h1>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/70"
        >
          <span className="font-mono font-medium tracking-[0.25em] text-foreground">
            {roomCode}
          </span>
          {copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>

        {hostStreaming && (
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <Radio className="size-3.5 animate-pulse" />
            LIVE
          </span>
        )}

        {screenSharer && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Monitor className="size-3.5" />
            {screenSharer.name} is presenting
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <AnimatedThemeToggler />
        <Button
          type="button"
          variant={chatOpen ? "default" : "outline"}
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          className="relative"
        >
          <MessageSquare />
          Chat
          {unreadCount > 0 && !chatOpen && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onLeave}>
          <LogOut />
          Leave room
        </Button>
      </div>
    </header>
  );
}
