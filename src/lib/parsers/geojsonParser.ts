import type { RawImportRow } from './types';

interface GeoJsonPointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonPointFeature[];
}

export async function parseGeoJson(file: File): Promise<RawImportRow[]> {
  const text = await file.text();
  const data = JSON.parse(text) as GeoJsonFeatureCollection;

  return data.features
    .filter((f) => f.geometry?.type === 'Point')
    .map((f): RawImportRow => {
      const [lng, lat] = f.geometry.coordinates;
      const props = f.properties ?? {};
      return {
        building_name: String(props.building_name ?? props.name ?? ''),
        address: String(props.address ?? ''),
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null,
        sale_date: String(props.sale_date ?? ''),
      };
    });
}
