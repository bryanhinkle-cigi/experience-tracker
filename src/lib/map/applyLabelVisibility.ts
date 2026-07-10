import type { Map as MapboxMap } from 'mapbox-gl';
import { findLabelLayerIds, type LabelCategory } from './labelLayers';

export type LabelVisibility = Record<LabelCategory, boolean>;

export const DEFAULT_LABEL_VISIBILITY: LabelVisibility = { poi: true, building: true, road: true };

export function applyLabelVisibility(map: MapboxMap, visibility: LabelVisibility): void {
  (Object.keys(visibility) as LabelCategory[]).forEach((category) => {
    const visible = visibility[category];
    for (const layerId of findLabelLayerIds(map, category)) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    }
  });
}
