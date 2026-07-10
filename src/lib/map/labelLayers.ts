import type { Map as MapboxMap } from 'mapbox-gl';

export type LabelCategory = 'poi' | 'building' | 'road';

/**
 * Mapbox's default styles (light-v11, satellite-streets-v12, etc.) don't
 * expose a stable, documented list of "POI label" / "building label" /
 * "street label" layer ids that's guaranteed identical across style
 * versions — so instead of hardcoding ids (which would silently do nothing
 * if a style renamed them), we pattern-match against the live style's layer
 * list at runtime by id and source-layer naming conventions from the
 * Mapbox Streets v8 vector tileset, which both of the styles this app
 * offers are built on.
 */
export function findLabelLayerIds(map: MapboxMap, category: LabelCategory): string[] {
  const layers = map.getStyle()?.layers ?? [];
  return layers
    .filter((layer) => layer.type === 'symbol' && matchesCategory(layer, category))
    .map((layer) => layer.id);
}

function matchesCategory(
  layer: { id: string; 'source-layer'?: string },
  category: LabelCategory,
): boolean {
  const id = layer.id.toLowerCase();
  const sourceLayer = (layer['source-layer'] ?? '').toLowerCase();

  switch (category) {
    case 'poi':
      return id.includes('poi') || sourceLayer.includes('poi');
    case 'building':
      return (
        id.includes('building') ||
        sourceLayer.includes('building') ||
        id.includes('housenum') ||
        sourceLayer.includes('housenum')
      );
    case 'road':
      return (
        id.includes('road-label') ||
        id.includes('street-label') ||
        (sourceLayer === 'road' && id.includes('label'))
      );
  }
}
