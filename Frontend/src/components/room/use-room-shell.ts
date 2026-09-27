"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { socket } from "@/lib/socket-io-client";
import { useRoomEvents, type Participant, type ChatMessage, type ScreenSharer } from "@/hooks/use-room-events";
import { useWebRTC } from "@/hooks/use-webrtc";

export interface RoomShellProps {
  roomCode: string;
  user: { id: string; name: string; role: "host" | "audience" };
  stream: MediaStream;
  initialMicEnabled: boolean;
  initialCameraEnabled: boolean;
  onLeave: () => void;
}

export function useRoomShell(props: RoomShellProps) {
  const { roomCode, user, stream, initialMicEnabled, initialCameraEnabled } = props;

  const {
    me,
    participants,
    messages: remoteMessages,
    hostStreaming,
    screenSharer,
  } = useRoomEvents();
  const { remoteStreams, remoteScreens, startScreenShare, stopScreenShare } =
    useWebRTC(stream);

  const [micEnabled, setMicEnabled] = useState(initialMicEnabled);
  const [cameraEnabled, setCameraEnabled] = useState(initialCameraEnabled);
  const [chatOpen, setChatOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [reactionBubbles, setReactionBubbles] = useState<ReactionBubbleEntry[]>([]);
  const [amSharing, setAmSharing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Merge remote messages with local sender messages
  const messages = [...remoteMessages, ...localMessages].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const bubbleId = useRef(0);
  const amSharingRef = useRef(false);

  useEffect(() => {
    socket.auth = { roomCode, name: user.name, role: user.role };
    socket.connect();
    socket.emit("join-room", {
      roomCode,
      name: user.name,
      role: user.role,
      micEnabled: initialMicEnabled,
      cameraEnabled: initialCameraEnabled,
    });
    return () => {
      socket.emit("leave-room", { roomCode });
      socket.disconnect();
    };
  }, [roomCode, user, initialMicEnabled, initialCameraEnabled]);

  useEffect(() => {
    const onReaction = ({ name, type }: { name: string; type: string }) =>
      showReaction(type, name);
    const onChat = (m: ChatMessage) => {
      if (!chatOpen && m.socketId !== me) {
        setUnreadCount((prev) => prev + 1);
        toast(`${m.name} sent a message`, {
          description: m.message,
        });
      }
    };
    socket.on("reaction", onReaction);
    socket.on("chat-message", onChat);
    return () => {
      socket.off("reaction", onReaction);
      socket.off("chat-message", onChat);
    };
  }, [chatOpen, me]);

  function showReaction(type: string, name: string) {
    const id = ++bubbleId.current;
    setReactionBubbles((prev) => [...prev.slice(-8), { id, name, type }]);
    window.setTimeout(() => {
      setReactionBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 3000);
  }

  function toggleMic() {
    const enabled = !micEnabled;
    stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
    setMicEnabled(enabled);
    socket.emit("mic-state-changed", { roomCode, enabled });
  }

  function toggleCamera() {
    const enabled = !cameraEnabled;
    stream.getVideoTracks().forEach((track) => (track.enabled = enabled));
    setCameraEnabled(enabled);
    socket.emit("camera-state-changed", { roomCode, enabled });
  }

  async function endStream() {
    if (!amSharingRef.current) return;
    amSharingRef.current = false;
    setAmSharing(false);
    stopScreenShare();
    socket.emit("screen-share-stopped", { roomCode });
    socket.emit("host-ended-stream", { roomCode });
  }

  async function startStream() {
    if (amSharingRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });

      amSharingRef.current = true;
      setAmSharing(true);
      await startScreenShare(screenStream);
      socket.emit("screen-share-started", { roomCode });
      socket.emit("host-started-stream", { roomCode });

      // The browser's native stop bar ends the screen track without any
      // socket event — end the stream through the same path as our button
      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        void endStream();
      });
    } catch (error) {
      console.error("Screen share failed:", error);
      // user cancelled the picker — not an error worth a toast
      if ((error as DOMException)?.name !== "NotAllowedError") {
        toast.error("Couldn't start screen share");
      }
    }
  }

  function react(type: string) {
    socket.emit("reaction", { roomCode, type });
    showReaction(type, user.name);
  }

  function sendChat(text: string) {
    socket.emit("chat-message", { roomCode, message: text });
    setLocalMessages((prev) => [
      ...prev,
      { socketId: me ?? "self", name: user.name, message: text, timestamp: Date.now() },
    ]);
  }

  function toggleChat() {
    setChatOpen((prev) => {
      if (prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  }

  // The server broadcasts screen-share-started to OTHERS only — the host
  // knows locally, so its own share is merged into the shared state here
  const effectiveSharer: ScreenSharer | null = amSharing
    ? { socketId: me ?? "self", name: user.name }
    : screenSharer;

  const presenting = effectiveSharer !== null;
  const isMyShare = amSharing;
  const presenterId = effectiveSharer?.socketId ?? null;

  const roster: Participant[] = [
    {
      socketId: me ?? "self",
      name: user.name,
      role: user.role,
      micEnabled,
      cameraEnabled,
      joinTimestamp: Date.now(),
    },
    ...participants,
  ];

  // Viewers render the presenter's remote screen; the presenter's own
  // capture is never rendered locally (infinite-mirror guard)
  const stageStream: MediaStream | null = isMyShare
    ? null
    : presenterId
      ? remoteScreens[presenterId] ?? null
      : null;

  return {
    me,
    roster,
    messages,
    hostStreaming,
    screenSharer: effectiveSharer,
    presenting,
    isMyShare,
    presenterId,
    stageStream,
    remoteStreams,
    micEnabled,
    cameraEnabled,
    chatOpen,
    unreadCount,
    reactionBubbles,
    setChatOpen,
    toggleChat,
    toggleMic,
    toggleCamera,
    startStream,
    endStream,
    react,
    sendChat,
  };
}

export interface ReactionBubbleEntry {
  id: number;
  name: string;
  type: string;
}
