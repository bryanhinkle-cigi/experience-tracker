import { describe, expect, it } from 'vitest';
import { findLabelLayerIds } from './labelLayers';
import type { Map as MapboxMap } from 'mapbox-gl';

// Representative subset of Mapbox Streets v8 style layers (light-v11 / satellite-streets-v12).
const STYLE_LAYERS = [
  { id: 'background', type: 'background' },
  { id: 'building', type: 'fill', 'source-layer': 'building' },
  { id: 'road-primary', type: 'line', 'source-layer': 'road' },
  { id: 'road-label', type: 'symbol', 'source-layer': 'road' },
  { id: 'road-number-shield', type: 'symbol', 'source-layer': 'road' },
  { id: 'poi-label', type: 'symbol', 'source-layer': 'poi_label' },
  { id: 'transit-label', type: 'symbol', 'source-layer': 'transit_stop_label' },
  { id: 'housenum-label', type: 'symbol', 'source-layer': 'housenum_label' },
  { id: 'settlement-label', type: 'symbol', 'source-layer': 'place_label' },
];

function fakeMap(): MapboxMap {
  return {
    getStyle: () => ({ layers: STYLE_LAYERS }),
  } as unknown as MapboxMap;
}

describe('findLabelLayerIds', () => {
  const map = fakeMap();

  it('matches POI label layers only', () => {
    expect(findLabelLayerIds(map, 'poi')).toEqual(['poi-label']);
  });

  it('matches building/housenumber label layers, excluding the building fill layer', () => {
    const ids = findLabelLayerIds(map, 'building');
    expect(ids).toContain('housenum-label');
    expect(ids).not.toContain('building'); // fill layer, not a symbol/label layer
  });

  it('matches road label + shield layers, excluding the road line layer', () => {
    const ids = findLabelLayerIds(map, 'road');
    expect(ids).toContain('road-label');
    expect(ids).not.toContain('road-primary'); // line layer, not a label
  });

  it('does not match unrelated layers like settlement/transit labels', () => {
    expect(findLabelLayerIds(map, 'poi')).not.toContain('settlement-label');
    expect(findLabelLayerIds(map, 'poi')).not.toContain('transit-label');
  });
});
