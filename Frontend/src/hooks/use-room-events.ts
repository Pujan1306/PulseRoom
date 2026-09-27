"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-io-client";

export type Participant = {
  socketId: string;
  name: string;
  role: "host" | "audience";
  micEnabled: boolean;
  cameraEnabled: boolean;
  joinTimestamp: number;
};

export type ChatMessage = {
  socketId: string;
  name: string;
  message: string;
  timestamp: number;
};

export type Reaction = {
  socketId: string;
  name: string;
  type: string;
};

export type ScreenSharer = {
  socketId: string;
  name: string;
};

export function useRoomEvents() {
  const [me, setMe] = useState<string | null>(socket.id ?? null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [hostStreaming, setHostStreaming] = useState(false);
  const [screenSharer, setScreenSharer] = useState<ScreenSharer | null>(null);

  useEffect(() => {
    const upsert = (p: Participant) =>
      setParticipants((prev) =>
        prev.some((x) => x.socketId === p.socketId) ? prev : [...prev, p]
      );
    const remove = ({ socketId }: { socketId: string }) =>
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    const patch = (socketId: string, changes: Partial<Participant>) =>
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, ...changes } : p))
      );
    const onConnect = () => setMe(socket.id ?? null);
    const onMic = ({ socketId, enabled }: { socketId: string; enabled: boolean }) =>
      patch(socketId, { micEnabled: enabled });
    const onCamera = ({ socketId, enabled }: { socketId: string; enabled: boolean }) =>
      patch(socketId, { cameraEnabled: enabled });
    const onChat = (m: ChatMessage) => setMessages((prev) => [...prev, m]);
    const onMessageHistory = (history: ChatMessage[]) => setMessages(history);
    const onHostPromoted = (p: Participant) => patch(p.socketId, { role: p.role });
    const onReaction = (r: Reaction) => setReactions((prev) => [...prev, r]);
    const onHostStart = () => setHostStreaming(true);
    const onHostEnd = () => setHostStreaming(false);
    const onShareStart = (sharer: ScreenSharer) => setScreenSharer(sharer);
    const onShareStop = () => setScreenSharer(null);
    const onShareStopCleanup = ({ socketId }: { socketId: string }) =>
      setScreenSharer((prev) => (prev?.socketId === socketId ? null : prev));

    socket.on("connect", onConnect);
    socket.on("participant-joined", upsert);
    socket.on("participant-left", remove);
    socket.on("mic-state-changed", onMic);
    socket.on("camera-state-changed", onCamera);
    socket.on("chat-message", onChat);
    socket.on("message-history", onMessageHistory);
    socket.on("host-promoted", onHostPromoted);
    socket.on("reaction", onReaction);
    socket.on("host-started-stream", onHostStart);
    socket.on("host-ended-stream", onHostEnd);
    socket.on("screen-share-started", onShareStart);
    socket.on("screen-share-stopped", onShareStop);
    socket.on("participant-left", onShareStopCleanup);

    return () => {
      socket.off("connect", onConnect);
      socket.off("participant-joined", upsert);
      socket.off("participant-left", remove);
      socket.off("mic-state-changed", onMic);
      socket.off("camera-state-changed", onCamera);
      socket.off("chat-message", onChat);
      socket.off("message-history", onMessageHistory);
      socket.off("host-promoted", onHostPromoted);
      socket.off("reaction", onReaction);
      socket.off("host-started-stream", onHostStart);
      socket.off("host-ended-stream", onHostEnd);
      socket.off("screen-share-started", onShareStart);
      socket.off("screen-share-stopped", onShareStop);
      socket.off("participant-left", onShareStopCleanup);
    };
  }, []);

  return { me, participants, messages, reactions, hostStreaming, screenSharer };
}
