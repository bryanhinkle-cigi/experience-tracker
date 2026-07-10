import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { findLabelLayerIds, type LabelCategory } from '../lib/map/labelLayers';

export type LabelVisibility = Record<LabelCategory, boolean>;

const DEFAULT_VISIBILITY: LabelVisibility = { poi: true, building: true, road: true };

/**
 * Controls visibility of POI / building / street label layers independently.
 * Re-applies on every 'style.load' (not just once) since switching basemap
 * style (e.g. the satellite toggle) rebuilds the layer list from scratch —
 * the matched layer ids for a given category can differ between styles.
 */
export function useMapLabelVisibility(map: MapboxMap | null) {
  const [visibility, setVisibility] = useState<LabelVisibility>(DEFAULT_VISIBILITY);
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const applyAll = useCallback(() => {
    if (!map) return;
    (Object.keys(visibilityRef.current) as LabelCategory[]).forEach((category) => {
      const visible = visibilityRef.current[category];
      for (const layerId of findLabelLayerIds(map, category)) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      }
    });
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

  const setCategoryVisible = useCallback((category: LabelCategory, visible: boolean) => {
    setVisibility((prev) => ({ ...prev, [category]: visible }));
  }, []);

  return { visibility, setCategoryVisible };
}
