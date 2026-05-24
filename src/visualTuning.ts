export interface VisualTuning {
  backgroundGray: number;
  outerGridOpacity: number;
  sliceGridOpacity: number;
  slicePlaneOpacity: number;
  offSliceStoneOpacity: number;
  offSliceEmptyOpacity: number;
  outerDashSize: number;
  outerGapSize: number;
  phaseSaturationBoost: number;
  whitePhaseLightness: number;
  blackPhaseLightness: number;
  phaseGlow: number;
  stoneScale: number;
  countMarkerScale: number;
  countMarkerOffset: number;
}

export const defaultVisualTuning: VisualTuning = {
  backgroundGray: 24,
  outerGridOpacity: 0.25,
  sliceGridOpacity: 0.57,
  slicePlaneOpacity: 0.22,
  offSliceStoneOpacity: 0.45,
  offSliceEmptyOpacity: 0.18,
  outerDashSize: 0.08,
  outerGapSize: 0.15,
  phaseSaturationBoost: 0,
  whitePhaseLightness: 0.8,
  blackPhaseLightness: 0.08,
  phaseGlow: 0.17,
  stoneScale: 1.28,
  countMarkerScale: 0.24,
  countMarkerOffset: 0.68,
};
