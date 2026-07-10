import type { GeoBbox } from '../../types/domain';

/**
 * Linearly interpolates a lat/lng into PDF page point coordinates, given the
 * bbox the basemap image was fetched for and the page dimensions it's drawn
 * into full-bleed. Both PDF-y and latitude increase "upward", so no axis flip
 * is needed — as long as the same bbox + page rect + interpolation is used
 * for both the image placement and every point placed on top of it, they
 * stay aligned regardless of which corner is treated as the coordinate origin.
 *
 * Linear interpolation (rather than a true Mercator-aware projection) is an
 * acceptable approximation here: the bounds box is city-block-sized, well
 * within the range where Mercator distortion is negligible.
 */
export function latLngToPdfPoint(
  point: { lat: number; lng: number },
  bbox: GeoBbox,
  pageWidthPt: number,
  pageHeightPt: number,
): { x: number; y: number } {
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;
  const xFrac = lngSpan === 0 ? 0.5 : (point.lng - bbox.minLng) / lngSpan;
  const yFrac = latSpan === 0 ? 0.5 : (point.lat - bbox.minLat) / latSpan;
  return {
    x: xFrac * pageWidthPt,
    y: yFrac * pageHeightPt,
  };
}
