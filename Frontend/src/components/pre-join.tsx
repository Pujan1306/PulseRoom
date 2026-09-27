"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  User,
  Video,
  VideoOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PreJoinProps {
  roomCode: string;
  user: {
    id: string;
    name: string;
    role: "host" | "audience";
  } | null;
  onJoin: (data: {
    user: {
      id: string;
      name: string;
      role: "host" | "audience";
    };
    stream: MediaStream;
    micEnabled: boolean;
    cameraEnabled: boolean;
  }) => void;
}

export default function PreJoin({ roomCode, user, onJoin }: PreJoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Set when the stream is handed off to the room — the room owns stopping
  // the tracks afterwards, so unmounting PreJoin must not kill them
  const handedOff = useRef(false);

  const [stream, setStream] = useState<MediaStream | null>(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Direct visits have no saved user — the name is typed here; saved users
  // can edit theirs (keeping their id and role)
  const [name, setName] = useState(user?.name ?? "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function startPreview() {
    try {
      setLoading(true);
      setError("");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      setError("Camera or microphone permission was denied.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startPreview();

    return () => {
      if (!handedOff.current) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function toggleMic() {
    if (!stream) return;
    const enabled = !micEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicEnabled(enabled);
  }

  function toggleCamera() {
    if (!stream) return;
    const enabled = !cameraEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraEnabled(enabled);
  }

  function handleJoin() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name before joining.");
      return;
    }

    if (!stream) {
      setError("Camera and microphone are not ready.");
      return;
    }

    const joinUser: NonNullable<typeof user> = user
      ? { ...user, name: trimmedName }
      : { id: crypto.randomUUID(), name: trimmedName, role: "audience" };

    handedOff.current = true;
    onJoin({
      user: joinUser,
      stream,
      micEnabled,
      cameraEnabled,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <p className="mb-1 text-sm text-muted-foreground">
            Room{" "}
            <span className="font-mono font-medium tracking-widest text-foreground">
              {roomCode}
            </span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ready to join?
          </h1>
        </div>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center">
          {/* left: camera preview with mic/camera toggles centered below */}
          <div className="flex w-full flex-1 flex-col items-center gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                  <Loader2 className="size-6 animate-spin" />
                  Starting camera…
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {!cameraEnabled && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-white">
                  <VideoOff className="size-8" />
                  Camera is off
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant={micEnabled ? "default" : "outline"}
                onClick={toggleMic}
                disabled={!stream}
              >
                {micEnabled ? <Mic /> : <MicOff />}
                {micEnabled ? "Mic on" : "Mic off"}
              </Button>
              <Button
                type="button"
                variant={cameraEnabled ? "default" : "outline"}
                onClick={toggleCamera}
                disabled={!stream}
              >
                {cameraEnabled ? <Video /> : <VideoOff />}
                {cameraEnabled ? "Camera on" : "Camera off"}
              </Button>
            </div>
          </div>

          {/* right: name + join */}
          <div className="flex w-full flex-col gap-4 lg:w-80">
            <div className="flex flex-col gap-2">
              <Label htmlFor="join-name" className="text-sm">
                Your name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="join-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="pl-9 border-2 border-base"
                  maxLength={24}
                  autoComplete="off"
                  autoFocus={!user?.name}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Joining as{" "}
                <span className="font-medium text-foreground capitalize">
                  {user?.role ?? "audience"}
                </span>
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleJoin}
              disabled={loading || !name.trim()}
              size="lg"
              className="w-full"
            >
              Join room
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}