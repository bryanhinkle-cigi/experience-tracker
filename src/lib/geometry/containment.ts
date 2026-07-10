import { booleanPointInPolygon, point, polygon as turfPolygon } from '@turf/turf';
import type { GeoPolygon } from '../../types/domain';

function toTurfPolygon(geoPolygon: GeoPolygon) {
  const ring = geoPolygon.map((p) => [p.lng, p.lat]);
  ring.push(ring[0]); // close the ring
  return turfPolygon([ring]);
}

export function getPropertiesInBounds<T extends { lng: number; lat: number }>(
  properties: T[],
  boundsPolygon: GeoPolygon | null,
): T[] {
  if (!boundsPolygon) return [];
  const poly = toTurfPolygon(boundsPolygon);
  return properties.filter((p) => booleanPointInPolygon(point([p.lng, p.lat]), poly));
}
