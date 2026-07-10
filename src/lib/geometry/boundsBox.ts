import { PAPER_RATIOS, type PaperSize, type ScreenRect } from '../../types/domain';

export interface BoundsBoxState {
  paper: PaperSize;
  /** Center point of the box, as a fraction of container width/height (0..1). */
  anchorFrac: { x: number; y: number };
  /** Box width as a fraction of container width (0..1). Height is derived from the paper ratio. */
  scaleFrac: number;
}

export const DEFAULT_BOUNDS_STATE: BoundsBoxState = {
  paper: 'letter',
  anchorFrac: { x: 0.5, y: 0.45 },
  scaleFrac: 0.32,
};

const MIN_SCALE_FRAC = 0.08;
const MAX_SCALE_FRAC = 0.92;

/**
 * Derives the box's on-screen pixel rect fresh from the current container size
 * every time — this is what makes the box immune to stale-absolute-px bugs on
 * window resize: there is no stored width/height, only fractions.
 */
export function computeBoxRect(containerSize: { w: number; h: number }, state: BoundsBoxState): ScreenRect {
  const ratio = PAPER_RATIOS[state.paper]; // width / height
  const width = containerSize.w * state.scaleFrac;
  const height = width / ratio;
  const centerX = state.anchorFrac.x * containerSize.w;
  const centerY = state.anchorFrac.y * containerSize.h;
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

export function updateAnchorFromDrag(
  state: BoundsBoxState,
  deltaPx: { dx: number; dy: number },
  containerSize: { w: number; h: number },
): BoundsBoxState {
  return {
    ...state,
    anchorFrac: {
      x: state.anchorFrac.x + deltaPx.dx / containerSize.w,
      y: state.anchorFrac.y + deltaPx.dy / containerSize.h,
    },
  };
}

export function updateScaleFromResize(
  state: BoundsBoxState,
  deltaWidthPx: number,
  containerSize: { w: number; h: number },
  startScaleFrac: number,
): BoundsBoxState {
  const newScaleFrac = startScaleFrac + deltaWidthPx / containerSize.w;
  return {
    ...state,
    scaleFrac: Math.min(MAX_SCALE_FRAC, Math.max(MIN_SCALE_FRAC, newScaleFrac)),
  };
}

export function setPaperSize(state: BoundsBoxState, paper: PaperSize): BoundsBoxState {
  return { ...state, paper };
}
