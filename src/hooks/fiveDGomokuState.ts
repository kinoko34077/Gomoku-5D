import { createEmptyBoard } from '../gameLogic';
import type { Board, Coordinate, GameMode, GameSettings, Player, WinInfo } from '../types';

export interface HistoryEntry {
  board: Board;
  activePlayer: Player;
  cursor: Coordinate;
  winInfo: WinInfo | null;
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
): HistoryEntry {
  return {
    board,
    activePlayer,
    cursor,
    winInfo,
  };
}

export function createInitialHistory(boardSize: number): HistoryEntry[] {
  const board = createEmptyBoard(boardSize);
  const cursor = getCenteredCursor(boardSize);
  return [createHistoryEntry(board, 'white', cursor, null)];
}

export function createInitialGameSnapshot(boardSize: number) {
  const board = createEmptyBoard(boardSize);
  const cursor = getCenteredCursor(boardSize);
  const sliceIndex = Math.floor(boardSize / 2);
  return {
    board,
    cursor,
    sliceIndex,
    history: [createHistoryEntry(board, 'white', cursor, null)],
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
