"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket-io-client";
import { ICE_SERVERS } from "@/lib/ice-servers";
import type { Participant } from "@/hooks/use-room-events";

type SdpPayload = RTCSessionDescriptionInit;

// Mesh WebRTC: every participant opens a peer connection to every other
// participant. Camera + mic flow as the base tracks; a screen share rides
// as an EXTRA video track on the same connections (added/removed with
// renegotiation), so the presenter's camera keeps flowing.
//
// Negotiation follows the "perfect negotiation" pattern: the peer with the
// lexicographically smaller socket id is impolite (never rolls back), the
// larger one is polite (rolls back its pending offer on a collision). This
// survives any timing — including a screen share starting while the
// initial connection is still being set up.
export function useWebRTC(stream: MediaStream | null) {
  // peerId -> their camera/mic stream
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  // peerId -> their screen stream (only while they present)
  const [remoteScreens, setRemoteScreens] = useState<Record<string, MediaStream>>({});

  const streamRef = useRef(stream);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());
  const negotiation = useRef(
    new Map<string, { polite: boolean; makingOffer: boolean; ignoreOffer: boolean }>()
  );

  useEffect(() => {
    // Local aliases so the cleanup never reads ref.current directly
    const peerConnections = pcs.current;
    const candidatesBuffer = pendingCandidates.current;
    const negotiationStates = negotiation.current;

    function closePeer(peerId: string) {
      const pc = peerConnections.get(peerId);
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.onnegotiationneeded = null;
        pc.close();
        peerConnections.delete(peerId);
      }
      candidatesBuffer.delete(peerId);
      negotiationStates.delete(peerId);
      setRemoteStreams((prev) => {
        if (!(peerId in prev)) return prev;
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      setRemoteScreens((prev) => {
        if (!(peerId in prev)) return prev;
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    }

    function createPeer(peerId: string) {
      const existing = peerConnections.get(peerId);
      if (existing) return existing;

      const myId = socket.id ?? "";
      // Both sides compute the same polarity: smaller id = impolite
      negotiationStates.set(peerId, {
        polite: myId > peerId,
        makingOffer: false,
        ignoreOffer: false,
      });

      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });
      peerConnections.set(peerId, pc);

      // Fires for the initial tracks AND whenever the screen track is
      // added/removed — one renegotiation path for both
      pc.onnegotiationneeded = () => {
        const state = negotiationStates.get(peerId);
        if (!state) return;
        void (async () => {
          try {
            state.makingOffer = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (pc.localDescription) {
              socket.emit("webrtc-offer", {
                targetSocketId: peerId,
                sdp: pc.localDescription,
              });
            }
          } catch (error) {
            console.error("Renegotiation failed with peer:", peerId, error);
          } finally {
            state.makingOffer = false;
          }
        })();
      };

      const local = streamRef.current;
      if (local) {
        local.getTracks().forEach((track) => pc.addTrack(track, local));
      }
      const screen = screenStreamRef.current;
      if (screen) {
        screen.getTracks().forEach((track) => pc.addTrack(track, screen));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            targetSocketId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        // Screen vs camera: the base getUserMedia stream always carries the
        // mic track (PreJoin requires both permissions), while the screen
        // capture is video-only — so audio presence identifies the camera
        const isScreen = remoteStream.getAudioTracks().length === 0;
        if (isScreen) {
          setRemoteScreens((prev) => ({ ...prev, [peerId]: remoteStream }));
          event.track.onended = () => {
            setRemoteScreens((prev) => {
              if (prev[peerId] !== remoteStream) return prev;
              const next = { ...prev };
              delete next[peerId];
              return next;
            });
          };
        } else {
          setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          // Common without a TURN relay across strict NATs — see
          // src/lib/ice-servers.ts
          console.error("Peer connection failed:", peerId);
          closePeer(peerId);
        }
      };

      return pc;
    }

    // Candidates can arrive before the offer is applied — buffer them
    // until the remote description is set, then flush
    async function flushCandidates(peerId: string, pc: RTCPeerConnection) {
      const buffered = candidatesBuffer.get(peerId) ?? [];
      candidatesBuffer.delete(peerId);
      for (const candidate of buffered) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Failed to add buffered ICE candidate:", error);
        }
      }
    }

    const onPeerJoined = (peer: Participant) => {
      const myId = socket.id;
      if (!myId || peer.socketId === myId) return;
      // One initiator per pair: the lexicographically smaller id creates
      // the peer connection (and thereby the first offer)
      if (myId < peer.socketId) {
        createPeer(peer.socketId);
      }
    };

    const onPeerLeft = ({ socketId }: { socketId: string }) => closePeer(socketId);

    const onOffer = async ({
      fromSocketId,
      sdp,
    }: {
      fromSocketId: string;
      sdp: SdpPayload;
    }) => {
      let pc = peerConnections.get(fromSocketId);
      if (pc?.connectionState === "failed") {
        closePeer(fromSocketId);
        pc = undefined;
      }
      pc ??= createPeer(fromSocketId);
      const neg = negotiationStates.get(fromSocketId);
      if (!pc || !neg) return;

      try {
        const collision =
          neg.makingOffer || pc.signalingState !== "stable";
        neg.ignoreOffer = !neg.polite && collision;
        if (neg.ignoreOffer) return;

        if (neg.polite && collision) {
          // Roll back our competing offer and defer to the remote one
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch {
            // no pending offer to roll back — proceed
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(fromSocketId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            sdp: pc.localDescription,
          });
        }
      } catch (error) {
        console.error("Failed to handle WebRTC offer:", error);
      }
    };

    const onAnswer = async ({
      fromSocketId,
      sdp,
    }: {
      fromSocketId: string;
      sdp: SdpPayload;
    }) => {
      const pc = peerConnections.get(fromSocketId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(fromSocketId, pc);
      } catch (error) {
        console.error("Failed to handle WebRTC answer:", error);
      }
    };

    const onIceCandidate = async ({
      fromSocketId,
      candidate,
    }: {
      fromSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.get(fromSocketId);
      const neg = negotiationStates.get(fromSocketId);
      if (!pc || !neg) return;
      if (!pc.remoteDescription) {
        const buffered = candidatesBuffer.get(fromSocketId) ?? [];
        buffered.push(candidate);
        candidatesBuffer.set(fromSocketId, buffered);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        // Candidates rejected during rollback are expected — only real
        // failures in stable state are worth reporting
        if (!neg.ignoreOffer && pc.signalingState === "stable") {
          console.error("Failed to add ICE candidate:", error);
        }
      }
    };

    socket.on("participant-joined", onPeerJoined);
    socket.on("participant-left", onPeerLeft);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);

    return () => {
      socket.off("participant-joined", onPeerJoined);
      socket.off("participant-left", onPeerLeft);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      for (const peerId of [...peerConnections.keys()]) {
        closePeer(peerId);
      }
    };
  }, []);

  // --- Screen share (host side) -----------------------------------------
  // The screen goes out as a second track on every peer connection;
  // onnegotiationneeded handles the renegotiation, and mid-share joiners
  // get it via createPeer copying screenStreamRef.

  async function startScreenShare(screenStream: MediaStream) {
    screenStreamRef.current = screenStream;
    for (const pc of pcs.current.values()) {
      for (const track of screenStream.getTracks()) {
        const sender = pc.addTrack(track, screenStream);
        // Sharpen the share: keep text crisp (contentHint) and favor
        // resolution over framerate with a generous bitrate ceiling
        track.contentHint = "detail";
        const params = sender.getParameters();
        if (!params.degradationPreference) {
          params.degradationPreference = "maintain-resolution";
        }
        params.encodings ??= [{}];
        for (const encoding of params.encodings) {
          encoding.maxBitrate = 6_000_000; // 6 Mbps — sharp static content
          encoding.scaleResolutionDownBy = 1;
        }
        await sender.setParameters(params).catch(() => {
          // browser may not support tuning — defaults still work
        });
      }
    }
  }

  function stopScreenShare() {
    const screen = screenStreamRef.current;
    screenStreamRef.current = null;
    if (!screen) return;
    screen.getTracks().forEach((track) => track.stop());
    for (const pc of pcs.current.values()) {
      for (const sender of pc.getSenders()) {
        if (sender.track && screen.getTracks().includes(sender.track)) {
          try {
            pc.removeTrack(sender);
          } catch {
            // sender already replaced/closed — ignore
          }
        }
      }
    }
    // onnegotiationneeded fires for the removals
  }

  return {
    remoteStreams,
    remoteScreens,
    startScreenShare,
    stopScreenShare,
  };
}
