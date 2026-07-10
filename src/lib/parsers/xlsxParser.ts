import * as XLSX from 'xlsx';
import type { RawImportRow } from './types';

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function parseXlsx(file: File): Promise<RawImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows.map((r): RawImportRow => {
    const saleDateRaw = r.sale_date;
    // Excel may parse date-typed cells as JS Date objects rather than strings.
    const sale_date =
      saleDateRaw instanceof Date
        ? saleDateRaw.toISOString().slice(0, 10)
        : String(saleDateRaw ?? '');

    return {
      building_name: String(r.building_name ?? ''),
      address: String(r.address ?? ''),
      lat: toNumberOrNull(r.lat),
      lng: toNumberOrNull(r.lng),
      sale_date,
    };
  });
}
