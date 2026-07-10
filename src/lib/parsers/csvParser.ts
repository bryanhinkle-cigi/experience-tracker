import Papa from 'papaparse';
import type { RawImportRow } from './types';

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function parseCsv(file: File): Promise<RawImportRow[]> {
  // Parse from text rather than passing the File directly to Papa — its
  // File-streaming mode needs FileReaderSync, which only exists in Web
  // Worker contexts (not the main thread, and not Node test environments).
  const text = await file.text();
  const results = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (results.errors.length > 0) {
    throw new Error(results.errors[0].message);
  }
  return results.data.map(
    (r): RawImportRow => ({
      building_name: r.building_name ?? '',
      address: r.address ?? '',
      lat: toNumberOrNull(r.lat),
      lng: toNumberOrNull(r.lng),
      sale_date: r.sale_date ?? '',
    }),
  );
}
