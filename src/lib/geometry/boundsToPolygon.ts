import type { Map as MapboxMap } from 'mapbox-gl';
import type { GeoBbox, GeoPolygon, ScreenRect } from '../../types/domain';

/**
 * Converts the print-bounds box (a DOM overlay in screen pixels) to a
 * geographic polygon via Mapbox's unproject(). The map is kept at
 * pitch:0/bearing:0 (see useMapInstance) so the 4 unprojected corners form a
 * simple, consistently-ordered quad rather than needing to account for camera
 * rotation.
 */
export function screenRectToGeoPolygon(rect: ScreenRect, map: MapboxMap): GeoPolygon {
  const corners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
  ];
  return corners.map(([x, y]) => {
    const lngLat = map.unproject([x, y]);
    return { lng: lngLat.lng, lat: lngLat.lat };
  });
}

export function geoPolygonToBbox(polygon: GeoPolygon): GeoBbox {
  const lngs = polygon.map((p) => p.lng);
  const lats = polygon.map((p) => p.lat);
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  };
}

export function screenRectToGeoBbox(rect: ScreenRect, map: MapboxMap): GeoBbox {
  return geoPolygonToBbox(screenRectToGeoPolygon(rect, map));
}
