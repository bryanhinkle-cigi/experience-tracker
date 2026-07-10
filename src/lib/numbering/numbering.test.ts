import { describe, expect, it } from 'vitest';
import {
  applyManualReorder,
  getListRows,
  hasManualOverride,
  seedRenumber,
  type NumberableRow,
} from './numbering';

function row(overrides: Partial<NumberableRow> & { id: string }): NumberableRow {
  return {
    address: '1 Main St',
    sale_date: '2024-01-01',
    list_order: null,
    current_number: null,
    ...overrides,
  };
}

describe('seedRenumber', () => {
  it('assigns 1..N with most recent sale_date first, across 10 distinct dates', () => {
    const rows: NumberableRow[] = [
      row({ id: 'a', sale_date: '2023-01-01' }),
      row({ id: 'b', sale_date: '2023-06-15' }),
      row({ id: 'c', sale_date: '2024-01-01' }),
      row({ id: 'd', sale_date: '2024-06-15' }),
      row({ id: 'e', sale_date: '2025-01-01' }),
      row({ id: 'f', sale_date: '2025-03-01' }),
      row({ id: 'g', sale_date: '2025-06-15' }),
      row({ id: 'h', sale_date: '2025-09-01' }),
      row({ id: 'i', sale_date: '2025-11-01' }),
      row({ id: 'j', sale_date: '2025-12-25' }),
    ];
    const result = seedRenumber(rows);
    const byId = new Map(result.map((r) => [r.id, r]));
    expect(byId.get('j')!.list_order).toBe(1); // most recent
    expect(byId.get('a')!.list_order).toBe(10); // oldest
    expect(byId.get('j')!.current_number).toBe(1);
    // strictly descending by original date order
    const orderedIds = result.map((r) => r.id);
    expect(orderedIds).toEqual(['j', 'i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);
  });

  it('tie-breaks same sale_date rows by address ascending', () => {
    const rows: NumberableRow[] = [
      row({ id: 'z', sale_date: '2025-01-01', address: 'Zebra Ave' }),
      row({ id: 'a', sale_date: '2025-01-01', address: 'Apple St' }),
      row({ id: 'm', sale_date: '2024-01-01', address: 'Middle Rd' }),
    ];
    const result = seedRenumber(rows);
    const orderedIds = result.map((r) => r.id);
    // both 'a' and 'z' share the most recent date -> address asc puts 'a' before 'z'
    expect(orderedIds).toEqual(['a', 'z', 'm']);
    expect(result.find((r) => r.id === 'a')!.list_order).toBe(1);
    expect(result.find((r) => r.id === 'z')!.list_order).toBe(2);
  });

  it('assigns sequential numbers with no gaps regardless of input size', () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row({ id: `p${i}`, sale_date: `2025-01-${String(i + 1).padStart(2, '0')}` }),
    );
    const result = seedRenumber(rows);
    expect(result.map((r) => r.list_order).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('applyManualReorder', () => {
  it('assigns sequential 1..N by array index regardless of prior list_order', () => {
    const rows: NumberableRow[] = [
      row({ id: 'a', list_order: 5, current_number: 5 }),
      row({ id: 'b', list_order: null, current_number: null }),
      row({ id: 'c', list_order: 1, current_number: 1 }),
    ];
    const result = applyManualReorder(rows);
    expect(result).toEqual([
      { id: 'a', list_order: 1, current_number: 1 },
      { id: 'b', list_order: 2, current_number: 2 },
      { id: 'c', list_order: 3, current_number: 3 },
    ]);
  });

  it('current_number always mirrors list_order', () => {
    const rows: NumberableRow[] = [row({ id: 'x' }), row({ id: 'y' })];
    const result = applyManualReorder(rows);
    for (const r of result) {
      expect(r.current_number).toBe(r.list_order);
    }
  });
});

describe('hasManualOverride', () => {
  it('is false when no rows have a list_order', () => {
    const rows: NumberableRow[] = [row({ id: 'a' }), row({ id: 'b' })];
    expect(hasManualOverride(rows)).toBe(false);
  });

  it('is true when at least one row has a non-null list_order', () => {
    const rows: NumberableRow[] = [row({ id: 'a' }), row({ id: 'b', list_order: 2 })];
    expect(hasManualOverride(rows)).toBe(true);
  });
});

describe('getListRows', () => {
  it('sorts by list_order ascending, unnumbered rows last', () => {
    const rows: NumberableRow[] = [
      row({ id: 'unnumbered', sale_date: '2025-06-01' }),
      row({ id: 'third', list_order: 3, sale_date: '2025-01-01' }),
      row({ id: 'first', list_order: 1, sale_date: '2025-01-01' }),
    ];
    const result = getListRows(rows);
    expect(result.map((r) => r.id)).toEqual(['first', 'third', 'unnumbered']);
  });

  it('tie-breaks unnumbered rows by sale_date descending', () => {
    const rows: NumberableRow[] = [
      row({ id: 'older', sale_date: '2024-01-01' }),
      row({ id: 'newer', sale_date: '2025-01-01' }),
    ];
    const result = getListRows(rows);
    expect(result.map((r) => r.id)).toEqual(['newer', 'older']);
  });
});
