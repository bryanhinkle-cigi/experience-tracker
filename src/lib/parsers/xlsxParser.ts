import * as XLSX from 'xlsx';
import type { RawImportRow } from './types';

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickNumber(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const n = toNumberOrNull(row[key]);
    if (n != null) return n;
  }
  return null;
}

function parseSaleDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const month = String(parsed.m).padStart(2, '0');
      const day = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${month}-${day}`;
    }
  }
  return String(value ?? '');
}

export async function parseXlsx(file: File): Promise<RawImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows.map((r): RawImportRow => ({
    building_name: String(r.building_name ?? ''),
    address: String(r.address ?? ''),
    lat: pickNumber(r, 'lat', 'latitude'),
    lng: pickNumber(r, 'lng', 'long', 'lon', 'longitude'),
    sale_date: parseSaleDate(r.sale_date),
  }));
}
