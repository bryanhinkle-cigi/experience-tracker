import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import {
  applyLabelVisibility,
  DEFAULT_LABEL_VISIBILITY,
  type LabelVisibility,
} from '../lib/map/applyLabelVisibility';

export type { LabelVisibility };

/**
 * Controls visibility of POI / building / street label layers independently.
 * Re-applies on every 'style.load' (not just once) since switching basemap
 * style (e.g. the satellite toggle) rebuilds the layer list from scratch —
 * the matched layer ids for a given category can differ between styles.
 */
export function useMapLabelVisibility(map: MapboxMap | null) {
  const [visibility, setVisibility] = useState<LabelVisibility>(DEFAULT_LABEL_VISIBILITY);
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const applyAll = useCallback(() => {
    if (!map) return;
    applyLabelVisibility(map, visibilityRef.current);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (map.isStyleLoaded()) applyAll();
    map.on('style.load', applyAll);
    return () => {
      map.off('style.load', applyAll);
    };
  }, [map, applyAll]);

  // Re-apply immediately whenever the user toggles a category (not just on style reload).
  useEffect(() => {
    applyAll();
  }, [applyAll, visibility]);

  const setCategoryVisible = useCallback((category: keyof LabelVisibility, visible: boolean) => {
    setVisibility((prev) => ({ ...prev, [category]: visible }));
  }, []);

  return { visibility, setCategoryVisible };
}
