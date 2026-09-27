"use client";

import { AnimatePresence } from "framer-motion";

import { RoomHeader } from "@/components/room/room-header";
import { ShareStage } from "@/components/room/share-stage";
import { RoomControls } from "@/components/room/room-controls";
import { ParticipantGrid } from "@/components/room/participant-grid";
import { ChatPanel } from "@/components/room/chat-panel";
import { useRoomShell, type RoomShellProps } from "@/components/room/use-room-shell";

export default function AudienceRoom(props: RoomShellProps) {
  const shell = useRoomShell(props);
  const { roomCode, stream, onLeave } = props;

  const controls = (
    <RoomControls
      micEnabled={shell.micEnabled}
      cameraEnabled={shell.cameraEnabled}
      isHost={false}
      isPresenting={false}
      onToggleMic={shell.toggleMic}
      onToggleCamera={shell.toggleCamera}
      onReact={shell.react}
    />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden p-3 sm:p-4">
      <RoomHeader
        roomCode={roomCode}
        hostStreaming={shell.hostStreaming}
        screenSharer={shell.screenSharer}
        chatOpen={shell.chatOpen}
        unreadCount={shell.unreadCount}
        onToggleChat={shell.toggleChat}
        onLeave={onLeave}
      />

      <div className="relative mt-3 flex min-h-0 flex-1 flex-col gap-3">
        {shell.presenting ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="min-h-0 overflow-hidden rounded-xl border bg-black">
              <ShareStage
                screenStream={shell.stageStream}
                isSelfPresenting={false}
                presenterName={shell.screenSharer?.name ?? ""}
                live={shell.hostStreaming}
                bubbles={shell.reactionBubbles}
                fullscreenControls={controls}
              />
            </div>
            <ParticipantGrid
              roster={shell.roster}
              remoteStreams={shell.remoteStreams}
              localStream={stream}
              me={shell.me}
              presenterId={shell.presenterId}
              layout="side"
              className="min-h-0"
            />
          </div>
        ) : (
          <ParticipantGrid
            roster={shell.roster}
            remoteStreams={shell.remoteStreams}
            localStream={stream}
            me={shell.me}
            presenterId={shell.presenterId}
            className="min-h-0"
          />
        )}

        {controls}

        <AnimatePresence>
          {shell.chatOpen && (
            <ChatPanel
              messages={shell.messages}
              me={shell.me}
              onSend={shell.sendChat}
              onClose={() => shell.setChatOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
