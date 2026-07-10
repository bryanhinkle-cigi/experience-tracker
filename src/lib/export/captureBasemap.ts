import type { Map as MapboxMap } from 'mapbox-gl';
import type { ScreenRect } from '../../types/domain';
import { setPropertyMarkersVisible } from '../map/propertyMarkerLayers';

export function printBoundsCropRect(rect: ScreenRect, pixelRatio: number): ScreenRect {
  return {
    x: Math.round(rect.x * pixelRatio),
    y: Math.round(rect.y * pixelRatio),
    width: Math.round(rect.width * pixelRatio),
    height: Math.round(rect.height * pixelRatio),
  };
}

export function waitForMapIdle(map: MapboxMap): Promise<void> {
  return new Promise((resolve) => {
    map.once('idle', () => resolve());
    if (!map.isMoving()) map.triggerRepaint();
  });
}

/**
 * Captures the live map canvas cropped to the print-bounds overlay. This
 * preserves runtime style state — satellite toggle, label visibility, etc. —
 * which the Static Images API cannot reproduce from a bare style URL alone.
 */
export async function capturePrintBoundsBasemap(map: MapboxMap, rect: ScreenRect): Promise<Uint8Array> {
  setPropertyMarkersVisible(map, false);
  try {
    await waitForMapIdle(map);

    const canvas = map.getCanvas();
    const container = map.getContainer();
    const pixelRatio = canvas.width / container.clientWidth;
    const crop = printBoundsCropRect(rect, pixelRatio);
    if (crop.width <= 0 || crop.height <= 0) {
      throw new Error('Print bounds are not visible on the map');
    }

    const source = canvas;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = crop.width;
    cropCanvas.height = crop.height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create export canvas');

    ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

    const blob = await new Promise<Blob | null>((resolve) => cropCanvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Failed to encode basemap image');

    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    setPropertyMarkersVisible(map, true);
    map.triggerRepaint();
  }
}
