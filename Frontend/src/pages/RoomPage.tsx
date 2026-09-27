"use client";

import { useState } from "react";
import { useParams } from "react-router";
import PreJoin from "@/components/pre-join";
import InsideRoom from "@/components/inside-room";

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [initialMedia, setInitialMedia] = useState({ micEnabled: true, cameraEnabled: true });

  const [user, setUser] = useState<{ id: string; name: string; role: "host" | "audience" } | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        return null;
      }
    }
    return null;
  });

  if (!roomCode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Room not found.</p>
      </div>
    );
  }

  function handleJoin(data: {
    user: {
      id: string;
      name: string;
      role: "host" | "audience";
    };
    stream: MediaStream;
    micEnabled: boolean;
    cameraEnabled: boolean;
  }) {
    setUser(data.user);
    setLocalStream(data.stream);
    setInitialMedia({ micEnabled: data.micEnabled, cameraEnabled: data.cameraEnabled });
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    setJoined(true);
  }

  function handleLeave() {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    // Unmounting InsideRoom emits leave-room and disconnects the socket
    setJoined(false);
  }

  if (!joined) {
    return <PreJoin roomCode={roomCode} user={user} onJoin={handleJoin} />;
  }

  if (!localStream || !user) {
    return null;
  }

  return (
    <InsideRoom
      roomCode={roomCode}
      user={user}
      stream={localStream}
      initialMicEnabled={initialMedia.micEnabled}
      initialCameraEnabled={initialMedia.cameraEnabled}
      onLeave={handleLeave}
    />
  );
}
