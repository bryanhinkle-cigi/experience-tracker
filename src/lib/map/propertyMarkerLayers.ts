import type { Map as MapboxMap } from 'mapbox-gl';

export const PROPERTY_MARKERS_SOURCE_ID = 'properties-source';
export const PROPERTY_MARKERS_CIRCLE_LAYER_ID = 'properties-circle-layer';
export const PROPERTY_MARKERS_NUMBER_LAYER_ID = 'properties-number-label-layer';

export function setPropertyMarkersVisible(map: MapboxMap, visible: boolean) {
  const visibility = visible ? 'visible' : 'none';
  if (map.getLayer(PROPERTY_MARKERS_CIRCLE_LAYER_ID)) {
    map.setLayoutProperty(PROPERTY_MARKERS_CIRCLE_LAYER_ID, 'visibility', visibility);
  }
  if (map.getLayer(PROPERTY_MARKERS_NUMBER_LAYER_ID)) {
    map.setLayoutProperty(PROPERTY_MARKERS_NUMBER_LAYER_ID, 'visibility', visibility);
  }
}
