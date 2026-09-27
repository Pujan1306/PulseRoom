import type { Socket } from "socket.io";

interface SdpPayload {
    type: string;
    sdp: string;
}

interface WebRTCSignalTarget {
    targetSocketId: string;
}

interface WebRTCOfferData extends WebRTCSignalTarget {
    sdp: SdpPayload;
}

interface WebRTCAnswerData extends WebRTCSignalTarget {
    sdp: SdpPayload;
}

interface IceCandidateData extends WebRTCSignalTarget {
    candidate: {
        candidate: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
        usernameFragment?: string | null;
    };
}

export function registerWebRTCHandlers(_io: unknown, socket: Socket) {
    socket.on("webrtc-offer", (data: WebRTCOfferData) => {
        if (!data?.targetSocketId || !data.sdp) return;
        socket.to(data.targetSocketId).emit("webrtc-offer", {
            fromSocketId: socket.id,
            sdp: data.sdp,
        });
    });

    socket.on("webrtc-answer", (data: WebRTCAnswerData) => {
        if (!data?.targetSocketId || !data.sdp) return;
        socket.to(data.targetSocketId).emit("webrtc-answer", {
            fromSocketId: socket.id,
            sdp: data.sdp,
        });
    });

    socket.on("ice-candidate", (data: IceCandidateData) => {
        if (!data?.targetSocketId || !data.candidate) return;
        socket.to(data.targetSocketId).emit("ice-candidate", {
            fromSocketId: socket.id,
            candidate: data.candidate,
        });
    });
}
