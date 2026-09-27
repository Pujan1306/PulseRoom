"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/hooks/use-room-events";

interface ChatPanelProps {
  messages: ChatMessage[];
  me: string | null;
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ChatPanel({ messages, me, onSend, onClose }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.2 }}
      className="absolute right-3 top-3 bottom-3 z-40 flex w-72 flex-col gap-2 rounded-2xl border bg-background/95 p-3 shadow-2xl backdrop-blur sm:right-4 sm:top-4 sm:bottom-4 sm:w-80"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Chat</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border bg-muted/30 p-3"
      >
        {messages.length === 0 ? (
          <p className="my-auto text-center text-xs text-muted-foreground">
            No messages yet — say hi 👋
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="flex flex-col">
              <p className="text-xs font-medium text-foreground">
                {m.name}
                {m.socketId === me && (
                  <span className="ml-1 text-muted-foreground">(you)</span>
                )}
                <span className="ml-2 font-normal text-muted-foreground">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
              <p className="break-words text-sm text-foreground/90">{m.message}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          maxLength={500}
          autoComplete="off"
          className="border-2 border-base"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()}>
          <Send />
        </Button>
      </form>
    </motion.aside>
  );
}
