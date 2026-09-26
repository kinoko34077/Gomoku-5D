import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_SETTINGS, normalizeGameSettings } from './types';

describe('normalizeGameSettings', () => {
  it('uses Model B as the default win model', () => {
    expect(DEFAULT_GAME_SETTINGS.lineWinModel).toBe('B');
  });

  it('allows board sizes up to 15 and preserves a valid win model', () => {
    expect(
      normalizeGameSettings({
        boardSize: 15,
        maxPhases: 10,
        winLength: 5,
        streakWinLength: 5,
        lineWinModel: 'A',
        undoRedoEnabled: true,
        timeLimitSeconds: 37,
        drawMoveLimit: 123,
      }),
    ).toMatchObject({
      boardSize: 15,
      lineWinModel: 'A',
      timeLimitSeconds: 37,
      drawMoveLimit: 123,
    });
  });

  it('clamps numeric values and falls back to Model B for an invalid runtime model', () => {
    expect(
      normalizeGameSettings({
        boardSize: 99,
        maxPhases: 20,
        winLength: 10,
        streakWinLength: 99,
        lineWinModel: 'invalid' as never,
        undoRedoEnabled: true,
        timeLimitSeconds: -2,
        drawMoveLimit: -7,
      }),
    ).toEqual({
      boardSize: 15,
      maxPhases: 10,
      winLength: 5,
      streakWinLength: 9,
      lineWinModel: 'B',
      undoRedoEnabled: true,
      timeLimitSeconds: 0,
      drawMoveLimit: 0,
    });
  });
});
