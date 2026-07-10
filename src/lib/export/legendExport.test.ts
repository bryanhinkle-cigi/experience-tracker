import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildLegendCsv, buildLegendXlsx, toLegendRows } from './legendExport';
import type { PropertyRow } from '../supabase/types';

function row(partial: Partial<PropertyRow> & Pick<PropertyRow, 'id' | 'address'>): PropertyRow {
  return {
    building_name: null,
    lat: 0,
    lng: 0,
    sale_date: null,
    current_number: null,
    list_order: null,
    created_at: '2024-01-01T00:00:00Z',
    ...partial,
  };
}

describe('toLegendRows', () => {
  it('preserves list order and maps legend columns', () => {
    const rows = [
      row({
        id: 'a',
        address: 'Second',
        building_name: 'B',
        current_number: 2,
        sale_date: '2023-01-01',
      }),
      row({
        id: 'b',
        address: 'First',
        building_name: 'A',
        current_number: 1,
        sale_date: '2024-01-01',
      }),
    ];
    expect(toLegendRows(rows)).toEqual([
      { current_number: 2, building_name: 'B', address: 'Second', sale_date: '2023-01-01' },
      { current_number: 1, building_name: 'A', address: 'First', sale_date: '2024-01-01' },
    ]);
  });

  it('uses empty strings for null building name / sale date / number', () => {
    expect(toLegendRows([row({ id: 'x', address: '9 King' })])).toEqual([
      { current_number: '', building_name: '', address: '9 King', sale_date: '' },
    ]);
  });
});

describe('buildLegendCsv', () => {
  it('writes header and rows in list order', () => {
    const csv = buildLegendCsv([
      row({ id: '1', address: 'A St', current_number: 1, building_name: 'One', sale_date: '2024-05-01' }),
      row({ id: '2', address: 'B St', current_number: 2, sale_date: '2023-05-01' }),
    ]);
    expect(csv).toBe(
      [
        'current_number,building_name,address,sale_date',
        '1,One,A St,2024-05-01',
        '2,,B St,2023-05-01',
        '',
      ].join('\n'),
    );
  });

  it('escapes commas and quotes in fields', () => {
    const csv = buildLegendCsv([
      row({
        id: '1',
        address: '1 Main, Suite "A"',
        current_number: 1,
        building_name: 'Tower, East',
        sale_date: '2024-01-01',
      }),
    ]);
    expect(csv).toContain('"Tower, East"');
    expect(csv).toContain('"1 Main, Suite ""A"""');
  });
});

describe('buildLegendXlsx', () => {
  it('writes the same columns and order as CSV', () => {
    const listRows = [
      row({ id: '1', address: 'A St', current_number: 1, building_name: 'One', sale_date: '2024-05-01' }),
      row({ id: '2', address: 'B St', current_number: 2, sale_date: '2023-05-01' }),
    ];
    const bytes = buildLegendXlsx(listRows);
    const workbook = XLSX.read(bytes, { type: 'array' });
    expect(workbook.SheetNames[0]).toBe('Legend');
    const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Legend);
    expect(parsed).toEqual([
      { current_number: 1, building_name: 'One', address: 'A St', sale_date: '2024-05-01' },
      { current_number: 2, building_name: '', address: 'B St', sale_date: '2023-05-01' },
    ]);
  });
});
