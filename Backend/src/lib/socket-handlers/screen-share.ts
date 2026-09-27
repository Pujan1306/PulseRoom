import type { Socket } from "socket.io";
import {
    clearPresenterForSocket,
    getParticipant,
    getPresenter,
    setPresenter,
} from "./participant-manager.js";

// Presenter state lives on the server: only the room's host may present,
// only the presenter may stop, late joiners are told on join-room, and a
// departing presenter's share is cleared automatically in leaveRoom.
// Payload roomCode from clients is ignored — the server knows each
// participant's room.
export function registerScreenShareHandlers(_io: unknown, socket: Socket) {
    socket.on("screen-share-started", () => {
        const participant = getParticipant(socket.id);
        if (!participant || participant.role !== "host") return;

        const activePresenter = getPresenter(participant.roomCode);
        if (activePresenter && activePresenter.socketId !== socket.id) return;

        setPresenter({
            roomCode: participant.roomCode,
            socketId: participant.socketId,
            name: participant.name,
        });
        socket.to(participant.roomCode).emit("screen-share-started", {
            socketId: participant.socketId,
            name: participant.name,
        });
        console.log("Screen share started in room:", participant.roomCode, "by", participant.name);
    });

    socket.on("screen-share-stopped", () => {
        const presenter = clearPresenterForSocket(socket.id);
        if (!presenter) return;
        socket.to(presenter.roomCode).emit("screen-share-stopped", {
            socketId: presenter.socketId,
            name: presenter.name,
        });
        console.log("Screen share stopped in room:", presenter.roomCode);
    });
}
