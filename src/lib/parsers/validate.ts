import type { RawImportRow, RowError, ValidatedRow } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Required fields per spec: name, address, lat, lng, sale_date. Missing
 * sale_date is rejected the same way as any other missing required field —
 * it is not optional at intake, even though the DB column stays nullable.
 */
export function validateRow(row: RawImportRow): ValidatedRow {
  const errors: RowError[] = [];

  if (!row.building_name || !row.building_name.trim()) {
    errors.push({ field: 'building_name', message: 'Missing building name' });
  }
  if (!row.address || !row.address.trim()) {
    errors.push({ field: 'address', message: 'Missing address' });
  }
  if (row.lat == null || Number.isNaN(row.lat) || row.lat < -90 || row.lat > 90) {
    errors.push({ field: 'lat', message: 'Invalid latitude' });
  }
  if (row.lng == null || Number.isNaN(row.lng) || row.lng < -180 || row.lng > 180) {
    errors.push({ field: 'lng', message: 'Invalid longitude' });
  }
  if (!row.sale_date || !row.sale_date.trim()) {
    errors.push({ field: 'sale_date', message: 'Missing sale date' });
  } else if (!isValidDate(row.sale_date)) {
    errors.push({ field: 'sale_date', message: 'Bad date format' });
  }

  return { ...row, errors, isValid: errors.length === 0 };
}

export function validateRows(rows: RawImportRow[]): ValidatedRow[] {
  return rows.map(validateRow);
}
