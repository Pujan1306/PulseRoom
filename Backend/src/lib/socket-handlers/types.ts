import type { Server as SocketIOServer, Socket } from "socket.io";

export interface JoinRoomData {
    roomCode: string;
    name: string;
    role: "host" | "audience";
    micEnabled: boolean;
    cameraEnabled: boolean;
}

export interface RoomEventData {
    roomCode: string;
}

export interface ReactionData extends RoomEventData {
    type: string;
}

export interface ChatMessageData extends RoomEventData {
    message: string;
}

export interface MediaStateData extends RoomEventData {
    enabled: boolean;
}

export interface StoredChatMessage {
    socketId: string;
    name: string;
    message: string;
    timestamp: number;
}

export interface Participant {
    socketId: string;
    roomCode: string;
    name: string;
    role: "host" | "audience";
    micEnabled: boolean;
    cameraEnabled: boolean;
    joinTimestamp: number;
}

// What gets broadcast to clients — the roomCode stays server-side
export type PublicParticipant = Omit<Participant, "roomCode">;

export type HandlerRegistrar = (io: SocketIOServer, socket: Socket) => void;
