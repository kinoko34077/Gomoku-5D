export type Player = 'white' | 'black';

export const DEFAULT_GAME_SETTINGS = {
  boardSize: 6,
  maxPhases: 10,
  winLength: 5,
  streakWinLength: 5,
  undoRedoEnabled: true,
  timeLimitSeconds: 0,
  drawMoveLimit: 0,
} as const;

export interface CellState {
  phase: number; // 0 to 9
  lastPlayer: Player | null;
  streak: {
    white: number;
    black: number;
  };
}

export type Board = CellState[][][];

export type Coordinate = [number, number, number];

export type WinType = 'phase_same' | 'phase_seq' | 'streak';

export interface WinInfo {
  type: WinType;
  winner: Player;
  cells: Coordinate[];
  description: string;
}

export type GameMode = 'local' | 'ai_white' | 'ai_black'; // 'ai_white' means human is black, AI is white; 'ai_black' means human is white, AI is black.

export interface GameSettings {
  boardSize: number; // 5 to 8 (default 6)
  maxPhases: number; // 10
  winLength: number; // 5
  streakWinLength: number; // 5
  undoRedoEnabled: boolean;
  timeLimitSeconds: number; // 0 = no limit
  drawMoveLimit: number; // 0 = disabled
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeGameSettings(settings: GameSettings): GameSettings {
  const boardSize = clamp(Math.round(settings.boardSize), 5, 8);
  const maxPhases = clamp(Math.round(settings.maxPhases), 2, 10);
  const maxLineLength = Math.min(5, boardSize);
  const winLength = clamp(Math.round(settings.winLength), 3, maxLineLength);
  const streakWinLength = clamp(Math.round(settings.streakWinLength), 3, 9);
  const timeLimitSeconds = Math.max(0, Math.round(settings.timeLimitSeconds));
  const drawMoveLimit = Math.max(0, Math.round(settings.drawMoveLimit));

  return {
    boardSize,
    maxPhases,
    winLength,
    streakWinLength,
    undoRedoEnabled: settings.undoRedoEnabled,
    timeLimitSeconds,
    drawMoveLimit,
  };
}
