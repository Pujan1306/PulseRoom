"use client";

import HostRoom from "@/components/room/host-room";
import AudienceRoom from "@/components/room/audience-room";
import type { RoomShellProps } from "@/components/room/use-room-shell";

// Thin switcher: picks the room shell for the user's role. Both shells
// share the same plumbing (use-room-shell) and differ only in layout.
export default function InsideRoom(props: RoomShellProps) {
  return props.user.role === "host" ? (
    <HostRoom {...props} />
  ) : (
    <AudienceRoom {...props} />
  );
}
