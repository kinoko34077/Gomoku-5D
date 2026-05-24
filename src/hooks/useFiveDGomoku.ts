import { useCallback, useEffect, useRef, useState } from 'react';
import { computeBestMove } from '../ai';
import { checkWin, createEmptyBoard, detectThreats, makeMove, type Threat } from '../gameLogic';
import type { Board, Coordinate, GameMode, GameSettings, Player, WinInfo } from '../types';

interface HistoryEntry {
  board: Board;
  activePlayer: Player;
  cursor: Coordinate;
  winInfo: WinInfo | null;
}

export interface PerformanceState {
  threatCalcMs: number;
  worstFrameMs: number;
  isLagging: boolean;
}

interface GameStateRef {
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

function getSliceIndexForAxis(axis: 'X' | 'Y' | 'Z' | 'none', [x, y, z]: Coordinate): number | null {
  if (axis === 'X') return x;
  if (axis === 'Y') return y;
  if (axis === 'Z') return z;
  return null;
}

function clampIndex(value: number, size: number): number {
  return Math.max(0, Math.min(size - 1, value));
}

export function useFiveDGomoku() {
  const [settings, setSettings] = useState<GameSettings>({
    boardSize: 6,
    maxPhases: 10,
    winLength: 5,
    streakWinLength: 5,
  });
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(settings.boardSize));
  const [activePlayer, setActivePlayer] = useState<Player>('white');
  const [cursor, setCursor] = useState<Coordinate>(() => {
    const half = Math.floor(settings.boardSize / 2);
    return [half, half, half];
  });
  const [winInfo, setWinInfo] = useState<WinInfo | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    threatCalcMs: 0,
    worstFrameMs: 0,
    isLagging: false,
  });
  const [sliceAxis, setSliceAxis] = useState<'X' | 'Y' | 'Z' | 'none'>('Z');
  const [sliceIndex, setSliceIndex] = useState(() => Math.floor(settings.boardSize / 2));
  const [showGridAssist, setShowGridAssist] = useState(true);
  const [threatDetectionEnabled, setThreatDetectionEnabled] = useState(true);
  const [threatDisplayEnabled, setThreatDisplayEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>(() => [
    {
      board: createEmptyBoard(settings.boardSize),
      activePlayer: 'white',
      cursor: [Math.floor(settings.boardSize / 2), Math.floor(settings.boardSize / 2), Math.floor(settings.boardSize / 2)],
      winInfo: null,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const stateRef = useRef<GameStateRef>({
    board,
    settings,
    activePlayer,
    cursor,
    winInfo,
    sliceAxis,
    sliceIndex,
    gameMode,
    isAiThinking,
    history,
    historyIndex,
  });

  useEffect(() => {
    stateRef.current = {
      board,
      settings,
      activePlayer,
      cursor,
      winInfo,
      sliceAxis,
      sliceIndex,
      gameMode,
      isAiThinking,
      history,
      historyIndex,
    };
  }, [board, settings, activePlayer, cursor, winInfo, sliceAxis, sliceIndex, gameMode, isAiThinking, history, historyIndex]);

  const syncCursor = useCallback((nextCursor: Coordinate) => {
    setCursor(nextCursor);
    const nextSliceIndex = getSliceIndexForAxis(stateRef.current.sliceAxis, nextCursor);
    if (nextSliceIndex !== null) {
      setSliceIndex(nextSliceIndex);
    }
  }, []);

  const syncSlice = useCallback((axis: 'X' | 'Y' | 'Z', index: number) => {
    setSliceAxis(axis);
    setSliceIndex(clampIndex(index, stateRef.current.settings.boardSize));
  }, []);

  const resetGameState = useCallback((size: number) => {
    const freshBoard = createEmptyBoard(size);
    const half = Math.floor(size / 2);
    const initialCursor: Coordinate = [half, half, half];

    setBoard(freshBoard);
    setActivePlayer('white');
    setCursor(initialCursor);
    setSliceIndex(half);
    setSliceAxis('Z');
    setWinInfo(null);
    setThreats([]);
    setIsAiThinking(false);

    const initialHistory: HistoryEntry = {
      board: freshBoard,
      activePlayer: 'white',
      cursor: initialCursor,
      winInfo: null,
    };
    setHistory([initialHistory]);
    setHistoryIndex(0);
  }, []);

  useEffect(() => {
    resetGameState(settings.boardSize);
  }, [settings.boardSize, resetGameState]);

  useEffect(() => {
    if (winInfo || !threatDetectionEnabled) {
      setThreats([]);
      setPerformanceState(prev => ({ ...prev, threatCalcMs: 0 }));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const detected = detectThreats(board, settings);
      const elapsed = performance.now() - start;
      if (cancelled) return;
      setThreats(detected);
      setPerformanceState(prev => ({
        threatCalcMs: elapsed,
        worstFrameMs: prev.worstFrameMs,
        isLagging: prev.worstFrameMs >= 120 || elapsed >= 80,
      }));
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [board, settings, activePlayer, winInfo, threatDetectionEnabled]);

  useEffect(() => {
    let frameId = 0;
    let previousTime = performance.now();
    let worstFrameMs = 0;

    const monitor = (now: number) => {
      const delta = now - previousTime;
      previousTime = now;
      worstFrameMs = Math.max(worstFrameMs, delta);
      frameId = window.requestAnimationFrame(monitor);
    };

    frameId = window.requestAnimationFrame(monitor);

    const reportTimer = window.setInterval(() => {
      setPerformanceState(prev => ({
        threatCalcMs: prev.threatCalcMs,
        worstFrameMs,
        isLagging: prev.threatCalcMs >= 80 || worstFrameMs >= 120,
      }));
      worstFrameMs = 0;
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(reportTimer);
    };
  }, []);

  const executeMove = useCallback((x: number, y: number, z: number, options?: { bypassThinkingGuard?: boolean }) => {
    const { board: currentBoard, activePlayer: player, winInfo: currentWin, isAiThinking: thinking, history: currentHistory, historyIndex: currentHistoryIndex } = stateRef.current;

    if (currentWin || (thinking && !options?.bypassThinkingGuard)) return;

    const nextBoard = makeMove(currentBoard, x, y, z, player);
    const nextWin = checkWin(nextBoard, settings, player);
    const nextPlayer: Player = player === 'white' ? 'black' : 'white';

    setBoard(nextBoard);
    setWinInfo(nextWin);
    if (!nextWin) {
      setActivePlayer(nextPlayer);
    }

    const newEntry: HistoryEntry = {
      board: nextBoard,
      activePlayer: nextPlayer,
      cursor: [x, y, z],
      winInfo: nextWin,
    };

    const newHistory = currentHistory.slice(0, currentHistoryIndex + 1).concat(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    syncCursor([x, y, z]);
  }, [settings, syncCursor]);

  useEffect(() => {
    const { gameMode: currentMode, activePlayer: player, winInfo: currentWin } = stateRef.current;
    if (currentWin) return;

    const isAiTurn =
      (currentMode === 'ai_white' && player === 'white') ||
      (currentMode === 'ai_black' && player === 'black');

    if (!isAiTurn) return;

    setIsAiThinking(true);
    const timer = window.setTimeout(() => {
      const { board: currentBoard, settings: currentSettings, activePlayer: currentPlayer } = stateRef.current;
      const [ax, ay, az] = computeBestMove(currentBoard, currentPlayer, currentSettings);
      setIsAiThinking(false);
      executeMove(ax, ay, az, { bypassThinkingGuard: true });
      syncCursor([ax, ay, az]);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activePlayer, gameMode, executeMove, syncCursor]);

  const handleUndo = useCallback(() => {
    const { historyIndex: currentHistoryIndex, history: currentHistory, gameMode: currentMode } = stateRef.current;
    if (currentHistoryIndex === 0) return;

    let targetIndex = currentHistoryIndex - 1;
    if (currentMode !== 'local') {
      targetIndex = currentHistoryIndex >= 2 ? currentHistoryIndex - 2 : 0;
    }

    const state = currentHistory[targetIndex];
    setBoard(state.board);
    setActivePlayer(state.activePlayer);
    syncCursor(state.cursor);
    setWinInfo(state.winInfo);
    setHistoryIndex(targetIndex);
  }, [syncCursor]);

  const handleRedo = useCallback(() => {
    const { historyIndex: currentHistoryIndex, history: currentHistory, gameMode: currentMode } = stateRef.current;
    if (currentHistoryIndex >= currentHistory.length - 1) return;

    let targetIndex = currentHistoryIndex + 1;
    if (currentMode !== 'local' && currentHistoryIndex + 2 < currentHistory.length) {
      targetIndex = currentHistoryIndex + 2;
    }

    const state = currentHistory[targetIndex];
    setBoard(state.board);
    setActivePlayer(state.activePlayer);
    syncCursor(state.cursor);
    setWinInfo(state.winInfo);
    setHistoryIndex(targetIndex);
  }, [syncCursor]);

  const handleReset = useCallback(() => {
    resetGameState(settings.boardSize);
  }, [resetGameState, settings.boardSize]);

  const moveCursor = useCallback((dx: number, dy: number, dz: number) => {
    const { cursor: currentCursor, settings: currentSettings } = stateRef.current;
    const [cx, cy, cz] = currentCursor;
    const size = currentSettings.boardSize;
    const nextCursor: Coordinate = [
      Math.max(0, Math.min(size - 1, cx + dx)),
      Math.max(0, Math.min(size - 1, cy + dy)),
      Math.max(0, Math.min(size - 1, cz + dz)),
    ];
    syncCursor(nextCursor);
  }, [syncCursor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          moveCursor(0, 1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          moveCursor(0, -1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          moveCursor(1, 0, 0);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          moveCursor(-1, 0, 0);
          break;
        case 'q':
        case 'Q':
          event.preventDefault();
          moveCursor(0, 0, 1);
          break;
        case 'e':
        case 'E':
          event.preventDefault();
          moveCursor(0, 0, -1);
          break;
        case ' ':
        case 'Enter': {
          event.preventDefault();
          const { cursor: currentCursor } = stateRef.current;
          executeMove(currentCursor[0], currentCursor[1], currentCursor[2]);
          break;
        }
        case 'g':
        case 'G':
          event.preventDefault();
          setShowGridAssist(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeMove, handleRedo, handleUndo, moveCursor]);

  return {
    settings,
    setSettings,
    gameMode,
    setGameMode,
    isAiThinking,
    board,
    activePlayer,
    cursor,
    syncCursor,
    winInfo,
    threats,
    performanceState,
    sliceAxis,
    setSliceAxis,
    sliceIndex,
    setSliceIndex,
    showGridAssist,
    setShowGridAssist,
    threatDetectionEnabled,
    setThreatDetectionEnabled,
    threatDisplayEnabled,
    setThreatDisplayEnabled,
    syncSlice,
    executeMove,
    handleUndo,
    handleRedo,
    handleReset,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
