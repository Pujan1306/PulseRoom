import type { Server as SocketIOServer, Socket } from "socket.io";
import type { JoinRoomData, Participant, RoomEventData } from "./types.js";
import {
    addParticipant,
    clearLivenessForSocket,
    clearMessages,
    clearPresenterForSocket,
    getParticipantsInRoom,
    getMessages,
    getPresenter,
    isRoomLive,
    removeParticipant,
    toPublicParticipant,
    updateParticipant,
} from "./participant-manager.js";

export function registerJoinRoomHandlers(io: SocketIOServer, socket: Socket) {
    socket.on("join-room", (data: JoinRoomData) => {
        if (!data?.roomCode || !data?.name) {
            console.warn("join-room ignored, invalid payload from: ", socket.id);
            return;
        }

        const existingParticipants = getParticipantsInRoom(data.roomCode);
        const existingHost = existingParticipants.find(p => p.role === "host");
        
        // Force audience role if there's already a host in the room
        const role = existingHost ? "audience" : data.role;

        const participant: Participant = {
            socketId: socket.id,
            roomCode: data.roomCode,
            name: data.name,
            role,
            micEnabled: data.micEnabled,
            cameraEnabled: data.cameraEnabled,
            joinTimestamp: Date.now(),
        };

        // Let the joiner discover everyone already in the room
        for (const existing of getParticipantsInRoom(data.roomCode)) {
            socket.emit("participant-joined", toPublicParticipant(existing));
        }

        // Send message history to the new joiner
        const messageHistory = getMessages(data.roomCode);
        if (messageHistory.length > 0) {
            socket.emit("message-history", messageHistory);
        }

        // Tell the joiner if someone is already presenting their screen
        const activePresenter = getPresenter(data.roomCode);
        if (activePresenter) {
            socket.emit("screen-share-started", {
                socketId: activePresenter.socketId,
                name: activePresenter.name,
            });
        }

        // Tell the joiner if the host's stream is already live
        if (isRoomLive(data.roomCode)) {
            socket.emit("host-started-stream", {
                socketId: activePresenter?.socketId ?? "",
                name: activePresenter?.name ?? "",
            });
        }

        addParticipant(participant);
        socket.join(data.roomCode);
        socket.to(data.roomCode).emit("participant-joined", toPublicParticipant(participant));
        console.log("User joined room: ", data.roomCode, "as", data.name, "role:", role);
    });

    socket.on("leave-room", (data: RoomEventData) => {
        if (!data?.roomCode) return;
        leaveRoom(io, socket);
    });

    socket.on("disconnect", () => {
        leaveRoom(io, socket);
        console.log("A user disconnected: ", socket.id);
    });
}

function leaveRoom(io: SocketIOServer, socket: Socket) {
    const participant = removeParticipant(socket.id);
    if (!participant) return;

    socket.leave(participant.roomCode);

    // A departing presenter can't announce their own stop — clear it here
    const endedShare = clearPresenterForSocket(socket.id);
    if (endedShare) {
        io.to(endedShare.roomCode).emit("screen-share-stopped", {
            socketId: endedShare.socketId,
            name: endedShare.name,
        });
        clearLivenessForSocket(socket.id);
        io.to(endedShare.roomCode).emit("host-ended-stream", {
            socketId: endedShare.socketId,
            name: endedShare.name,
        });
    }

    const remaining = getParticipantsInRoom(participant.roomCode);

    // When the host leaves — explicitly or by disconnecting — promote the
    // earliest-joined audience member so the room survives
    if (participant.role === "host" && remaining.length > 0) {
        let heir = remaining[0]!;
        for (const p of remaining) {
            if (p.joinTimestamp < heir.joinTimestamp) {
                heir = p;
            }
        }
        heir.role = "host";
        updateParticipant(heir);
        io.to(participant.roomCode).emit("host-promoted", toPublicParticipant(heir));
        console.log("Host left — promoted", heir.name, "to host in room:", participant.roomCode);
    }

    // Rooms are ephemeral: with everyone gone the chat history goes too
    if (remaining.length === 0) {
        clearMessages(participant.roomCode);
    }

    io.to(participant.roomCode).emit("participant-left", {
        socketId: participant.socketId,
        name: participant.name,
        role: participant.role,
    });
    console.log("User left room: ", participant.roomCode, "as", participant.name);
}
