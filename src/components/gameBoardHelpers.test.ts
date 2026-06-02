import { describe, expect, it } from 'vitest';
import {
  buildGridPointSets,
  formatAxisIndexToXLabel,
  formatAxisIndexToYLabel,
  formatAxisIndexToZLabel,
  formatDisplayCoordinate,
} from './gameBoardHelpers';

describe('coordinate display helpers', () => {
  it('formats coordinates as 英字・数字・漢数字', () => {
    expect(formatAxisIndexToXLabel(7)).toBe('H');
    expect(formatAxisIndexToYLabel(7)).toBe('8');
    expect(formatAxisIndexToZLabel(7)).toBe('八');
    expect(formatDisplayCoordinate([7, 7, 7])).toBe('H8八');
  });
});

describe('buildGridPointSets', () => {
  it('keeps detailed line grids below size 10', () => {
    const grid = buildGridPointSets(9, 1.9, 'Z', 4);

    expect(grid.densityMode).toBe('detailed');
    expect(grid.outerPoints.length).toBeGreaterThan(0);
    expect(grid.slicePoints.length).toBeGreaterThan(0);
    expect(grid.outerDotPositions.length).toBe(0);
    expect(grid.sliceDotPositions.length).toBe(0);
  });

  it('switches to point grid mode for size 10 and above', () => {
    const grid = buildGridPointSets(10, 1.9, 'Z', 4);

    expect(grid.densityMode).toBe('points');
    expect(grid.outerPoints.length).toBeGreaterThan(0);
    expect(grid.slicePoints.length).toBe(0);
    expect(grid.outerDotPositions.length).toBeGreaterThan(0);
    expect(grid.sliceDotPositions.length).toBeGreaterThan(0);
  });
});
