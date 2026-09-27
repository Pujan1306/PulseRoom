import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import type { HandlerRegistrar } from "./socket-handlers/types.js";
import { registerJoinRoomHandlers } from "./socket-handlers/join-room.js";
import { registerReactionHandler } from "./socket-handlers/reaction.js";
import { registerChatHandlers } from "./socket-handlers/chat.js";
import { registerMediaStateHandlers } from "./socket-handlers/media-state.js";
import { registerScreenShareHandlers } from "./socket-handlers/screen-share.js";
import { registerStreamHandlers } from "./socket-handlers/stream.js";
import { registerWebRTCHandlers } from "./socket-handlers/webrtc.js";

const handlerRegistrars: HandlerRegistrar[] = [
    registerJoinRoomHandlers,
    registerReactionHandler,
    registerChatHandlers,
    registerMediaStateHandlers,
    registerScreenShareHandlers,
    registerStreamHandlers,
    registerWebRTCHandlers,
];

export function CreateServer(httpServer: HttpServer): SocketIOServer {
    try {
        console.log("Creating Socket.IO server...");
        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE"],
            },
        });
        console.log("Socket.IO server created successfully");

        io.on("connection", (socket) => {
            console.log("A user connected: ", socket.id);
            for (const register of handlerRegistrars) {
                register(io, socket);
            }
        });

        return io;
    } catch (error) {
        console.error("Failed to create Socket.IO server:", error);
        throw error;
    }
}
