"use client";

import { Mic, MicOff, MonitorOff, Radio, Video, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";

const REACTION_TYPES = ["👍", "❤️", "😂", "🎉", "👏"];

interface RoomControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  isHost: boolean;
  isPresenting: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onStartStream?: () => void;
  onEndStream?: () => void;
  onReact: (type: string) => void;
  variant?: "bar" | "overlay";
}

export function RoomControls({
  micEnabled,
  cameraEnabled,
  isHost,
  isPresenting,
  onToggleMic,
  onToggleCamera,
  onStartStream,
  onEndStream,
  onReact,
  variant = "bar",
}: RoomControlsProps) {
  const overlay = variant === "overlay";

  return (
    <div
      className={
        overlay
          ? "flex items-center gap-2 rounded-2xl bg-black/70 px-4 py-3 backdrop-blur"
          : "flex flex-wrap items-center gap-2"
      }
    >
      {overlay ? (
        <>
          <Button type="button" variant="ghost" size="icon" onClick={onToggleMic} className="text-white hover:bg-white/10">
            {micEnabled ? <Mic /> : <MicOff className="text-red-400" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onToggleCamera} className="text-white hover:bg-white/10">
            {cameraEnabled ? <Video /> : <VideoOff className="text-red-400" />}
          </Button>
          {isHost && (
            <Button type="button" variant="ghost" size="icon" onClick={isPresenting ? onEndStream : onStartStream} className="text-white hover:bg-white/10">
              {isPresenting ? <MonitorOff className="text-red-400" /> : <Radio />}
            </Button>
          )}
          <span className="mx-1 h-6 w-px bg-white/20" />
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onReact(type)}
              className="rounded-lg px-1.5 py-1 text-lg transition hover:scale-125 hover:bg-white/10"
            >
              {type}
            </button>
          ))}
        </>
      ) : (
        <>
          <Button
            type="button"
            variant={micEnabled ? "default" : "outline"}
            onClick={onToggleMic}
          >
            {micEnabled ? <Mic /> : <MicOff />}
            {micEnabled ? "Mic on" : "Mic off"}
          </Button>
          <Button
            type="button"
            variant={cameraEnabled ? "default" : "outline"}
            onClick={onToggleCamera}
          >
            {cameraEnabled ? <Video /> : <VideoOff />}
            {cameraEnabled ? "Camera on" : "Camera off"}
          </Button>
          {isHost && (
            <Button
              type="button"
              variant={isPresenting ? "destructive" : "default"}
              onClick={isPresenting ? onEndStream : onStartStream}
            >
              {isPresenting ? <MonitorOff /> : <Radio />}
              {isPresenting ? "End stream" : "Start stream"}
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1">
            {REACTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onReact(type)}
                className="rounded-lg px-2 py-1 text-lg transition hover:scale-125 hover:bg-muted"
              >
                {type}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
