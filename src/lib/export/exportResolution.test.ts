import { describe, expect, it } from 'vitest';
import { exportPixelDimensions } from './exportResolution';

describe('exportPixelDimensions', () => {
  it('returns 300 dpi dimensions for letter', () => {
    expect(exportPixelDimensions('letter')).toEqual({ width: 2550, height: 3300 });
  });

  it('caps tabloid long edge to stay within WebGL limits', () => {
    const { width, height } = exportPixelDimensions('tabloid');
    expect(Math.max(width, height)).toBe(4096);
    expect(width).toBe(2650);
    expect(height).toBe(4096);
  });

  it('CSS container size compensates for device pixel ratio', () => {
    const { width, height } = exportPixelDimensions('letter');
    const dpr = 2;
    expect({ cssWidth: Math.round(width / dpr), cssHeight: Math.round(height / dpr) }).toEqual({
      cssWidth: 1275,
      cssHeight: 1650,
    });
  });
});
