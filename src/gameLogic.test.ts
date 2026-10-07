import { describe, it, expect } from 'vitest';
import { createEmptyBoard, makeMove, checkWin } from './gameLogic';
import { DEFAULT_GAME_SETTINGS, type Board, type GameSettings, type Player } from './types';

const TEST_SETTINGS: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
};

function settingsFor(lineWinModel: 'A' | 'B'): GameSettings {
  return {
    ...TEST_SETTINGS,
    lineWinModel,
  } as GameSettings;
}

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
    : ((targetPhase - currentCell.phase + TEST_SETTINGS.maxPhases) % TEST_SETTINGS.maxPhases) || TEST_SETTINGS.maxPhases;
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
    currentBoard = makeMove(currentBoard, x, y, z, player, TEST_SETTINGS.maxPhases);
  }

  return currentBoard;
}

describe('Phase Gomoku 5D Engine Tests', () => {
  const settings: GameSettings = {
    ...TEST_SETTINGS,
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

    board = makeMove(board, 1, 1, 1, 'white', settings.maxPhases);
    expect(board[1][1][1].phase).toBe(0);
    expect(board[1][1][1].lastPlayer).toBe('white');
    expect(board[1][1][1].streak.white).toBe(1);
    expect(board[1][1][1].streak.black).toBe(0);

    board = makeMove(board, 1, 1, 1, 'white', settings.maxPhases);
    expect(board[1][1][1].phase).toBe(1);
    expect(board[1][1][1].lastPlayer).toBe('white');
    expect(board[1][1][1].streak.white).toBe(2);
    expect(board[1][1][1].streak.black).toBe(0);

    board = makeMove(board, 1, 1, 1, 'black', settings.maxPhases);
    expect(board[1][1][1].phase).toBe(2);
    expect(board[1][1][1].lastPlayer).toBe('black');
    expect(board[1][1][1].streak.white).toBe(0);
    expect(board[1][1][1].streak.black).toBe(1);
  });

  it('should start the first occupied phase at 0 and wrap through 0..9', () => {
    let board = createEmptyBoard(settings.boardSize);
    const observedPhases: number[] = [];

    for (let i = 0; i < settings.maxPhases + 1; i++) {
      board = makeMove(board, 1, 1, 1, 'white', settings.maxPhases);
      observedPhases.push(board[1][1][1].phase);
    }

    expect(observedPhases).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });

  it('should detect Streak Win (V-axis)', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
    expect(checkWin(board, settings, 'white')).toBeNull();

    board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
    board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
    board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
    expect(checkWin(board, settings, 'white')).toBeNull();

    board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
    const win = checkWin(board, settings, 'white');

    expect(win).not.toBeNull();
    expect(win?.type).toBe('streak');
    expect(win?.winner).toBe('white');
    expect(win?.cells).toEqual([[2, 2, 2]]);
  });

  it('Model B should not treat plain XYZ ownership as a win', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = setCellState(board, 0, 0, 0, 1, 'white');
    board = setCellState(board, 1, 0, 0, 3, 'white');
    board = setCellState(board, 2, 0, 0, 6, 'white');
    board = setCellState(board, 3, 0, 0, 2, 'white');
    board = setCellState(board, 4, 0, 0, 8, 'white');

    expect(checkWin(board, settingsFor('B'), 'white')).toBeNull();
  });

  it('Model A should treat plain same-owner XYZ ownership as a win', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = setCellState(board, 0, 0, 0, 1, 'white');
    board = setCellState(board, 1, 0, 0, 3, 'white');
    board = setCellState(board, 2, 0, 0, 6, 'white');
    board = setCellState(board, 3, 0, 0, 2, 'white');
    board = setCellState(board, 4, 0, 0, 8, 'white');

    const win = checkWin(board, settingsFor('A'), 'white');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('xyz');
    expect(win?.winner).toBe('white');
  });

  it('should detect XYZ + Same Phase Win in Model B', () => {
    let board = createEmptyBoard(settings.boardSize);

    for (let x = 0; x < 5; x++) {
      board = setCellState(board, x, 1, 1, 4, 'white');
    }

    const win = checkWin(board, settingsFor('B'), 'white');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_same');
    expect(win?.winner).toBe('white');
    expect(win?.cells.length).toBe(5);
  });

  it('should detect XYZ + Sequential Phase Win in Model B', () => {
    let board = createEmptyBoard(settings.boardSize);

    board = setCellState(board, 1, 0, 1, 8, 'black');
    board = setCellState(board, 1, 1, 1, 9, 'black');
    board = setCellState(board, 1, 2, 1, 0, 'black');
    board = setCellState(board, 1, 3, 1, 1, 'black');
    board = setCellState(board, 1, 4, 1, 2, 'black');

    const win = checkWin(board, settingsFor('B'), 'black');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_seq');
    expect(win?.winner).toBe('black');
  });

  it('Model A should award a mixed-owner same-phase completion to the active player', () => {
    let board = createEmptyBoard(settings.boardSize);
    const owners: Player[] = ['white', 'black', 'white', 'black', 'white'];

    for (let x = 0; x < 5; x++) {
      board = setCellState(board, x, 3, 1, 4, owners[x]);
    }

    const win = checkWin(board, settingsFor('A'), 'black');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_same');
    expect(win?.winner).toBe('black');
  });

  it('Model A should award a mixed-owner cyclic phase sequence to the active player', () => {
    let board = createEmptyBoard(settings.boardSize);
    const phases = [8, 9, 0, 1, 2];
    const owners: Player[] = ['black', 'white', 'black', 'white', 'black'];

    for (let y = 0; y < 5; y++) {
      board = setCellState(board, 1, y, 3, phases[y], owners[y]);
    }

    const win = checkWin(board, settingsFor('A'), 'white');
    expect(win).not.toBeNull();
    expect(win?.type).toBe('phase_seq');
    expect(win?.winner).toBe('white');
  });

  it('Model B should reject a mixed-owner phase line', () => {
    let board = createEmptyBoard(settings.boardSize);
    const owners: Player[] = ['white', 'black', 'white', 'black', 'white'];

    for (let x = 0; x < 5; x++) {
      board = setCellState(board, x, 3, 1, 4, owners[x]);
    }

    expect(checkWin(board, settingsFor('B'), 'black')).toBeNull();
  });

  for (const lineWinModel of ['A', 'B'] as const) {
    it(`should prioritize streak over line wins in Model ${lineWinModel}`, () => {
      let board = createEmptyBoard(settings.boardSize);

      for (let i = 0; i < 4; i++) {
        board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);
      }

      board = setCellState(board, 0, 2, 2, 4, 'white');
      board = setCellState(board, 1, 2, 2, 4, 'white');
      board = setCellState(board, 3, 2, 2, 4, 'white');
      board = setCellState(board, 4, 2, 2, 4, 'white');

      board = makeMove(board, 2, 2, 2, 'white', settings.maxPhases);

      const win = checkWin(board, settingsFor(lineWinModel), 'white');
      expect(win).not.toBeNull();
      expect(win?.type).toBe('streak');
    });
  }
});
