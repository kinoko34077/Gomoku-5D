import type { Board, Coordinate, GameSettings, Player, WinInfo } from '../types';

export const ONLINE_PROTOCOL_VERSION = 1 as const;
export const ROOM_CODE_LENGTH = 6 as const;
export const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' as const;

export type RoomCode = string;
export type RoomSeat = Player;
export type RoomRole = RoomSeat | 'spectator';
export type OnlineRoomStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'abandoned';
export type OnlineConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';
export type OnlineUndoPolicy = 'disabled' | 'mutual_consent';
export type RoomVisibility = 'private';

export interface RoomParticipantPresence {
  seat: RoomRole;
  displayName: string;
  connected: boolean;
  lastSeenAt: number;
}

export interface RoomParticipants {
  white: RoomParticipantPresence | null;
  black: RoomParticipantPresence | null;
  spectators: RoomParticipantPresence[];
}

export interface OnlineRoomOptions {
  visibility: RoomVisibility;
  allowSpectators: boolean;
  undoPolicy: OnlineUndoPolicy;
  reconnectGraceMs: number;
  idleRoomTtlMs: number;
}

export interface OnlineLastMove {
  coordinate: Coordinate;
  actor: Player;
  revision: number;
  committedAt: number;
}

export interface OnlineMatchSnapshot {
  protocolVersion: typeof ONLINE_PROTOCOL_VERSION;
  roomCode: RoomCode;
  status: OnlineRoomStatus;
  settings: GameSettings;
  board: Board;
  activePlayer: Player;
  revision: number;
  moveNumber: number;
  winInfo: WinInfo | null;
  participants: RoomParticipants;
  hostSeat: RoomSeat;
  lastMove: OnlineLastMove | null;
  createdAt: number;
  updatedAt: number;
}

export interface OnlineRoomSession {
  roomCode: RoomCode;
  seat: RoomRole;
  playerToken: string;
}

export interface CreateRoomEvent {
  type: 'create_room';
  displayName: string;
  preferredSeat?: RoomSeat;
  settings: GameSettings;
}

export interface JoinRoomEvent {
  type: 'join_room';
  roomCode: RoomCode;
  displayName: string;
}

export interface ReconnectRoomEvent {
  type: 'reconnect_room';
  roomCode: RoomCode;
  playerToken: string;
}

export interface LeaveRoomEvent {
  type: 'leave_room';
  roomCode: RoomCode;
}

export interface SubmitMoveEvent {
  type: 'submit_move';
  roomCode: RoomCode;
  expectedRevision: number;
  coordinate: Coordinate;
}

export interface SetReadyEvent {
  type: 'set_ready';
  roomCode: RoomCode;
  ready: boolean;
}

export interface RequestRematchEvent {
  type: 'request_rematch';
  roomCode: RoomCode;
}

export interface PingEvent {
  type: 'ping';
  roomCode?: RoomCode;
  clientTime: number;
}

export type OnlineClientEvent =
  | CreateRoomEvent
  | JoinRoomEvent
  | ReconnectRoomEvent
  | LeaveRoomEvent
  | SubmitMoveEvent
  | SetReadyEvent
  | RequestRematchEvent
  | PingEvent;

export interface RoomCreatedEvent {
  type: 'room_created';
  session: OnlineRoomSession;
  snapshot: OnlineMatchSnapshot;
}

export interface RoomJoinedEvent {
  type: 'room_joined';
  session: OnlineRoomSession;
  snapshot: OnlineMatchSnapshot;
}

export interface SnapshotEvent {
  type: 'snapshot';
  snapshot: OnlineMatchSnapshot;
}

export interface MoveCommittedEvent {
  type: 'move_committed';
  snapshot: OnlineMatchSnapshot;
  coordinate: Coordinate;
  actor: Player;
}

export interface ParticipantChangedEvent {
  type: 'participant_changed';
  participants: RoomParticipants;
  status: OnlineRoomStatus;
}

export interface InvalidActionEvent {
  type: 'invalid_action';
  roomCode?: RoomCode;
  reasonCode:
    | 'room_not_found'
    | 'seat_taken'
    | 'not_your_turn'
    | 'revision_mismatch'
    | 'move_rejected'
    | 'game_finished'
    | 'reconnect_expired';
  message: string;
  expectedRevision?: number;
}

export interface GameFinishedEvent {
  type: 'game_finished';
  snapshot: OnlineMatchSnapshot;
  winInfo: WinInfo;
}

export interface RoomClosedEvent {
  type: 'room_closed';
  roomCode: RoomCode;
  reason: 'idle_timeout' | 'host_closed' | 'server_shutdown';
}

export interface PongEvent {
  type: 'pong';
  clientTime: number;
  serverTime: number;
}

export type OnlineServerEvent =
  | RoomCreatedEvent
  | RoomJoinedEvent
  | SnapshotEvent
  | MoveCommittedEvent
  | ParticipantChangedEvent
  | InvalidActionEvent
  | GameFinishedEvent
  | RoomClosedEvent
  | PongEvent;
