import { describe, it, expect } from 'vitest';
import { createEmptyBoard, makeMove, checkWin } from './gameLogic';
import type { Board, GameSettings, Player } from './types';

function setCellState(
  board: Board,
  x: number,
  y: number,
  z: number,
  targetPhase: number,
  targetPlayer: Player,
): Board {
  let currentBoard = board;
  const currentCell = currentBoard[x][y][z];
  const movesNeeded = currentCell.lastPlayer === null
    ? targetPhase + 1
    : ((targetPhase - currentCell.phase + 10) % 10) || 10;
  const opponent: Player = targetPlayer === 'white' ? 'black' : 'white';
  const sequence: Player[] = [];

  for (let i = 0; i < movesNeeded; i++) {
    if ((movesNeeded - 1 - i) % 2 === 0) {
      sequence.push(targetPlayer);
    } else {
      sequence.push(opponent);
    }
  }

  for (const player of sequence) {
    currentBoard = makeMove(currentBoard, x, y, z, player);
  }

  return currentBoard;
}

describe('Phase Gomoku 5D Engine Tests', () => {
  const settings: GameSettings = {
    boardSize: 6,
    maxPhases: 10,
    winLength: 5,
    streakWinLength: 5,
  };

  it('should initialize board correctly', () => {
    const board = createEmptyBoard(settings.boardSize);
    expect(board.length).toBe(6);
    expect(board[0].length).toBe(6);
    expect(board[0][0].length).toBe(6);

    const cell = board[2][3][4];
    expect(cell.phase).toBe(0);
    expect(cell.lastPlayer).toBeNull();
    expect(cell.streak.white).toBe(0);
    expect(cell.streak.black).toBe(0);
  });

  it('should update cell state and streak on move', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = makeMove(board, 1, 1, 1, 'white');
    expect(board[1][1][1].phase).toBe(0);
    expect(board[1][1][1].lastPlayer).toBe('white');
    expect(board[1][1][1].streak.white).toBe(1);
    expect(board[1][1][1].streak.black).toBe(0);

    board = makeMove(board, 1, 1, 1, 'white');
    expect(board[1][1][1].phase).toBe(1);
    expect(board[1][1][1].lastPlayer).toBe('white');
    expect(board[1][1][1].streak.white).toBe(2);
    expect(board[1][1][1].streak.black).toBe(0);

    board = makeMove(board, 1, 1, 1, 'black');
    expect(board[1][1][1].phase).toBe(2);
    expect(board[1][1][1].lastPlayer).toBe('black');
    expect(board[1][1][1].streak.white).toBe(0);
    expect(board[1][1][1].streak.black).toBe(1);
  });

  it('should detect Streak Win (V-axis)', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = makeMove(board, 2, 2, 2, 'white');
    expect(checkWin(board, settings, 'white')).toBeNull();

    board = makeMove(board, 2, 2, 2, 'white');
    board = makeMove(board, 2, 2, 2, 'white');
    board = makeMove(board, 2, 2, 2, 'white');
    expect(checkWin(board, settings, 'white')).toBeNull();

    board = makeMove(board, 2, 2, 2, 'white');
    const win = checkWin(board, settings, 'white');

    expect(win).not.toBeNull();
    expect(win?.type).toBe('streak');
    expect(win?.winner).toBe('white');
    expect(win?.cells).toEqual([[2, 2, 2]]);
  });

  it('should not treat plain XYZ ownership as a win', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = setCellState(board, 0, 0, 0, 1, 'white');
    board = setCellState(board, 1, 0, 0, 3, 'white');
    board = setCellState(board, 2, 0, 0, 6, 'white');
    board = setCellState(board, 3, 0, 0, 2, 'white');
    board = setCellState(board, 4, 0, 0, 8, 'white');

    expect(checkWin(board, settings, 'white')).toBeNull();
  });

  it('should detect XYZ + Same Phase Win', () => {
    let board = createEmptyBoard(settings.boardSize);

    for (let x = 0; x < 5; x++) {
      board = setCellState(board, x, 1, 1, 4, 'white');
    }

    const win = checkWin(board, settings, 'white');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_same');
    expect(win?.winner).toBe('white');
    expect(win?.cells.length).toBe(5);
  });

  it('should detect XYZ + Sequential Phase Win', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = setCellState(board, 1, 0, 1, 8, 'black');
    board = setCellState(board, 1, 1, 1, 9, 'black');
    board = setCellState(board, 1, 2, 1, 0, 'black');
    board = setCellState(board, 1, 3, 1, 1, 'black');
    board = setCellState(board, 1, 4, 1, 2, 'black');

    const win = checkWin(board, settings, 'black');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_seq');
    expect(win?.winner).toBe('black');
  });

  it('should prioritize streak over line + phase wins', () => {
    let board = createEmptyBoard(settings.boardSize);

    for (let i = 0; i < 4; i++) {
      board = makeMove(board, 2, 2, 2, 'white');
    }

    board = setCellState(board, 0, 2, 2, 4, 'white');
    board = setCellState(board, 1, 2, 2, 4, 'white');
    board = setCellState(board, 3, 2, 2, 4, 'white');
    board = setCellState(board, 4, 2, 2, 4, 'white');

    board = makeMove(board, 2, 2, 2, 'white');

    const win = checkWin(board, settings, 'white');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('streak');
  });
});
