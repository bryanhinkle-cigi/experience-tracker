import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl';
import { findLabelLayerIds, type LabelCategory } from '../map/labelLayers';
import { EXPORT_DPI } from './exportResolution';

/** Reference screen DPI Mapbox style text-size values are authored against. */
export const SCREEN_DPI = 96;

const LABEL_CATEGORIES: LabelCategory[] = ['poi', 'building', 'road'];

/**
 * Multiplier so export label glyphs print at roughly the same physical size
 * as the same CSS text-size would on a {@link SCREEN_DPI} display.
 *
 * Mapbox `text-size` is in CSS pixels; the export canvas is CSS × devicePixelRatio
 * device pixels, then placed on a page at {@link EXPORT_DPI}. Dividing by DPR
 * keeps the printed size stable across retina and non-retina machines.
 */
export function exportLabelTextScale(
  devicePixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  dpi: number = EXPORT_DPI,
): number {
  const dpr = Math.max(devicePixelRatio, 0.5);
  return dpi / SCREEN_DPI / dpr;
}

/**
 * Multiplies `text-size` on POI / building / road label layers. No-ops for
 * symbol layers that have no text-size (e.g. icon-only shields). Export-only —
 * do not call on the interactive map.
 */
export function scaleExportLabelTextSizes(map: MapboxMap, multiplier: number): void {
  if (!(multiplier > 0) || multiplier === 1) return;

  for (const category of LABEL_CATEGORIES) {
    for (const layerId of findLabelLayerIds(map, category)) {
      if (!map.getLayer(layerId)) continue;
      let current: unknown;
      try {
        current = map.getLayoutProperty(layerId, 'text-size');
      } catch {
        continue;
      }
      if (current == null) continue;
      map.setLayoutProperty(layerId, 'text-size', multiplyTextSize(current, multiplier));
    }
  }
}

/** Wraps a Mapbox text-size value (number or expression) in a multiply expression. */
export function multiplyTextSize(
  current: unknown,
  multiplier: number,
): number | ExpressionSpecification {
  if (typeof current === 'number') {
    return current * multiplier;
  }
  return ['*', multiplier, current] as ExpressionSpecification;
}
