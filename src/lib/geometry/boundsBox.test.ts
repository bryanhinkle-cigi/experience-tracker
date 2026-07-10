import { describe, expect, it } from 'vitest';
import {
  computeBoxRect,
  DEFAULT_BOUNDS_STATE,
  setPaperSize,
  updateAnchorFromDrag,
  updateScaleFromResize,
} from './boundsBox';
import { PAPER_RATIOS } from '../../types/domain';

describe('computeBoxRect', () => {
  it('produces a rect matching the paper aspect ratio', () => {
    const containerSize = { w: 1200, h: 800 };
    const rect = computeBoxRect(containerSize, DEFAULT_BOUNDS_STATE);
    expect(rect.width / rect.height).toBeCloseTo(PAPER_RATIOS.letter, 5);
  });

  it('stays proportionally centered and correctly ratioed across many container sizes (resize stability)', () => {
    const sizes = [
      { w: 1200, h: 800 },
      { w: 400, h: 900 }, // extreme portrait
      { w: 2400, h: 300 }, // extreme landscape
      { w: 800, h: 800 },
    ];
    for (const size of sizes) {
      const rect = computeBoxRect(size, DEFAULT_BOUNDS_STATE);
      expect(rect.width / rect.height).toBeCloseTo(PAPER_RATIOS.letter, 5);
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      expect(centerX / size.w).toBeCloseTo(DEFAULT_BOUNDS_STATE.anchorFrac.x, 5);
      expect(centerY / size.h).toBeCloseTo(DEFAULT_BOUNDS_STATE.anchorFrac.y, 5);
    }
  });

  it('changes ratio correctly when paper size toggles, without changing center', () => {
    const containerSize = { w: 1200, h: 800 };
    const letterState = DEFAULT_BOUNDS_STATE;
    const tabloidState = setPaperSize(letterState, 'tabloid');

    const letterRect = computeBoxRect(containerSize, letterState);
    const tabloidRect = computeBoxRect(containerSize, tabloidState);

    expect(letterRect.width / letterRect.height).toBeCloseTo(PAPER_RATIOS.letter, 5);
    expect(tabloidRect.width / tabloidRect.height).toBeCloseTo(PAPER_RATIOS.tabloid, 5);
    expect(letterRect.width / letterRect.height).not.toBeCloseTo(tabloidRect.width / tabloidRect.height, 2);

    // same center (width changes because scaleFrac is measured against container width,
    // which is unchanged by the paper toggle)
    const letterCenterX = letterRect.x + letterRect.width / 2;
    const tabloidCenterX = tabloidRect.x + tabloidRect.width / 2;
    expect(letterCenterX).toBeCloseTo(tabloidCenterX, 5);
  });
});

describe('updateAnchorFromDrag', () => {
  it('moves the box by the drag delta converted to container-relative fractions', () => {
    const containerSize = { w: 1000, h: 1000 };
    const next = updateAnchorFromDrag(DEFAULT_BOUNDS_STATE, { dx: 100, dy: 50 }, containerSize);
    expect(next.anchorFrac.x).toBeCloseTo(DEFAULT_BOUNDS_STATE.anchorFrac.x + 0.1, 5);
    expect(next.anchorFrac.y).toBeCloseTo(DEFAULT_BOUNDS_STATE.anchorFrac.y + 0.05, 5);
  });
});

describe('updateScaleFromResize', () => {
  it('grows/shrinks scaleFrac from the resize delta and keeps ratio locked', () => {
    const containerSize = { w: 1000, h: 1000 };
    const next = updateScaleFromResize(DEFAULT_BOUNDS_STATE, 100, containerSize, DEFAULT_BOUNDS_STATE.scaleFrac);
    expect(next.scaleFrac).toBeCloseTo(DEFAULT_BOUNDS_STATE.scaleFrac + 0.1, 5);
    const rect = computeBoxRect(containerSize, next);
    expect(rect.width / rect.height).toBeCloseTo(PAPER_RATIOS.letter, 5);
  });

  it('clamps scaleFrac within sane bounds', () => {
    const containerSize = { w: 1000, h: 1000 };
    const shrunk = updateScaleFromResize(DEFAULT_BOUNDS_STATE, -10000, containerSize, DEFAULT_BOUNDS_STATE.scaleFrac);
    expect(shrunk.scaleFrac).toBeGreaterThanOrEqual(0.08);
    const grown = updateScaleFromResize(DEFAULT_BOUNDS_STATE, 10000, containerSize, DEFAULT_BOUNDS_STATE.scaleFrac);
    expect(grown.scaleFrac).toBeLessThanOrEqual(0.92);
  });
});
