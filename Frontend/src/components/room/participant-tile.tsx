"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Monitor, VideoOff } from "lucide-react";

interface ParticipantTileProps {
  name: string;
  role: "host" | "audience";
  isSelf: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isPresenting: boolean;
  stream: MediaStream | null;
}

export function ParticipantTile({
  name,
  role,
  isSelf,
  micEnabled,
  cameraEnabled,
  isPresenting,
  stream,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = isSelf ? null : stream;
    }
  }, [stream, isSelf]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${!isPresenting && stream && cameraEnabled ? "" : "hidden"}`}
      />

      {!isSelf && <audio ref={audioRef} autoPlay />}

      {isPresenting ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-white">
          <Monitor className="size-6 text-primary" />
          <span className="text-xs">Presenting on stage</span>
        </div>
      ) : (!stream || !cameraEnabled) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-white">
          <VideoOff className="size-6" />
          <span className="text-xs">{!stream ? "No video yet" : "Camera off"}</span>
        </div>
      )}

      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {name}
          {isSelf && <span className="font-normal opacity-80">(you)</span>}
          {!micEnabled && <MicOff className="size-3 text-red-400" />}
        </span>
        <span className="rounded-md bg-black/60 px-1.5 py-1 text-[10px] uppercase tracking-wide text-white/80 backdrop-blur">
          {role}
        </span>
      </div>

      {stream && cameraEnabled && micEnabled && !isPresenting && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-1 text-[10px] text-white/80 backdrop-blur">
          <Mic className="size-3" />
          live
        </span>
      )}
    </div>
  );
}
