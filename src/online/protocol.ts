import type { OnlineClientEvent, OnlineServerEvent, RoomCode } from './types';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './types';

const ROOM_CODE_CHAR_SET = new Set(ROOM_CODE_ALPHABET.split(''));

export function normalizeRoomCode(rawValue: string): RoomCode {
  return rawValue
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

export function isValidRoomCode(roomCode: string): roomCode is RoomCode {
  if (roomCode.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  return roomCode.split('').every(char => ROOM_CODE_CHAR_SET.has(char));
}

export function formatRoomCode(roomCode: string): string {
  const normalized = normalizeRoomCode(roomCode);
  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function eventRequiresExpectedRevision(event: OnlineClientEvent): boolean {
  return event.type === 'submit_move';
}

export function isSnapshotBearingServerEvent(event: OnlineServerEvent): boolean {
  return (
    event.type === 'room_created'
    || event.type === 'room_joined'
    || event.type === 'snapshot'
    || event.type === 'move_committed'
    || event.type === 'game_finished'
  );
}
