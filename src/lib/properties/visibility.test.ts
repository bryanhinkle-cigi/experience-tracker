import { describe, expect, it } from 'vitest';
import {
  filterVisibleProperties,
  parseHiddenIds,
  partitionByVisibility,
  serializeHiddenIds,
} from './visibility';
import type { PropertyRow } from '../supabase/types';

function row(id: string): PropertyRow {
  return {
    id,
    building_name: null,
    address: `${id} St`,
    lat: 0,
    lng: 0,
    sale_date: '2024-01-01',
    current_number: null,
    list_order: null,
    created_at: '2024-01-01T00:00:00Z',
  };
}

describe('filterVisibleProperties', () => {
  it('returns all rows when nothing is hidden', () => {
    const rows = [row('a'), row('b')];
    expect(filterVisibleProperties(rows, new Set())).toEqual(rows);
  });

  it('excludes hidden ids', () => {
    const rows = [row('a'), row('b'), row('c')];
    expect(filterVisibleProperties(rows, new Set(['b'])).map((r) => r.id)).toEqual(['a', 'c']);
  });
});

describe('partitionByVisibility', () => {
  it('splits visible and hidden while preserving order', () => {
    const rows = [row('a'), row('b'), row('c')];
    expect(partitionByVisibility(rows, new Set(['b']))).toEqual({
      visible: [rows[0], rows[2]],
      hidden: [rows[1]],
    });
  });
});

describe('hidden id serialization', () => {
  it('round-trips through JSON', () => {
    const ids = new Set(['x', 'y']);
    expect(parseHiddenIds(serializeHiddenIds(ids))).toEqual(ids);
  });

  it('returns empty set for invalid storage payloads', () => {
    expect(parseHiddenIds(null).size).toBe(0);
    expect(parseHiddenIds('not-json').size).toBe(0);
    expect(parseHiddenIds('{"a":1}').size).toBe(0);
  });
});
