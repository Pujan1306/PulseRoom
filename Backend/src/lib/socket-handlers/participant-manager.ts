import type { Participant, PublicParticipant, StoredChatMessage } from "./types.js";

// socket.id -> participant, so we always know who is in which room
const participants = new Map<string, Participant>();
const messages = new Map<string, StoredChatMessage[]>();

export function addParticipant(participant: Participant) {
    participants.set(participant.socketId, participant);
}

export function updateParticipant(participant: Participant) {
    participants.set(participant.socketId, participant);
}

export function removeParticipant(socketId: string): Participant | undefined {
    const participant = participants.get(socketId);
    if (participant) {
        participants.delete(socketId);
    }
    return participant;
}

export function getParticipant(socketId: string): Participant | undefined {
    return participants.get(socketId);
}

export function getParticipantsInRoom(roomCode: string): Participant[] {
    return [...participants.values()].filter((p) => p.roomCode === roomCode);
}

export function toPublicParticipant(participant: Participant): PublicParticipant {
    return {
        socketId: participant.socketId,
        name: participant.name,
        role: participant.role,
        micEnabled: participant.micEnabled,
        cameraEnabled: participant.cameraEnabled,
        joinTimestamp: participant.joinTimestamp,
    };
}

const MAX_MESSAGES_PER_ROOM = 200;

export function addMessage(roomCode: string, message: StoredChatMessage) {
    const roomMessages = messages.get(roomCode) || [];
    roomMessages.push(message);
    if (roomMessages.length > MAX_MESSAGES_PER_ROOM) {
        roomMessages.splice(0, roomMessages.length - MAX_MESSAGES_PER_ROOM);
    }
    messages.set(roomCode, roomMessages);
}

export function getMessages(roomCode: string): StoredChatMessage[] {
    return messages.get(roomCode) || [];
}

export function clearMessages(roomCode: string) {
    messages.delete(roomCode);
}

// Presenter state: which socket is currently sharing its screen in a room.
// Server-owned so late joiners can be told, and only the real presenter's
// stop actually clears it.
export interface Presenter {
    roomCode: string;
    socketId: string;
    name: string;
}

const presenters = new Map<string, Presenter>();

export function setPresenter(presenter: Presenter) {
    presenters.set(presenter.roomCode, presenter);
}

export function getPresenter(roomCode: string): Presenter | undefined {
    return presenters.get(roomCode);
}

// Clears the share only if the given socket is the one presenting
export function clearPresenterForSocket(socketId: string): Presenter | undefined {
    for (const presenter of presenters.values()) {
        if (presenter.socketId === socketId) {
            presenters.delete(presenter.roomCode);
            return presenter;
        }
    }
    return undefined;
}

// Host stream state: rooms where the host marked the stream as live (the
// LIVE badge). Tracked beside the presenter so late joiners see both.
const liveRooms = new Set<string>();

export function setRoomLive(roomCode: string, live: boolean) {
    if (live) {
        liveRooms.add(roomCode);
    } else {
        liveRooms.delete(roomCode);
    }
}

export function isRoomLive(roomCode: string): boolean {
    return liveRooms.has(roomCode);
}

export function clearLivenessForSocket(socketId: string): string | undefined {
    for (const presenter of presenters.values()) {
        if (presenter.socketId === socketId) {
            liveRooms.delete(presenter.roomCode);
            return presenter.roomCode;
        }
    }
    return undefined;
}
