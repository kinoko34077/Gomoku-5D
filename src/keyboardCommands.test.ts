import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  applyCursorMovement,
  getGameplayKeyAction,
  type GameplayKeyInput,
} from './keyboardCommands';

const key = (keyValue: string, extra: Partial<GameplayKeyInput> = {}): GameplayKeyInput => ({
  key: keyValue,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...extra,
});

describe('advertised gameplay keyboard commands', () => {
  it('maps WASD and arrow keys to XY movement', () => {
    expect(getGameplayKeyAction(key('a'))).toEqual({ kind: 'move', dx: -1, dy: 0, dz: 0 });
    expect(getGameplayKeyAction(key('ArrowLeft'))).toEqual({ kind: 'move', dx: -1, dy: 0, dz: 0 });
    expect(getGameplayKeyAction(key('d'))).toEqual({ kind: 'move', dx: 1, dy: 0, dz: 0 });
    expect(getGameplayKeyAction(key('ArrowRight'))).toEqual({ kind: 'move', dx: 1, dy: 0, dz: 0 });
    expect(getGameplayKeyAction(key('w'))).toEqual({ kind: 'move', dx: 0, dy: -1, dz: 0 });
    expect(getGameplayKeyAction(key('ArrowUp'))).toEqual({ kind: 'move', dx: 0, dy: -1, dz: 0 });
    expect(getGameplayKeyAction(key('s'))).toEqual({ kind: 'move', dx: 0, dy: 1, dz: 0 });
    expect(getGameplayKeyAction(key('ArrowDown'))).toEqual({ kind: 'move', dx: 0, dy: 1, dz: 0 });
  });

  it('maps Q/E, place, Undo and Redo including Cmd on macOS', () => {
    expect(getGameplayKeyAction(key('q'))).toEqual({ kind: 'move', dx: 0, dy: 0, dz: -1 });
    expect(getGameplayKeyAction(key('e'))).toEqual({ kind: 'move', dx: 0, dy: 0, dz: 1 });
    expect(getGameplayKeyAction(key('Enter'))).toEqual({ kind: 'place' });
    expect(getGameplayKeyAction(key(' '))).toEqual({ kind: 'place' });
    expect(getGameplayKeyAction(key('z', { ctrlKey: true }))).toEqual({ kind: 'undo' });
    expect(getGameplayKeyAction(key('z', { metaKey: true }))).toEqual({ kind: 'undo' });
    expect(getGameplayKeyAction(key('y', { ctrlKey: true }))).toEqual({ kind: 'redo' });
    expect(getGameplayKeyAction(key('y', { metaKey: true }))).toEqual({ kind: 'redo' });
  });

  it('clamps cursor movement to board bounds', () => {
    expect(applyCursorMovement([0, 0, 0], { kind: 'move', dx: -1, dy: -1, dz: -1 }, 5)).toEqual([0, 0, 0]);
    expect(applyCursorMovement([4, 4, 4], { kind: 'move', dx: 1, dy: 1, dz: 1 }, 5)).toEqual([4, 4, 4]);
    expect(applyCursorMovement([2, 2, 2], { kind: 'move', dx: 1, dy: -1, dz: 1 }, 5)).toEqual([3, 1, 3]);
  });

  it('does not claim unrelated or modified gameplay keys', () => {
    expect(getGameplayKeyAction(key('x'))).toBeNull();
    expect(getGameplayKeyAction(key('a', { ctrlKey: true }))).toBeNull();
    expect(getGameplayKeyAction(key('q', { altKey: true }))).toBeNull();
  });

  it('routes consumed gameplay commands through one bounded controller and existing App actions', () => {
    const controllerPath = fileURLToPath(new URL('./components/GameplayKeyboardController.tsx', import.meta.url));
    const appPath = fileURLToPath(new URL('./App.tsx', import.meta.url));
    const controller = readFileSync(controllerPath, 'utf8');
    const app = readFileSync(appPath, 'utf8');

    expect(controller).toContain('getGameplayKeyAction');
    expect(controller).toContain('applyCursorMovement');
    expect(controller).toContain('isEditableTarget(event.target)');
    expect(controller).toContain('if (!action) return');
    expect(controller).toContain('event.preventDefault()');
    expect(controller).toContain('onPlace(cx, cy, cz)');
    expect(controller).toContain('if (canUndo) onUndo()');
    expect(controller).toContain('if (canRedo) onRedo()');

    expect(app).toContain('<GameplayKeyboardController');
    expect(app).toContain('enabled={hasStartedSession && !isGuideOpen && !winInfo}');
    expect(app).toContain('onCursorChange={syncCursor}');
    expect(app).toContain('onPlace={executeMove}');
    expect(app).toContain('onUndo={handleUndo}');
    expect(app).toContain('onRedo={handleRedo}');
  });
});
