import { useCallback, useEffect, useRef, useState } from 'react';
import { computeBestMove } from '../ai';
import { checkWin, makeMove, type Threat } from '../gameLogic';
import { DEFAULT_GAME_SETTINGS, type Board, type Coordinate, type GameMode, type GameSettings, type Player, type PlayerClock, type WinInfo } from '../types';
import {
  clampIndex,
  cloneRemainingTime,
  createHistoryEntry,
  createInitialRemainingTime,
  createInitialGameSnapshot,
  getDisplayedRemainingTime,
  getCenteredCursor,
  getRedoTargetIndex,
  getSliceIndexForAxis,
  getUndoTargetIndex,
  type GameStateRef,
  type HistoryEntry,
} from './fiveDGomokuState';
import { useFrameLagMonitor, useThreatDetector } from './useBoardPerformance';

export interface PerformanceState {
  threatCalcMs: number;
  worstFrameMs: number;
  isLagging: boolean;
}

export function useFiveDGomoku() {
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS });
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [board, setBoard] = useState<Board>(() => createInitialGameSnapshot(DEFAULT_GAME_SETTINGS).board);
  const [activePlayer, setActivePlayer] = useState<Player>('white');
  const [cursor, setCursor] = useState<Coordinate>(() => getCenteredCursor(settings.boardSize));
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
  const [threatsEnabled, setThreatsEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>(() => createInitialGameSnapshot(DEFAULT_GAME_SETTINGS).history);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<PlayerClock>(() => createInitialRemainingTime(DEFAULT_GAME_SETTINGS));
  const [clockNow, setClockNow] = useState(() => Date.now());
  const turnStartedAtRef = useRef<number | null>(null);

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
    remainingTime,
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
      remainingTime,
    };
  }, [board, settings, activePlayer, cursor, winInfo, sliceAxis, sliceIndex, gameMode, isAiThinking, history, historyIndex, remainingTime]);

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

  const resetGameState = useCallback((size: number, nextSettings?: GameSettings) => {
    const resolvedSettings = nextSettings ?? {
      ...stateRef.current.settings,
      boardSize: size,
    };
    const initialState = createInitialGameSnapshot(resolvedSettings);
    const freshBoard = initialState.board;
    const initialCursor = initialState.cursor;

    setBoard(freshBoard);
    setActivePlayer('white');
    setCursor(initialCursor);
    setSliceIndex(initialState.sliceIndex);
    setSliceAxis('Z');
    setWinInfo(null);
    setThreats([]);
    setIsAiThinking(false);
    setHistory(initialState.history);
    setHistoryIndex(0);
    setRemainingTime(initialState.remainingTime);
    turnStartedAtRef.current = resolvedSettings.timeLimitSeconds > 0 ? Date.now() : null;
    setClockNow(Date.now());
  }, []);

  useEffect(() => {
    resetGameState(settings.boardSize);
  }, [settings.boardSize, resetGameState]);

  useEffect(() => {
    if (settings.timeLimitSeconds <= 0 || winInfo) {
      turnStartedAtRef.current = null;
      return;
    }

    turnStartedAtRef.current = Date.now();
    setClockNow(Date.now());

    const timer = window.setInterval(() => {
      const snapshot = getDisplayedRemainingTime(
        stateRef.current.remainingTime,
        stateRef.current.activePlayer,
        turnStartedAtRef.current,
        Date.now(),
      );
      const activeClock = snapshot[stateRef.current.activePlayer];

      if (activeClock !== null && activeClock <= 0) {
        const timeoutWinner: Player = stateRef.current.activePlayer === 'white' ? 'black' : 'white';
        setRemainingTime(snapshot);
        setWinInfo({
          type: 'timeout',
          winner: timeoutWinner,
          cells: [],
          description: `${stateRef.current.activePlayer === 'white' ? '白' : '黒'}の持ち時間がなくなりました。${timeoutWinner === 'white' ? '白' : '黒'}の時間切れ勝ちです。`,
        });
        turnStartedAtRef.current = null;
      }

      setClockNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, [activePlayer, settings.timeLimitSeconds, winInfo]);

  useThreatDetector({
    board,
    settings,
    activePlayer,
    winInfo,
    threatsEnabled,
    setThreats,
    setPerformanceState,
  });

  useFrameLagMonitor(setPerformanceState);

  const commitActiveClock = useCallback((player: Player) => {
    const snapshot = getDisplayedRemainingTime(
      stateRef.current.remainingTime,
      player,
      turnStartedAtRef.current,
      Date.now(),
    );
    setRemainingTime(snapshot);
    return snapshot;
  }, []);

  const executeMove = useCallback((x: number, y: number, z: number, options?: { bypassThinkingGuard?: boolean }) => {
    const { board: currentBoard, activePlayer: player, winInfo: currentWin, isAiThinking: thinking, history: currentHistory, historyIndex: currentHistoryIndex } = stateRef.current;

    if (currentWin || (thinking && !options?.bypassThinkingGuard)) return;

    const nextRemainingTime = commitActiveClock(player);
    const nextBoard = makeMove(currentBoard, x, y, z, player, settings.maxPhases);
    const moveNumber = currentHistoryIndex + 1;
    let nextWin = checkWin(nextBoard, settings, player);
    const nextPlayer: Player = player === 'white' ? 'black' : 'white';

    if (!nextWin && settings.drawMoveLimit > 0 && moveNumber >= settings.drawMoveLimit) {
      nextWin = {
        type: 'draw',
        winner: null,
        cells: [],
        description: `${moveNumber} 手に達したため引き分けです。`,
      };
    }

    setBoard(nextBoard);
    setWinInfo(nextWin);
    if (!nextWin) {
      setActivePlayer(nextPlayer);
    }

    const newEntry = createHistoryEntry(
      nextBoard,
      nextWin ? player : nextPlayer,
      [x, y, z],
      nextWin,
      cloneRemainingTime(nextRemainingTime),
    );

    const newHistory = currentHistory.slice(0, currentHistoryIndex + 1).concat(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    syncCursor([x, y, z]);
  }, [commitActiveClock, settings, syncCursor]);

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
    const { historyIndex: currentHistoryIndex, history: currentHistory, gameMode: currentMode, settings: currentSettings } = stateRef.current;
    if (!currentSettings.undoRedoEnabled) return;
    if (currentHistoryIndex === 0) return;

    const targetIndex = getUndoTargetIndex(currentHistoryIndex, currentMode);

    const state = currentHistory[targetIndex];
    setBoard(state.board);
    setActivePlayer(state.activePlayer);
    syncCursor(state.cursor);
    setWinInfo(state.winInfo);
    setHistoryIndex(targetIndex);
    setRemainingTime(cloneRemainingTime(state.remainingTime));
    turnStartedAtRef.current = currentSettings.timeLimitSeconds > 0 && !state.winInfo ? Date.now() : null;
    setClockNow(Date.now());
  }, [syncCursor]);

  const handleRedo = useCallback(() => {
    const { historyIndex: currentHistoryIndex, history: currentHistory, gameMode: currentMode, settings: currentSettings } = stateRef.current;
    if (!currentSettings.undoRedoEnabled) return;
    if (currentHistoryIndex >= currentHistory.length - 1) return;

    const targetIndex = getRedoTargetIndex(currentHistoryIndex, currentHistory.length, currentMode);

    const state = currentHistory[targetIndex];
    setBoard(state.board);
    setActivePlayer(state.activePlayer);
    syncCursor(state.cursor);
    setWinInfo(state.winInfo);
    setHistoryIndex(targetIndex);
    setRemainingTime(cloneRemainingTime(state.remainingTime));
    turnStartedAtRef.current = currentSettings.timeLimitSeconds > 0 && !state.winInfo ? Date.now() : null;
    setClockNow(Date.now());
  }, [syncCursor]);

  const handleReset = useCallback(() => {
    resetGameState(settings.boardSize, settings);
  }, [resetGameState, settings.boardSize]);

  const applySessionConfig = useCallback((nextSettings: GameSettings, nextGameMode: GameMode) => {
    setSettings(nextSettings);
    setGameMode(nextGameMode);
    resetGameState(nextSettings.boardSize, nextSettings);
  }, [resetGameState]);

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

  const playerClockMs = getDisplayedRemainingTime(
    remainingTime,
    activePlayer,
    turnStartedAtRef.current,
    clockNow,
  );

  return {
    settings,
    setSettings,
    applySessionConfig,
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
    threatsEnabled,
    setThreatsEnabled,
    syncSlice,
    executeMove,
    handleUndo,
    handleRedo,
    handleReset,
    moveCount: historyIndex,
    playerClockMs,
    canUndo: settings.undoRedoEnabled && historyIndex > 0,
    canRedo: settings.undoRedoEnabled && historyIndex < history.length - 1,
  };
}
