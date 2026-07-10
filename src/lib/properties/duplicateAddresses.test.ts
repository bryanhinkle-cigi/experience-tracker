import { describe, expect, it } from 'vitest';
import {
  compareSaleDateDesc,
  findSupersededDuplicateIds,
  isDuplicateHidden,
} from './duplicateAddresses';

describe('findSupersededDuplicateIds', () => {
  it('returns empty when every address is unique', () => {
    expect(
      findSupersededDuplicateIds([
        { id: 'a', address: '1 Main St', sale_date: '2024-01-01' },
        { id: 'b', address: '2 Main St', sale_date: '2023-01-01' },
      ]).size,
    ).toBe(0);
  });

  it('hides older sales at the same normalized address, keeps the most recent', () => {
    const superseded = findSupersededDuplicateIds([
      { id: 'old', address: '22 Adelaide St W', sale_date: '2019-06-01' },
      { id: 'new', address: '22 Adelaide St W', sale_date: '2024-03-15' },
      { id: 'mid', address: '  22  ADELAIDE ST W ', sale_date: '2021-01-01' },
    ]);
    expect([...superseded].sort()).toEqual(['mid', 'old']);
    expect(superseded.has('new')).toBe(false);
  });

  it('does not treat fuzzy-similar addresses as duplicates', () => {
    const superseded = findSupersededDuplicateIds([
      { id: 'a', address: '1 Main St', sale_date: '2024-01-01' },
      { id: 'b', address: '100 Main St', sale_date: '2023-01-01' },
    ]);
    expect(superseded.size).toBe(0);
  });

  it('keeps one row when sale dates tie, hides the rest', () => {
    const superseded = findSupersededDuplicateIds([
      { id: 'b', address: '9 King', sale_date: '2024-01-01' },
      { id: 'a', address: '9 King', sale_date: '2024-01-01' },
    ]);
    expect(superseded.size).toBe(1);
    expect(superseded.has('b')).toBe(true); // id 'a' sorts first on tie → kept
  });
});

describe('compareSaleDateDesc', () => {
  it('sorts null sale dates after dated rows', () => {
    const rows = [
      { id: 'n', address: 'x', sale_date: null },
      { id: 'd', address: 'x', sale_date: '2020-01-01' },
    ];
    expect([...rows].sort(compareSaleDateDesc).map((r) => r.id)).toEqual(['d', 'n']);
  });
});

describe('isDuplicateHidden', () => {
  it('is true only when both superseded and hidden', () => {
    const superseded = new Set(['a']);
    expect(isDuplicateHidden('a', new Set(['a']), superseded)).toBe(true);
    expect(isDuplicateHidden('a', new Set(), superseded)).toBe(false);
    expect(isDuplicateHidden('b', new Set(['b']), superseded)).toBe(false);
  });
});
