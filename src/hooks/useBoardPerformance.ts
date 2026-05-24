import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { detectThreats, type Threat } from '../gameLogic';
import type { Board, GameSettings, Player, WinInfo } from '../types';
import type { PerformanceState } from './useFiveDGomoku';

interface ThreatEffectParams {
  board: Board;
  settings: GameSettings;
  activePlayer: Player;
  winInfo: WinInfo | null;
  threatDetectionEnabled: boolean;
  setThreats: (threats: Threat[]) => void;
  setPerformanceState: Dispatch<SetStateAction<PerformanceState>>;
}

export function useThreatDetector({
  board,
  settings,
  activePlayer,
  winInfo,
  threatDetectionEnabled,
  setThreats,
  setPerformanceState,
}: ThreatEffectParams) {
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
  }, [activePlayer, board, settings, setPerformanceState, setThreats, threatDetectionEnabled, winInfo]);
}

export function useFrameLagMonitor(
  setPerformanceState: Dispatch<SetStateAction<PerformanceState>>,
) {
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
  }, [setPerformanceState]);
}
