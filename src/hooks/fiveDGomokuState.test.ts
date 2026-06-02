import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_SETTINGS } from '../types';
import {
  createInitialGameSnapshot,
  createInitialRemainingTime,
  getDisplayedRemainingTime,
  getRedoTargetIndex,
  getUndoTargetIndex,
} from './fiveDGomokuState';

describe('fiveDGomokuState helpers', () => {
  it('creates clocks from the configured time limit', () => {
    expect(createInitialRemainingTime({ ...DEFAULT_GAME_SETTINGS, timeLimitSeconds: 0 })).toEqual({
      white: null,
      black: null,
    });

    expect(createInitialRemainingTime({ ...DEFAULT_GAME_SETTINGS, timeLimitSeconds: 90 })).toEqual({
      white: 90_000,
      black: 90_000,
    });
  });

  it('derives displayed time from the active turn only', () => {
    expect(
      getDisplayedRemainingTime(
        { white: 20_000, black: 15_000 },
        'white',
        1_000,
        4_250,
      ),
    ).toEqual({
      white: 16_750,
      black: 15_000,
    });
  });

  it('clamps displayed time at zero and leaves untimed clocks untouched', () => {
    expect(
      getDisplayedRemainingTime(
        { white: 2_000, black: 5_000 },
        'white',
        0,
        4_500,
      ),
    ).toEqual({
      white: 0,
      black: 5_000,
    });

    expect(
      getDisplayedRemainingTime(
        { white: null, black: null },
        'black',
        0,
        3_000,
      ),
    ).toEqual({
      white: null,
      black: null,
    });
  });

  it('builds an initial snapshot with centered cursor and history', () => {
    const settings = {
      ...DEFAULT_GAME_SETTINGS,
      boardSize: 7,
      timeLimitSeconds: 120,
    };
    const snapshot = createInitialGameSnapshot(settings);

    expect(snapshot.cursor).toEqual([3, 3, 3]);
    expect(snapshot.sliceIndex).toBe(3);
    expect(snapshot.remainingTime).toEqual({
      white: 120_000,
      black: 120_000,
    });
    expect(snapshot.history).toHaveLength(1);
    expect(snapshot.history[0].activePlayer).toBe('white');
    expect(snapshot.history[0].cursor).toEqual([3, 3, 3]);
    expect(snapshot.history[0].remainingTime).toEqual({
      white: 120_000,
      black: 120_000,
    });
  });

  it('supports board size 15 snapshots', () => {
    const snapshot = createInitialGameSnapshot({
      ...DEFAULT_GAME_SETTINGS,
      boardSize: 15,
    });

    expect(snapshot.cursor).toEqual([7, 7, 7]);
    expect(snapshot.sliceIndex).toBe(7);
    expect(snapshot.board).toHaveLength(15);
    expect(snapshot.board[0]).toHaveLength(15);
    expect(snapshot.board[0][0]).toHaveLength(15);
  });

  it('computes undo and redo targets for local and AI games', () => {
    expect(getUndoTargetIndex(3, 'local')).toBe(2);
    expect(getUndoTargetIndex(3, 'ai_black')).toBe(1);
    expect(getUndoTargetIndex(1, 'ai_white')).toBe(0);

    expect(getRedoTargetIndex(1, 5, 'local')).toBe(2);
    expect(getRedoTargetIndex(1, 5, 'ai_black')).toBe(3);
    expect(getRedoTargetIndex(4, 5, 'ai_white')).toBe(4);
  });
});
