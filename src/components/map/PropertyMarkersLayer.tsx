import { useEffect, useRef } from 'react';
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl';
import type { PropertyRow } from '../../lib/supabase/types';

const SOURCE_ID = 'properties-source';
const CIRCLE_LAYER_ID = 'properties-circle-layer';
const NUMBER_LABEL_LAYER_ID = 'properties-number-label-layer';

// Muted color for out-of-bounds pins is a fixed constant (not user-configurable) —
// markerColor is the single "active/in-bounds" color the size/color settings panel
// controls; out-of-bounds pins stay dimmed regardless, preserving the
// brightens-on-entering-bounds behavior.
const OUT_OF_BOUNDS_COLOR = '#ACBBE8'; // --color-light-blue-grey

interface PropertyMarkersLayerProps {
  map: MapboxMap | null;
  properties: PropertyRow[];
  inBoundsIds: Set<string>;
  markerSize: number; // px diameter, uniform across numbered/unnumbered
  markerColor: string; // hex, used when a pin is inBounds
}

/**
 * Mapbox's Map methods (getLayer, setPaintProperty, ...) read internal state
 * that's torn down synchronously by map.remove(). When a parent component
 * unmounts, its own cleanup (which calls map.remove() in useMapInstance) and
 * this component's cleanup both fire in the same passive-effects flush —
 * React doesn't guarantee which runs first across sibling/parent fibers, and
 * empirically the map can already be destroyed by the time this runs. Once
 * the map itself is gone there's nothing left to clean up, so these calls
 * are just no-ops at that point — swallow the error rather than crash.
 */
function safely(fn: () => void) {
  try {
    fn();
  } catch {
    // map was already removed; nothing to do
  }
}

function toFeatureCollection(properties: PropertyRow[], inBoundsIds: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: properties.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        numbered: p.current_number != null,
        current_number: p.current_number ?? '',
        inBounds: inBoundsIds.has(p.id),
        address: p.address,
      },
    })),
  };
}

export function PropertyMarkersLayer({ map, properties, inBoundsIds, markerSize, markerColor }: PropertyMarkersLayerProps) {
  // addLayers (called from the 'style.load' listener, possibly long after this
  // render) always needs the *current* size/color, not whatever was in scope
  // when the listener was attached — refs keep that read live.
  const styleRef = useRef({ markerSize, markerColor });
  styleRef.current = { markerSize, markerColor };

  // Re-added on every 'style.load' (not just once) — switching map style
  // (e.g. the satellite toggle) wipes all custom sources/layers via setStyle().
  useEffect(() => {
    if (!map) return;

    function addLayers() {
      if (!map || map.getSource(SOURCE_ID)) return;
      const { markerSize: size, markerColor: color } = styleRef.current;
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: toFeatureCollection(properties, inBoundsIds),
      });

      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': size / 2,
          'circle-color': ['case', ['get', 'inBounds'], color, OUT_OF_BOUNDS_COLOR],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: NUMBER_LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['get', 'numbered'], true],
        layout: {
          'text-field': ['get', 'current_number'],
          'text-size': Math.max(9, size * 0.42),
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
    }

    if (map.isStyleLoaded()) addLayers();
    map.on('style.load', addLayers);

    return () => {
      safely(() => map.off('style.load', addLayers));
      safely(() => {
        if (map.getLayer(NUMBER_LABEL_LAYER_ID)) map.removeLayer(NUMBER_LABEL_LAYER_ID);
      });
      safely(() => {
        if (map.getLayer(CIRCLE_LAYER_ID)) map.removeLayer(CIRCLE_LAYER_ID);
      });
      safely(() => {
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      });
    };
    // Layer creation should only re-run when the map instance changes; the
    // effects below handle live size/color/data updates without recreating layers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Live-update paint properties on existing layers rather than recreating
  // them on every size/color tweak (keeps slider/color-picker dragging smooth).
  useEffect(() => {
    if (!map) return;
    safely(() => {
      if (!map.getLayer(CIRCLE_LAYER_ID)) return;
      map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-radius', markerSize / 2);
      map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-color', [
        'case',
        ['get', 'inBounds'],
        markerColor,
        OUT_OF_BOUNDS_COLOR,
      ]);
      if (map.getLayer(NUMBER_LABEL_LAYER_ID)) {
        map.setLayoutProperty(NUMBER_LABEL_LAYER_ID, 'text-size', Math.max(9, markerSize * 0.42));
      }
    });
  }, [map, markerSize, markerColor]);

  // Keep the source data in sync with live property/bounds changes.
  useEffect(() => {
    if (!map) return;
    safely(() => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(properties, inBoundsIds));
    });
  }, [map, properties, inBoundsIds]);

  return null;
}
