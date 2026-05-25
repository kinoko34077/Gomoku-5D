import { describe, expect, it } from 'vitest';
import { eventRequiresExpectedRevision, formatRoomCode, isSnapshotBearingServerEvent, isValidRoomCode, normalizeRoomCode } from './protocol';
import type { OnlineClientEvent, OnlineServerEvent } from './types';

describe('online protocol helpers', () => {
  it('normalizes room code input for manual entry', () => {
    expect(normalizeRoomCode(' abC-def ')).toBe('ABCDEF');
  });

  it('accepts only safe room code characters', () => {
    expect(isValidRoomCode('ABCDEF')).toBe(true);
    expect(isValidRoomCode('AB0DEF')).toBe(false);
    expect(isValidRoomCode('ABC-DE')).toBe(false);
    expect(isValidRoomCode('ABCDE')).toBe(false);
  });

  it('formats room code for display', () => {
    expect(formatRoomCode('ABCDEF')).toBe('ABC-DEF');
    expect(formatRoomCode('AB')).toBe('AB');
  });

  it('marks only move submission as revision consuming client event', () => {
    const moveEvent: OnlineClientEvent = {
      type: 'submit_move',
      roomCode: 'ABCDEF',
      expectedRevision: 3,
      coordinate: [1, 2, 3],
    };
    const joinEvent: OnlineClientEvent = {
      type: 'join_room',
      roomCode: 'ABCDEF',
      displayName: 'guest',
    };

    expect(eventRequiresExpectedRevision(moveEvent)).toBe(true);
    expect(eventRequiresExpectedRevision(joinEvent)).toBe(false);
  });

  it('detects server events that carry authoritative snapshots', () => {
    const snapshotEvent: OnlineServerEvent = {
      type: 'snapshot',
      snapshot: {} as never,
    };
    const invalidEvent: OnlineServerEvent = {
      type: 'invalid_action',
      reasonCode: 'move_rejected',
      message: 'rejected',
    };

    expect(isSnapshotBearingServerEvent(snapshotEvent)).toBe(true);
    expect(isSnapshotBearingServerEvent(invalidEvent)).toBe(false);
  });
});
