import type { Socket } from "socket.io";
import type { MediaStateData } from "./types.js";
import { getParticipant } from "./participant-manager.js";

export function registerMediaStateHandlers(_io: unknown, socket: Socket) {
    socket.on("mic-state-changed", (data: MediaStateData) => {
        if (!data?.roomCode || typeof data.enabled !== "boolean") return;
        const participant = getParticipant(socket.id);
        if (!participant) return;
        participant.micEnabled = data.enabled;
        socket.to(data.roomCode).emit("mic-state-changed", {
            socketId: socket.id,
            name: participant.name,
            enabled: data.enabled,
        });
    });

    socket.on("camera-state-changed", (data: MediaStateData) => {
        if (!data?.roomCode || typeof data.enabled !== "boolean") return;
        const participant = getParticipant(socket.id);
        if (!participant) return;
        participant.cameraEnabled = data.enabled;
        socket.to(data.roomCode).emit("camera-state-changed", {
            socketId: socket.id,
            name: participant.name,
            enabled: data.enabled,
        });
    });
}
