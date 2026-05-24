import type { VisualTuning } from './visualTuning';
import type { Player } from './types';

export interface PhaseStoneStyle {
  fill: string;
  emissive: string;
  emissiveIntensity: number;
  rim: string;
  text: string;
  outline: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const PHASE_ACCENTS: Record<number, { h: number; s: number; l: number }> = {
  1: { h: 0.01, s: 0.82, l: 0.52 },
  2: { h: 0.08, s: 0.86, l: 0.54 },
  3: { h: 0.14, s: 0.84, l: 0.56 },
  4: { h: 0.23, s: 0.78, l: 0.5 },
  5: { h: 0.31, s: 0.72, l: 0.46 },
  6: { h: 0.55, s: 0.9, l: 0.54 },
  7: { h: 0.63, s: 0.86, l: 0.56 },
  8: { h: 0.77, s: 0.74, l: 0.58 },
  9: { h: 0.92, s: 0.8, l: 0.56 },
};

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function getDisplayedStackCountForPlayer(
  player: Player | null,
  streak: { white: number; black: number },
): number {
  if (!player) return 0;
  return streak[player];
}

export function getPhaseStoneStyle(
  phase: number,
  player: Player,
  combo: number,
  inSlice: boolean,
  tuning?: Pick<
    VisualTuning,
    | 'phaseSaturationBoost'
    | 'whitePhaseLightness'
    | 'blackPhaseLightness'
    | 'phaseGlow'
  >,
): PhaseStoneStyle {
  const comboBoost = Math.min(0.22, Math.max(0, combo - 1) * 0.045);
  const saturationBoost = tuning?.phaseSaturationBoost ?? 0.16;
  const whiteLightness = tuning?.whitePhaseLightness ?? 0.62;
  const blackLightness = tuning?.blackPhaseLightness ?? 0.24;
  const phaseGlow = tuning?.phaseGlow ?? 0.32;

  if (phase === 0) {
    const isWhite = player === 'white';
    return {
      fill: isWhite ? '#f8fafc' : '#020617',
      emissive: isWhite ? '#ffffff' : '#000000',
      emissiveIntensity: inSlice ? (isWhite ? 0.12 + comboBoost : 0.02) : 0.03,
      rim: isWhite ? '#94a3b8' : '#334155',
      text: isWhite ? '#020617' : '#ffffff',
      outline: isWhite ? '#ffffff' : '#020617',
    };
  }

  const accent = PHASE_ACCENTS[phase];
  const isWhite = player === 'white';
  const baseSaturation = clamp(accent.s * 0.9 + saturationBoost, 0.5, 0.99);
  const whiteFill = hsl(
    accent.h,
    clamp(baseSaturation * 0.78, 0.38, 0.92),
    inSlice ? clamp(whiteLightness + 0.07 + accent.l * 0.03, 0.56, 0.84) : clamp(whiteLightness + accent.l * 0.02, 0.5, 0.78),
  );
  const blackFill = hsl(
    accent.h,
    baseSaturation,
    inSlice ? clamp(blackLightness + 0.08 + accent.l * 0.04, 0.16, 0.42) : clamp(blackLightness + accent.l * 0.02, 0.12, 0.34),
  );

  return {
    fill: isWhite ? whiteFill : blackFill,
    emissive: hsl(accent.h, accent.s, accent.l),
    emissiveIntensity: inSlice
      ? phaseGlow + comboBoost
      : Math.max(0.1, phaseGlow * 0.45),
    rim: isWhite
      ? hsl(accent.h, clamp(baseSaturation * 0.88, 0.42, 0.94), 0.46)
      : hsl(accent.h, clamp(baseSaturation, 0.5, 0.98), 0.5),
    text: isWhite ? '#020617' : '#ffffff',
    outline: isWhite ? '#ffffff' : '#020617',
  };
}

export function getPhaseLegendStyle(
  phase: number,
  player: Player,
  tuning?: Pick<
    VisualTuning,
    | 'phaseSaturationBoost'
    | 'whitePhaseLightness'
    | 'blackPhaseLightness'
    | 'phaseGlow'
  >,
): { swatch: string; text: string; border: string } {
  const style = getPhaseStoneStyle(phase, player, 1, true, tuning);
  return {
    swatch: style.fill,
    text: style.text,
    border: style.outline,
  };
}
