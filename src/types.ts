export type Player = 'white' | 'black';

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
}
