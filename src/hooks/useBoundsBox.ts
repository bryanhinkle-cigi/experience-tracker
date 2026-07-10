import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import {
  computeBoxRect,
  DEFAULT_BOUNDS_STATE,
  setPaperSize as setPaperSizeState,
  updateAnchorFromDrag,
  updateScaleFromResize,
  type BoundsBoxState,
} from '../lib/geometry/boundsBox';
import { screenRectToGeoPolygon } from '../lib/geometry/boundsToPolygon';
import type { GeoPolygon, PaperSize, ScreenRect } from '../types/domain';

interface DragState {
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  startState: BoundsBoxState;
}

export function useBoundsBox(containerRef: React.RefObject<HTMLDivElement | null>, map: MapboxMap | null) {
  const [state, setState] = useState<BoundsBoxState>(DEFAULT_BOUNDS_STATE);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const dragRef = useRef<DragState | null>(null);
  const [boundsPolygon, setBoundsPolygon] = useState<GeoPolygon | null>(null);

  // Recompute container size on mount + resize (ResizeObserver, not window.resize,
  // so panel-driven layout changes are also caught).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, [containerRef]);

  const rect: ScreenRect = computeBoxRect(containerSize, state);

  const recomputePolygon = useCallback(() => {
    if (!map || containerSize.w === 0) {
      setBoundsPolygon(null);
      return;
    }
    setBoundsPolygon(screenRectToGeoPolygon(rect, map));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, rect.x, rect.y, rect.width, rect.height]);

  // Recompute on moveend (map finished panning/zooming) and whenever the box itself changes.
  useEffect(() => {
    recomputePolygon();
    if (!map) return;
    map.on('moveend', recomputePolygon);
    return () => {
      // map may already be destroyed if a parent unmounted first (see the
      // matching note in PropertyMarkersLayer.tsx) — nothing to clean up if so.
      try {
        map.off('moveend', recomputePolygon);
      } catch {
        /* map already removed */
      }
    };
  }, [map, recomputePolygon]);

  const onBoxMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dragRef.current = { mode: 'move', startX: e.clientX, startY: e.clientY, startState: state };
    },
    [state],
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dragRef.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, startState: state };
    },
    [state],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag || containerSize.w === 0) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (drag.mode === 'move') {
        setState(updateAnchorFromDrag(drag.startState, { dx, dy }, containerSize));
      } else {
        setState(
          updateScaleFromResize(drag.startState, dx, containerSize, drag.startState.scaleFrac),
        );
      }
    }
    function onMouseUp() {
      dragRef.current = null;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [containerSize]);

  const setPaperSize = useCallback((paper: PaperSize) => {
    setState((s) => setPaperSizeState(s, paper));
  }, []);

  return {
    paper: state.paper,
    rect,
    boundsPolygon,
    setPaperSize,
    onBoxMouseDown,
    onResizeMouseDown,
  };
}
