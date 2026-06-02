import { describe, expect, it } from 'vitest';
import { normalizeGameSettings } from './types';

describe('normalizeGameSettings', () => {
  it('allows board sizes up to 15 and integer time settings', () => {
    expect(
      normalizeGameSettings({
        boardSize: 15,
        maxPhases: 10,
        winLength: 5,
        streakWinLength: 5,
        undoRedoEnabled: true,
        timeLimitSeconds: 37,
        drawMoveLimit: 123,
      }),
    ).toMatchObject({
      boardSize: 15,
      timeLimitSeconds: 37,
      drawMoveLimit: 123,
    });
  });

  it('clamps oversized and undersized values safely', () => {
    expect(
      normalizeGameSettings({
        boardSize: 99,
        maxPhases: 20,
        winLength: 10,
        streakWinLength: 99,
        undoRedoEnabled: true,
        timeLimitSeconds: -2,
        drawMoveLimit: -7,
      }),
    ).toEqual({
      boardSize: 15,
      maxPhases: 10,
      winLength: 5,
      streakWinLength: 9,
      undoRedoEnabled: true,
      timeLimitSeconds: 0,
      drawMoveLimit: 0,
    });
  });
});
