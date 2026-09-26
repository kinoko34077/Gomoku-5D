import type { Coordinate } from './types';

export interface GameplayKeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface GameplayShortcutTarget {
  tagName?: string;
  isContentEditable: boolean;
}

export type CursorMoveAction = {
  kind: 'move';
  dx: number;
  dy: number;
  dz: number;
};

export type GameplayKeyAction =
  | CursorMoveAction
  | { kind: 'place' }
  | { kind: 'undo' }
  | { kind: 'redo' };

export function shouldIgnoreGameplayShortcutTarget(target: GameplayShortcutTarget): boolean {
  if (target.isContentEditable) return true;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button' || tag === 'a';
}

export function getGameplayKeyAction(input: GameplayKeyInput): GameplayKeyAction | null {
  const key = input.key.toLowerCase();
  const primaryModifier = input.ctrlKey || input.metaKey;

  if (input.altKey) return null;

  if (primaryModifier) {
    if (!input.shiftKey && key === 'z') return { kind: 'undo' };
    if (!input.shiftKey && key === 'y') return { kind: 'redo' };
    return null;
  }

  switch (key) {
    case 'a':
    case 'arrowleft':
      return { kind: 'move', dx: -1, dy: 0, dz: 0 };
    case 'd':
    case 'arrowright':
      return { kind: 'move', dx: 1, dy: 0, dz: 0 };
    case 'w':
    case 'arrowup':
      return { kind: 'move', dx: 0, dy: -1, dz: 0 };
    case 's':
    case 'arrowdown':
      return { kind: 'move', dx: 0, dy: 1, dz: 0 };
    case 'q':
      return { kind: 'move', dx: 0, dy: 0, dz: -1 };
    case 'e':
      return { kind: 'move', dx: 0, dy: 0, dz: 1 };
    case 'enter':
    case ' ':
      return { kind: 'place' };
    default:
      return null;
  }
}

export function applyCursorMovement(
  cursor: Coordinate,
  action: CursorMoveAction,
  boardSize: number,
): Coordinate {
  const maxIndex = Math.max(0, boardSize - 1);
  const clamp = (value: number) => Math.max(0, Math.min(maxIndex, value));

  return [
    clamp(cursor[0] + action.dx),
    clamp(cursor[1] + action.dy),
    clamp(cursor[2] + action.dz),
  ];
}
