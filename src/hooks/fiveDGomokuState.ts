import { createEmptyBoard } from '../gameLogic';
import type { Board, Coordinate, GameMode, GameSettings, Player, PlayerClock, WinInfo } from '../types';

export interface HistoryEntry {
  board: Board;
  activePlayer: Player;
  cursor: Coordinate;
  winInfo: WinInfo | null;
  remainingTime: PlayerClock;
}

export interface GameStateRef {
  board: Board;
  settings: GameSettings;
  activePlayer: Player;
  cursor: Coordinate;
  winInfo: WinInfo | null;
  sliceAxis: 'X' | 'Y' | 'Z' | 'none';
  sliceIndex: number;
  gameMode: GameMode;
  isAiThinking: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  remainingTime: PlayerClock;
  turnStartedAt: number | null;
}

export function clampIndex(value: number, size: number): number {
  return Math.max(0, Math.min(size - 1, value));
}

export function getCenteredCursor(boardSize: number): Coordinate {
  const half = Math.floor(boardSize / 2);
  return [half, half, half];
}

export function getSliceIndexForAxis(axis: 'X' | 'Y' | 'Z' | 'none', [x, y, z]: Coordinate): number | null {
  if (axis === 'X') return x;
  if (axis === 'Y') return y;
  if (axis === 'Z') return z;
  return null;
}

export function createHistoryEntry(
  board: Board,
  activePlayer: Player,
  cursor: Coordinate,
  winInfo: WinInfo | null,
  remainingTime: PlayerClock,
): HistoryEntry {
  return {
    board,
    activePlayer,
    cursor,
    winInfo,
    remainingTime,
  };
}

export function createInitialRemainingTime(settings: Pick<GameSettings, 'timeLimitSeconds'>): PlayerClock {
  const initialMs = settings.timeLimitSeconds > 0
    ? settings.timeLimitSeconds * 1000
    : null;

  return {
    white: initialMs,
    black: initialMs,
  };
}

export function createInitialHistory(boardSize: number): HistoryEntry[] {
  const board = createEmptyBoard(boardSize);
  const cursor = getCenteredCursor(boardSize);
  const remainingTime = createInitialRemainingTime({ timeLimitSeconds: 0 });
  return [createHistoryEntry(board, 'white', cursor, null, remainingTime)];
}

export function createInitialGameSnapshot(settings: GameSettings) {
  const boardSize = settings.boardSize;
  const board = createEmptyBoard(boardSize);
  const cursor = getCenteredCursor(boardSize);
  const sliceIndex = Math.floor(boardSize / 2);
  const remainingTime = createInitialRemainingTime(settings);
  return {
    board,
    cursor,
    sliceIndex,
    remainingTime,
    history: [createHistoryEntry(board, 'white', cursor, null, remainingTime)],
  };
}

export function getUndoTargetIndex(historyIndex: number, gameMode: GameMode) {
  if (historyIndex === 0) return 0;
  if (gameMode === 'local') return historyIndex - 1;
  return historyIndex >= 2 ? historyIndex - 2 : 0;
}

export function getRedoTargetIndex(historyIndex: number, historyLength: number, gameMode: GameMode) {
  if (historyIndex >= historyLength - 1) return historyLength - 1;
  if (gameMode !== 'local' && historyIndex + 2 < historyLength) {
    return historyIndex + 2;
  }
  return historyIndex + 1;
}

export function cloneRemainingTime(remainingTime: PlayerClock): PlayerClock {
  return {
    white: remainingTime.white,
    black: remainingTime.black,
  };
}

export function getDisplayedRemainingTime(
  remainingTime: PlayerClock,
  activePlayer: Player,
  turnStartedAt: number | null,
  now: number,
): PlayerClock {
  if (turnStartedAt === null) {
    return cloneRemainingTime(remainingTime);
  }

  const activeClock = remainingTime[activePlayer];
  if (activeClock === null) {
    return cloneRemainingTime(remainingTime);
  }

  const elapsed = Math.max(0, now - turnStartedAt);
  return {
    ...remainingTime,
    [activePlayer]: Math.max(0, activeClock - elapsed),
  };
}
