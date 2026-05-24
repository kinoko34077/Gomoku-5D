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
  focusFadeStrength: number;
  frontDepthFadeStrength: number;
}

export const defaultVisualTuning: VisualTuning = {
  backgroundGray: 24,
  outerGridOpacity: 0.18,
  sliceGridOpacity: 0.57,
  slicePlaneOpacity: 0.22,
  offSliceStoneOpacity: 0.32,
  offSliceEmptyOpacity: 0.18,
  outerDashSize: 0.08,
  outerGapSize: 0.15,
  phaseSaturationBoost: -1,
  whitePhaseLightness: 0.95,
  blackPhaseLightness: 0,
  phaseGlow: 0.56,
  stoneScale: 1.06,
  countMarkerScale: 0.69,
  countMarkerOffset: 0.54,
  focusFadeStrength: 0.42,
  frontDepthFadeStrength: 0.38,
};
