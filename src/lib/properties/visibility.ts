import type { PropertyRow } from '../supabase/types';

export const PROPERTY_VISIBILITY_STORAGE_KEY = 'property-visibility-v1';

/** Returns properties that are not in the hidden set. */
export function filterVisibleProperties(
  properties: PropertyRow[],
  hiddenIds: ReadonlySet<string>,
): PropertyRow[] {
  if (hiddenIds.size === 0) return properties;
  return properties.filter((p) => !hiddenIds.has(p.id));
}

export function partitionByVisibility<T extends { id: string }>(
  rows: T[],
  hiddenIds: ReadonlySet<string>,
): { visible: T[]; hidden: T[] } {
  if (hiddenIds.size === 0) return { visible: rows, hidden: [] };
  const visible: T[] = [];
  const hidden: T[] = [];
  for (const row of rows) {
    (hiddenIds.has(row.id) ? hidden : visible).push(row);
  }
  return { visible, hidden };
}

export function parseHiddenIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function serializeHiddenIds(hiddenIds: ReadonlySet<string>): string {
  return JSON.stringify([...hiddenIds]);
}
