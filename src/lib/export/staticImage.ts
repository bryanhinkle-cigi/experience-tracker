import type { GeoBbox } from '../../types/domain';

/**
 * Mapbox's mapbox://styles/{user}/{id} URL doesn't map 1:1 to the Static
 * Images API path, which wants {username}/{style_id}.
 */
function styleUrlToPath(styleUrl: string): string {
  const match = styleUrl.match(/^mapbox:\/\/styles\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(`Unrecognized Mapbox style URL: ${styleUrl}`);
  return `${match[1]}/${match[2]}`;
}

/**
 * Uses the Static Images API's [bbox] syntax (rather than center/zoom) so the
 * fetched raster's extent exactly matches the print-bounds box's geographic
 * bounds — this is what projection.ts relies on for correct point placement.
 * Base request size is capped by the API at 1280px; @2x brings the delivered
 * pixel count to ~2560px, which is a practical ceiling for this pipeline
 * (not true 300dpi from a single call — see pdfExport.ts for the note on
 * this known limitation).
 */
export function buildStaticImageUrl(params: {
  bbox: GeoBbox;
  widthPx: number;
  heightPx: number;
  scale: 1 | 2;
  mapboxToken: string;
  mapboxStyleUrl: string;
}): string {
  const { bbox, widthPx, heightPx, scale, mapboxToken, mapboxStyleUrl } = params;
  const stylePath = styleUrlToPath(mapboxStyleUrl);
  // The styles/v1/.../static/ endpoint always returns PNG and does not accept
  // a .{format} suffix — that's a legacy v4 Static API convention and 404s here.
  const bboxStr = `[${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}]`;
  const scaleSuffix = scale === 2 ? '@2x' : '';
  return `https://api.mapbox.com/styles/v1/${stylePath}/static/${bboxStr}/${widthPx}x${heightPx}${scaleSuffix}?access_token=${mapboxToken}`;
}

export async function fetchStaticImageBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox Static Images API request failed: ${res.status} ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}
