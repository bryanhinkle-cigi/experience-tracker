import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCsv } from './csvParser';
import { parseGeoJson } from './geojsonParser';
import { parseXlsx } from './xlsxParser';
import { validateRows } from './validate';

const FIXTURE_DIR = resolve(__dirname, '../../../public/sample-data');

describe('Phase 1 checkpoint: sample-properties fixtures', () => {
  it('CSV: 20 rows parsed, 18 valid, 2 flagged (missing sale_date, bad lat)', async () => {
    const buffer = readFileSync(resolve(FIXTURE_DIR, 'sample-properties.csv'));
    const file = new File([buffer], 'sample-properties.csv', { type: 'text/csv' });
    const rows = await parseCsv(file);
    expect(rows).toHaveLength(20);

    const validated = validateRows(rows);
    const invalid = validated.filter((r) => !r.isValid);
    const valid = validated.filter((r) => r.isValid);
    expect(invalid).toHaveLength(2);
    expect(valid).toHaveLength(18);

    const missingSaleDate = invalid.find((r) => r.building_name === 'Metro Hall Annex');
    expect(missingSaleDate?.errors.map((e) => e.field)).toContain('sale_date');

    const badLat = invalid.find((r) => r.building_name === 'Wellington Yards');
    expect(badLat?.errors.map((e) => e.field)).toContain('lat');
  });

  it('GeoJSON: same 20 rows, same 2 broken rows', async () => {
    const buffer = readFileSync(resolve(FIXTURE_DIR, 'sample-properties.geojson'));
    const file = new File([buffer], 'sample-properties.geojson', { type: 'application/geo+json' });
    const rows = await parseGeoJson(file);
    expect(rows).toHaveLength(20);

    const validated = validateRows(rows);
    expect(validated.filter((r) => !r.isValid)).toHaveLength(2);
    expect(validated.filter((r) => r.isValid)).toHaveLength(18);
  });

  it('XLSX: same 20 rows, same 2 broken rows', async () => {
    const buffer = readFileSync(resolve(FIXTURE_DIR, 'sample-properties.xlsx'));
    const file = new File([buffer], 'sample-properties.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const rows = await parseXlsx(file);
    expect(rows).toHaveLength(20);

    const validated = validateRows(rows);
    expect(validated.filter((r) => !r.isValid)).toHaveLength(2);
    expect(validated.filter((r) => r.isValid)).toHaveLength(18);
  });
});
