import type { PropertyRow } from '../supabase/types';
import type { RawImportRow } from '../parsers/types';

export type UpdatableField = 'building_name' | 'address' | 'sale_date';
export type FieldUpdateKind = 'fill' | 'extend';

export interface FieldUpdate {
  field: UpdatableField;
  kind: FieldUpdateKind;
  oldValue: string;
  newValue: string;
}

/** True if newValue looks like oldValue with more appended (e.g. "22 Adelaide" -> "22 Adelaide St W"). */
function isTextExtension(oldValue: string, newValue: string): boolean {
  const oldN = oldValue.trim().toLowerCase();
  const newN = newValue.trim().toLowerCase();
  return oldN.length > 0 && newN.length > oldN.length && newN.includes(oldN);
}

/**
 * Per spec: leave existing data alone unless a column that was empty is now
 * filled ("fill"), or the new value looks like a more-complete version of the
 * existing one ("extend", e.g. an address gaining a street suffix). Never
 * proposes overwriting a value with something that isn't a superset of it —
 * a changed-but-unrelated value (e.g. a corrected sale_date) is left alone,
 * consistent with the non-destructive re-upload behavior that was asked for.
 * lat/lng are excluded: they're required, non-extendable numeric fields.
 */
export function computeFieldUpdates(existing: PropertyRow, uploaded: RawImportRow): FieldUpdate[] {
  const updates: FieldUpdate[] = [];

  const existingName = existing.building_name ?? '';
  const uploadedName = uploaded.building_name ?? '';
  if (uploadedName.trim()) {
    if (!existingName.trim()) {
      updates.push({ field: 'building_name', kind: 'fill', oldValue: existingName, newValue: uploadedName });
    } else if (isTextExtension(existingName, uploadedName)) {
      updates.push({ field: 'building_name', kind: 'extend', oldValue: existingName, newValue: uploadedName });
    }
  }

  const existingAddress = existing.address ?? '';
  const uploadedAddress = uploaded.address ?? '';
  if (uploadedAddress.trim()) {
    if (!existingAddress.trim()) {
      updates.push({ field: 'address', kind: 'fill', oldValue: existingAddress, newValue: uploadedAddress });
    } else if (
      isTextExtension(existingAddress, uploadedAddress) &&
      existingAddress.trim().toLowerCase() !== uploadedAddress.trim().toLowerCase()
    ) {
      updates.push({ field: 'address', kind: 'extend', oldValue: existingAddress, newValue: uploadedAddress });
    }
  }

  const existingSaleDate = existing.sale_date ?? '';
  const uploadedSaleDate = uploaded.sale_date ?? '';
  if (uploadedSaleDate.trim() && !existingSaleDate.trim()) {
    updates.push({ field: 'sale_date', kind: 'fill', oldValue: existingSaleDate, newValue: uploadedSaleDate });
  }

  return updates;
}
