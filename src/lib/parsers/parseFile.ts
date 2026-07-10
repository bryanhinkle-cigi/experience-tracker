import { parseCsv } from './csvParser';
import { parseGeoJson } from './geojsonParser';
import { parseXlsx } from './xlsxParser';
import type { RawImportRow } from './types';

export function parseFile(file: File): Promise<RawImportRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return parseXlsx(file);
  if (name.endsWith('.geojson') || name.endsWith('.json')) return parseGeoJson(file);
  return parseCsv(file);
}
