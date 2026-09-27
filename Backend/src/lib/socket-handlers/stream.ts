import type { Socket } from "socket.io";
import { getParticipant, setRoomLive } from "./participant-manager.js";

// Stream state is server-owned: only the room's host may toggle it, and
// late joiners are told on join-room. Payload roomCode from clients is
// ignored — the server knows each participant's room.
export function registerStreamHandlers(_io: unknown, socket: Socket) {
    socket.on("host-started-stream", () => {
        const participant = getParticipant(socket.id);
        if (!participant || participant.role !== "host") return;

        setRoomLive(participant.roomCode, true);
        socket.to(participant.roomCode).emit("host-started-stream", {
            socketId: participant.socketId,
            name: participant.name,
        });
        console.log("Host started stream in room:", participant.roomCode);
    });

    socket.on("host-ended-stream", () => {
        const participant = getParticipant(socket.id);
        if (!participant || participant.role !== "host") return;

        setRoomLive(participant.roomCode, false);
        socket.to(participant.roomCode).emit("host-ended-stream", {
            socketId: participant.socketId,
            name: participant.name,
        });
        console.log("Host ended stream in room:", participant.roomCode);
    });
}
