import * as XLSX from 'xlsx';
import type { PropertyRow } from '../supabase/types';

export const LEGEND_COLUMNS = ['current_number', 'building_name', 'address', 'sale_date'] as const;

export type LegendColumn = (typeof LEGEND_COLUMNS)[number];

export type LegendRow = Record<LegendColumn, string | number>;

/** Maps in-bounds list rows (already in list order) to legend table rows. */
export function toLegendRows(listRows: PropertyRow[]): LegendRow[] {
  return listRows.map((row) => ({
    current_number: row.current_number ?? '',
    building_name: row.building_name ?? '',
    address: row.address,
    sale_date: row.sale_date ?? '',
  }));
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Builds a CSV string with a header row matching {@link LEGEND_COLUMNS}. */
export function buildLegendCsv(listRows: PropertyRow[]): string {
  const rows = toLegendRows(listRows);
  const lines = [
    LEGEND_COLUMNS.join(','),
    ...rows.map((row) => LEGEND_COLUMNS.map((col) => escapeCsvCell(row[col])).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

/** Builds an .xlsx workbook (first sheet "Legend") as bytes. */
export function buildLegendXlsx(listRows: PropertyRow[]): Uint8Array {
  const rows = toLegendRows(listRows);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...LEGEND_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Legend');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Uint8Array(buffer);
}

export function downloadLegendFile(data: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportLegendCsv(listRows: PropertyRow[], filename = 'property-legend.csv'): void {
  downloadLegendFile(buildLegendCsv(listRows), filename, 'text/csv;charset=utf-8');
}

export function exportLegendXlsx(listRows: PropertyRow[], filename = 'property-legend.xlsx'): void {
  downloadLegendFile(
    buildLegendXlsx(listRows).slice(),
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}
