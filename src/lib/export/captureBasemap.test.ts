import { describe, expect, it } from 'vitest';
import { printBoundsCropRect } from './captureBasemap';

describe('printBoundsCropRect', () => {
  it('scales CSS pixel rect to device pixels', () => {
    expect(printBoundsCropRect({ x: 100, y: 50, width: 400, height: 520 }, 2)).toEqual({
      x: 200,
      y: 100,
      width: 800,
      height: 1040,
    });
  });
});
