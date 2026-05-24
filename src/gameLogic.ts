import type { Board, CellState, Coordinate, Player, WinInfo, GameSettings } from './types';

// Initialize a 3D board filled with empty cell states
export function createEmptyBoard(size: number): Board {
  const board: Board = [];
  for (let x = 0; x < size; x++) {
    const plane: CellState[][] = [];
    for (let y = 0; y < size; y++) {
      const row: CellState[] = [];
      for (let z = 0; z < size; z++) {
        row.push({
          phase: 0,
          lastPlayer: null,
          streak: {
            white: 0,
            black: 0,
          },
        });
      }
      plane.push(row);
    }
    board.push(plane);
  }
  return board;
}

// Perform a move and return the new board state
export function makeMove(
  board: Board,
  x: number,
  y: number,
  z: number,
  player: Player,
): Board {
  const newBoard: Board = board.map(plane =>
    plane.map(row =>
      row.map(cell => ({
        phase: cell.phase,
        lastPlayer: cell.lastPlayer,
        streak: { ...cell.streak },
      })),
    ),
  );

  const cell = newBoard[x][y][z];
  const prev = cell.lastPlayer;
  const isFirstPlacement = prev === null && cell.streak.white === 0 && cell.streak.black === 0;
  cell.phase = isFirstPlacement ? 0 : (cell.phase + 1) % 10;
  cell.lastPlayer = player;

  if (prev === player) {
    cell.streak[player] += 1;
  } else {
    const opponent: Player = player === 'white' ? 'black' : 'white';
    cell.streak[opponent] = 0;
    cell.streak[player] = 1;
  }

  return newBoard;
}

// Positive search directions (13 unique lines in 3D space)
export const DIRECTIONS: Coordinate[] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, -1, 0],
  [1, 0, 1],
  [1, 0, -1],
  [0, 1, 1],
  [0, 1, -1],
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
];

export function isOutOfBounds(x: number, y: number, z: number, size: number): boolean {
  return x < 0 || x >= size || y < 0 || y >= size || z < 0 || z >= size;
}

function isSequentialPhaseLine(phases: number[]): boolean {
  let isIncreasing = true;
  let isDecreasing = true;

  for (let i = 0; i < phases.length - 1; i++) {
    const diff = (phases[i + 1] - phases[i] + 10) % 10;
    if (diff !== 1) isIncreasing = false;
    if (diff !== 9) isDecreasing = false;
  }

  return isIncreasing || isDecreasing;
}

// Verify win conditions on the board
// Precedence: 1. Streak, 2. XYZ line + phase alignment
export function checkWin(
  board: Board,
  settings: GameSettings,
  activePlayer: Player,
): WinInfo | null {
  const size = board.length;
  const len = settings.winLength;
  const streakLen = settings.streakWinLength;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cell = board[x][y][z];
        if (cell.streak.white >= streakLen) {
          return {
            type: 'streak',
            winner: 'white',
            cells: [[x, y, z]],
            description: `White Streak Win (streak >= ${streakLen} at (${x}, ${y}, ${z}))`,
          };
        }
        if (cell.streak.black >= streakLen) {
          return {
            type: 'streak',
            winner: 'black',
            cells: [[x, y, z]],
            description: `Black Streak Win (streak >= ${streakLen} at (${x}, ${y}, ${z}))`,
          };
        }
      }
    }
  }

  const lineWins: WinInfo[] = [];

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        for (const [dx, dy, dz] of DIRECTIONS) {
          const endX = x + (len - 1) * dx;
          const endY = y + (len - 1) * dy;
          const endZ = z + (len - 1) * dz;
          if (isOutOfBounds(endX, endY, endZ, size)) continue;

          const lineCoords: Coordinate[] = [];
          const cells: CellState[] = [];

          for (let i = 0; i < len; i++) {
            const cx = x + i * dx;
            const cy = y + i * dy;
            const cz = z + i * dz;
            lineCoords.push([cx, cy, cz]);
            cells.push(board[cx][cy][cz]);
          }

          if (!cells.every(cell => cell.lastPlayer !== null)) continue;

          const firstPlayer = cells[0].lastPlayer;
          const sameOwner = firstPlayer !== null && cells.every(cell => cell.lastPlayer === firstPlayer);
          if (!sameOwner || firstPlayer === null) continue;

          const phases = cells.map(cell => cell.phase);
          const firstPhase = phases[0];

          if (phases.every(phase => phase === firstPhase)) {
            lineWins.push({
              type: 'phase_same',
              winner: firstPlayer,
              cells: lineCoords,
              description: `${firstPlayer.toUpperCase()} XYZ + Same Phase Win (Phase ${firstPhase} x ${len})`,
            });
          }

          if (isSequentialPhaseLine(phases)) {
            lineWins.push({
              type: 'phase_seq',
              winner: firstPlayer,
              cells: lineCoords,
              description: `${firstPlayer.toUpperCase()} XYZ + Sequential Phase Win (${phases.join(' -> ')})`,
            });
          }
        }
      }
    }
  }

  if (lineWins.length > 0) {
    const myWin = lineWins.find(win => win.winner === activePlayer);
    return myWin || lineWins[0];
  }

  return null;
}

