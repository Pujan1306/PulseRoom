import type { Socket } from "socket.io";
import type { ReactionData } from "./types.js";
import { getParticipant } from "./participant-manager.js";

export function registerReactionHandler(_io: unknown, socket: Socket) {
    socket.on("reaction", (data: ReactionData) => {
        if (!data?.roomCode || !data?.type) return;
        const participant = getParticipant(socket.id);
        socket.to(data.roomCode).emit("reaction", {
            socketId: socket.id,
            name: participant?.name ?? "Unknown",
            type: data.type,
        });
        console.log("User reacted: ", data.type);
    });
}
