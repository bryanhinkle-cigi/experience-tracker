import { describe, expect, it } from 'vitest';
import { addressesMatch, isExactAddressMatch, normalizeAddress } from './addressMatch';
import { computeFieldUpdates } from './diffProperties';
import { matchUploadedRows } from './matchUploadedRows';
import type { PropertyRow } from '../supabase/types';
import type { RawImportRow } from '../parsers/types';

function property(overrides: Partial<PropertyRow> & { id: string }): PropertyRow {
  return {
    building_name: null,
    address: '1 Main St',
    lat: 43.65,
    lng: -79.38,
    sale_date: null,
    current_number: null,
    list_order: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function importRow(overrides: Partial<RawImportRow> = {}): RawImportRow {
  return {
    building_name: '',
    address: '1 Main St',
    lat: 43.65,
    lng: -79.38,
    sale_date: '',
    ...overrides,
  };
}

describe('normalizeAddress / addressesMatch', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeAddress('  22   Adelaide St W  ')).toBe('22 adelaide st w');
  });

  it('matches identical addresses after normalization', () => {
    expect(addressesMatch('22 Adelaide St W', '22   ADELAIDE st w')).toBe(true);
    expect(isExactAddressMatch('22 Adelaide St W', '22   ADELAIDE st w')).toBe(true);
  });

  it('fuzzy-matches when one address is a superset of the other', () => {
    expect(addressesMatch('22 Adelaide', '22 Adelaide St W')).toBe(true);
    expect(isExactAddressMatch('22 Adelaide', '22 Adelaide St W')).toBe(false);
  });

  it('does not match unrelated addresses', () => {
    expect(addressesMatch('22 Adelaide St W', '100 King St W')).toBe(false);
  });

  it('does not match empty strings', () => {
    expect(addressesMatch('', '')).toBe(false);
  });
});

describe('computeFieldUpdates', () => {
  it('proposes fill for empty existing fields', () => {
    const existing = property({ id: '1', building_name: null, sale_date: null });
    const uploaded = importRow({ building_name: 'Bay Adelaide East', sale_date: '2025-01-01' });
    const updates = computeFieldUpdates(existing, uploaded);
    expect(updates).toContainEqual({
      field: 'building_name',
      kind: 'fill',
      oldValue: '',
      newValue: 'Bay Adelaide East',
    });
    expect(updates).toContainEqual({
      field: 'sale_date',
      kind: 'fill',
      oldValue: '',
      newValue: '2025-01-01',
    });
  });

  it('proposes extend when the new value is a superset of the existing one', () => {
    const existing = property({ id: '1', address: '22 Adelaide' });
    const uploaded = importRow({ address: '22 Adelaide St W' });
    const updates = computeFieldUpdates(existing, uploaded);
    expect(updates).toContainEqual({
      field: 'address',
      kind: 'extend',
      oldValue: '22 Adelaide',
      newValue: '22 Adelaide St W',
    });
  });

  it('does not propose an update for an unrelated changed value (not empty, not an extension)', () => {
    const existing = property({ id: '1', sale_date: '2024-01-01' });
    const uploaded = importRow({ sale_date: '2025-06-01' });
    expect(computeFieldUpdates(existing, uploaded)).toEqual([]);
  });

  it('does not propose an update when values are identical', () => {
    const existing = property({ id: '1', building_name: 'Bay Adelaide East' });
    const uploaded = importRow({ building_name: 'Bay Adelaide East' });
    expect(computeFieldUpdates(existing, uploaded)).toEqual([]);
  });

  it('never proposes updates to lat/lng', () => {
    const existing = property({ id: '1', lat: 1, lng: 2 });
    const uploaded = importRow({ lat: 99, lng: 99 });
    const updates = computeFieldUpdates(existing, uploaded);
    expect(updates.some((u) => (u.field as string) === 'lat' || (u.field as string) === 'lng')).toBe(false);
  });
});

describe('matchUploadedRows', () => {
  it('classifies rows with no address match as new', () => {
    const existing = [property({ id: '1', address: '1 Main St' })];
    const uploaded = [importRow({ address: '999 Other Ave' })];
    const [result] = matchUploadedRows(uploaded, existing);
    expect(result.kind).toBe('new');
  });

  it('classifies rows with an exact address match, with no proposed updates when nothing changed', () => {
    const existing = [property({ id: '1', address: '1 Main St', building_name: 'Existing Co' })];
    const uploaded = [importRow({ address: '1 Main St', building_name: 'Existing Co' })];
    const [result] = matchUploadedRows(uploaded, existing);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.isExactMatch).toBe(true);
      expect(result.updates).toEqual([]);
    }
  });

  it('flags fuzzy (non-exact) matches distinctly from exact matches', () => {
    const existing = [property({ id: '1', address: '22 Adelaide' })];
    const uploaded = [importRow({ address: '22 Adelaide St W' })];
    const [result] = matchUploadedRows(uploaded, existing);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.isExactMatch).toBe(false);
      expect(result.updates.map((u) => u.field)).toContain('address');
    }
  });
});