export interface Threat {
  type: 'xyz_4' | 'phase_4' | 'streak_pressure';
  player?: Player;
  cells: Coordinate[];
  description: string;
}

function getNextPhaseForThreatCell(cell: CellState): number {
  const isFirstPlacement = cell.lastPlayer === null && cell.streak.white === 0 && cell.streak.black === 0;
  return isFirstPlacement ? 0 : (cell.phase + 1) % 10;
}

export function detectThreats(board: Board, settings: GameSettings): Threat[] {
  const size = board.length;
  const len = settings.winLength;
  const threats: Threat[] = [];
  const seenThreats = new Set<string>();

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cell = board[x][y][z];
        if (cell.streak.white >= 3) {
          threats.push({
            type: 'streak_pressure',
            player: 'white',
            cells: [[x, y, z]],
            description: `白の同位置コンボ警戒: ${cell.streak.white}連 (${x}, ${y}, ${z})`,
          });
        }
        if (cell.streak.black >= 3) {
          threats.push({
            type: 'streak_pressure',
            player: 'black',
            cells: [[x, y, z]],
            description: `黒の同位置コンボ警戒: ${cell.streak.black}連 (${x}, ${y}, ${z})`,
          });
        }
      }
    }
  }

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        for (const [dx, dy, dz] of DIRECTIONS) {
          const endX = x + (len - 1) * dx;
          const endY = y + (len - 1) * dy;
          const endZ = z + (len - 1) * dz;
          if (isOutOfBounds(endX, endY, endZ, size)) continue;

          const lineCoords: Coordinate[] = [];
          const cells: CellState[] = [];
          for (let i = 0; i < len; i++) {
            const coord: Coordinate = [x + i * dx, y + i * dy, z + i * dz];
            lineCoords.push(coord);
            cells.push(board[coord[0]][coord[1]][coord[2]]);
          }

          for (const player of ['white', 'black'] as const) {
            const ownedCount = cells.filter(cell => cell.lastPlayer === player).length;
            if (ownedCount !== len - 1) continue;

            const missingIndex = cells.findIndex(cell => cell.lastPlayer !== player);
            if (missingIndex === -1) continue;

            const phases = cells.map((cell, index) =>
              index === missingIndex ? getNextPhaseForThreatCell(cell) : cell.phase,
            );

            const allSamePhase = phases.every(phase => phase === phases[0]);
            const sequentialPhase = isSequentialPhaseLine(phases);
            if (!allSamePhase && !sequentialPhase) continue;

            const threatType = allSamePhase ? 'phase_4' : 'xyz_4';
            const key = `${threatType}:${player}:${lineCoords.map(coord => coord.join(',')).join('|')}`;
            if (seenThreats.has(key)) continue;

            seenThreats.add(key);
            threats.push({
              type: threatType,
              player,
              cells: lineCoords,
              description: allSamePhase
                ? `${player === 'white' ? '白' : '黒'}が1手で XYZ + 同位相5連`
                : `${player === 'white' ? '白' : '黒'}が1手で XYZ + 階段位相5連`,
            });
          }
        }
      }
    }
  }

  return threats;
}
