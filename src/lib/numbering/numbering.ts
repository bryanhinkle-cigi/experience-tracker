export interface NumberableRow {
  id: string;
  address: string;
  // Nullable at the DB layer (see supabase/migrations/0001_create_properties.sql);
  // app-layer intake validation guarantees it's set before insert, but the type
  // here stays honest about the schema rather than asserting it away.
  sale_date: string | null; // ISO date (YYYY-MM-DD)
  list_order: number | null;
  current_number: number | null;
}

export interface OrderAssignment {
  id: string;
  list_order: number;
  current_number: number;
}

/**
 * Sort by sale_date DESC (most recent sale = 1), tie-break by address ASC.
 * Assigns sequential 1..N. This is the "seed" behavior for the renumber button.
 */
export function seedRenumber(rows: NumberableRow[]): OrderAssignment[] {
  const sorted = [...rows].sort((a, b) => {
    const aDate = a.sale_date ?? '';
    const bDate = b.sale_date ?? '';
    if (aDate !== bDate) return aDate > bDate ? -1 : 1;
    return a.address.localeCompare(b.address);
  });
  return sorted.map((row, i) => ({ id: row.id, list_order: i + 1, current_number: i + 1 }));
}

/**
 * Given rows already in the user's desired final order (e.g. post drag-and-drop),
 * assign sequential 1..N by array index. list_order is the single source of truth
 * that current_number is derived from.
 */
export function applyManualReorder(orderedRows: NumberableRow[]): OrderAssignment[] {
  return orderedRows.map((row, i) => ({ id: row.id, list_order: i + 1, current_number: i + 1 }));
}

/**
 * True if any row already has a non-null list_order — gates the overwrite-confirm
 * modal before seedRenumber would wipe a prior manual adjustment.
 */
export function hasManualOverride(rows: NumberableRow[]): boolean {
  return rows.some((row) => row.list_order != null);
}

/**
 * Display order for the property list: by list_order ascending (unnumbered rows
 * last), tie-broken by sale_date descending — mirrors the reference prototype's
 * getListRows behavior.
 */
export function getListRows<T extends NumberableRow>(inBoundsRows: T[]): T[] {
  return [...inBoundsRows].sort((a, b) => {
    const ao = a.list_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.list_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return (b.sale_date ?? '').localeCompare(a.sale_date ?? '');
  });
}
