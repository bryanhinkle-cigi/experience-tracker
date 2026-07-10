import { normalizeAddress } from '../matching/addressMatch';

export interface AddressSaleRow {
  id: string;
  address: string;
  sale_date: string | null;
}

/**
 * Compare sale dates descending (most recent first). Null/invalid dates sort
 * last. Equal dates break ties by id for a stable keep/hide choice.
 */
export function compareSaleDateDesc(a: AddressSaleRow, b: AddressSaleRow): number {
  const aTime = saleDateSortKey(a.sale_date);
  const bTime = saleDateSortKey(b.sale_date);
  if (bTime !== aTime) return bTime - aTime;
  return a.id.localeCompare(b.id);
}

function saleDateSortKey(saleDate: string | null): number {
  if (!saleDate) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(saleDate);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/**
 * Buildings can sell more than once (same address, different sale dates).
 * Returns ids that are older sales at an address that has a more recent sale —
 * these should be auto-hidden on upload, not deleted.
 *
 * Grouping uses exact normalized address (same as intake exact-match), not
 * fuzzy substring matching, so "1 Main" and "100 Main" stay distinct.
 */
export function findSupersededDuplicateIds(properties: AddressSaleRow[]): Set<string> {
  const byAddress = new Map<string, AddressSaleRow[]>();
  for (const property of properties) {
    const key = normalizeAddress(property.address);
    if (!key) continue;
    const group = byAddress.get(key);
    if (group) group.push(property);
    else byAddress.set(key, [property]);
  }

  const superseded = new Set<string>();
  for (const group of byAddress.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(compareSaleDateDesc);
    for (let i = 1; i < sorted.length; i += 1) {
      superseded.add(sorted[i].id);
    }
  }
  return superseded;
}

/** True when this row is an older sale at a duplicated address and currently hidden. */
export function isDuplicateHidden(
  id: string,
  hiddenIds: ReadonlySet<string>,
  supersededDuplicateIds: ReadonlySet<string>,
): boolean {
  return hiddenIds.has(id) && supersededDuplicateIds.has(id);
}
