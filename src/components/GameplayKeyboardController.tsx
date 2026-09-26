import { useEffect } from 'react';
import type { Coordinate } from '../types';
import {
  applyCursorMovement,
  getGameplayKeyAction,
  shouldIgnoreGameplayShortcutTarget,
} from '../keyboardCommands';

interface GameplayKeyboardControllerProps {
  enabled: boolean;
  cursor: Coordinate;
  boardSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onCursorChange: (cursor: Coordinate) => void;
  onPlace: (x: number, y: number, z: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function shouldIgnoreTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return shouldIgnoreGameplayShortcutTarget({
    tagName: element.tagName,
    isContentEditable: element.isContentEditable,
  });
}

export function GameplayKeyboardController({
  enabled,
  cursor,
  boardSize,
  canUndo,
  canRedo,
  onCursorChange,
  onPlace,
  onUndo,
  onRedo,
}: GameplayKeyboardControllerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled || shouldIgnoreTarget(event.target)) return;

      const action = getGameplayKeyAction({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
      });
      if (!action) return;

      event.preventDefault();

      if (action.kind === 'move') {
        onCursorChange(applyCursorMovement(cursor, action, boardSize));
        return;
      }
      if (action.kind === 'place') {
        const [cx, cy, cz] = cursor;
        onPlace(cx, cy, cz);
        return;
      }
      if (action.kind === 'undo') {
        if (canUndo) onUndo();
        return;
      }
      if (canRedo) onRedo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardSize, canRedo, canUndo, cursor, enabled, onCursorChange, onPlace, onRedo, onUndo]);

  return null;
}
