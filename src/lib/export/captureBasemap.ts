import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import { config } from '../../config/env';
import type { GeoBbox, PaperSize, ScreenRect } from '../../types/domain';
import { applyLabelVisibility, type LabelVisibility } from '../map/applyLabelVisibility';
import { setPropertyMarkersVisible } from '../map/propertyMarkerLayers';
import { exportPixelDimensions } from './exportResolution';

export function printBoundsCropRect(rect: ScreenRect, pixelRatio: number): ScreenRect {
  return {
    x: Math.round(rect.x * pixelRatio),
    y: Math.round(rect.y * pixelRatio),
    width: Math.round(rect.width * pixelRatio),
    height: Math.round(rect.height * pixelRatio),
  };
}

export function waitForMapIdle(map: MapboxMap, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Timed out waiting for map tiles to load'));
    }, timeoutMs);

    map.once('idle', () => {
      window.clearTimeout(timer);
      resolve();
    });
    if (!map.isMoving()) map.triggerRepaint();
  });
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to encode basemap image');
  return new Uint8Array(await blob.arrayBuffer());
}

export interface CaptureExportBasemapParams {
  bbox: GeoBbox;
  paper: PaperSize;
  styleUrl: string;
  labelVisibility: LabelVisibility;
}

async function captureCanvasAtTarget(
  canvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): Promise<Uint8Array> {
  if (canvas.width === targetWidth && canvas.height === targetHeight) {
    return canvasToPngBytes(canvas);
  }

  const output = document.createElement('canvas');
  output.width = targetWidth;
  output.height = targetHeight;
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Could not create export canvas');
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  return canvasToPngBytes(output);
}

/**
 * Renders a hidden offscreen Mapbox map at print resolution, matching the
 * user's basemap style and label visibility toggles. Geographic extent is
 * fitted to the print-bounds bbox so projection stays aligned with the PDF.
 */
export async function captureExportBasemap(params: CaptureExportBasemapParams): Promise<Uint8Array> {
  const { bbox, paper, styleUrl, labelVisibility } = params;
  const { width: targetWidth, height: targetHeight } = exportPixelDimensions(paper);
  // Mapbox GL v3 sizes the canvas as CSS pixels × devicePixelRatio — there is
  // no working pixelRatio constructor option, so shrink the CSS box on retina.
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = Math.round(targetWidth / dpr);
  const cssHeight = Math.round(targetHeight / dpr);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;overflow:hidden;';
  container.style.width = `${cssWidth}px`;
  container.style.height = `${cssHeight}px`;
  document.body.appendChild(container);

  mapboxgl.accessToken = config.mapboxToken;
  const map = new mapboxgl.Map({
    container,
    style: styleUrl,
    center: [(bbox.minLng + bbox.maxLng) / 2, (bbox.minLat + bbox.maxLat) / 2],
    zoom: 1,
    pitch: 0,
    bearing: 0,
    dragRotate: false,
    touchPitch: false,
    preserveDrawingBuffer: true,
    interactive: false,
    attributionControl: false,
  });

  try {
    await new Promise<void>((resolve, reject) => {
      map.once('load', () => resolve());
      map.once('error', (e) => reject(e.error ?? new Error('Map failed to load export style')));
    });

    applyLabelVisibility(map, labelVisibility);
    map.fitBounds(
      [
        [bbox.minLng, bbox.minLat],
        [bbox.maxLng, bbox.maxLat],
      ],
      { padding: 0, animate: false },
    );
    await waitForMapIdle(map);

    return captureCanvasAtTarget(map.getCanvas(), targetWidth, targetHeight);
  } finally {
    map.remove();
    document.body.removeChild(container);
  }
}

/**
 * Captures the live map canvas cropped to the print-bounds overlay. Kept for
 * tests and as a low-res fallback reference — export uses captureExportBasemap.
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

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = crop.width;
    cropCanvas.height = crop.height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create export canvas');

    ctx.drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

    return canvasToPngBytes(cropCanvas);
  } finally {
    setPropertyMarkersVisible(map, true);
    map.triggerRepaint();
  }
}
