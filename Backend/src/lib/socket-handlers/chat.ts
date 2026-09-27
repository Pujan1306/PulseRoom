import type { Socket } from "socket.io";
import type { ChatMessageData } from "./types.js";
import { getParticipant, addMessage } from "./participant-manager.js";

export function registerChatHandlers(_io: unknown, socket: Socket) {
    socket.on("chat-message", (data: ChatMessageData) => {
        if (!data?.roomCode || !data.message?.trim()) return;
        const participant = getParticipant(socket.id);
        
        const messageData = {
            socketId: socket.id,
            name: participant?.name ?? "Unknown",
            message: data.message,
            timestamp: Date.now(),
        };
        
        // Store message in memory
        addMessage(data.roomCode, messageData);
        
        // Broadcast to others in the room
        socket.to(data.roomCode).emit("chat-message", messageData);
    });
}
