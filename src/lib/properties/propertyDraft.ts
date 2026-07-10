import type { RawImportRow } from '../parsers/types';
import { validateRow } from '../parsers/validate';
import type { NewPropertyInput } from '../supabase/types';

/** Form strings for create/edit rows on the Data intake property table. */
export interface PropertyDraftFields {
  building_name: string;
  address: string;
  lat: string;
  lng: string;
  sale_date: string;
}

export const EMPTY_PROPERTY_DRAFT: PropertyDraftFields = {
  building_name: '',
  address: '',
  lat: '',
  lng: '',
  sale_date: '',
};

export function propertyToDraft(row: {
  building_name: string | null;
  address: string;
  lat: number;
  lng: number;
  sale_date: string | null;
}): PropertyDraftFields {
  return {
    building_name: row.building_name ?? '',
    address: row.address,
    lat: String(row.lat),
    lng: String(row.lng),
    sale_date: row.sale_date ?? '',
  };
}

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function draftToRawImportRow(draft: PropertyDraftFields): RawImportRow {
  return {
    building_name: draft.building_name.trim(),
    address: draft.address,
    lat: parseCoordinate(draft.lat),
    lng: parseCoordinate(draft.lng),
    sale_date: draft.sale_date.trim(),
  };
}

/**
 * Validates a draft with the same rules as file intake. On success returns a
 * NewPropertyInput ready for insert/update; on failure returns field errors.
 */
export function validatePropertyDraft(
  draft: PropertyDraftFields,
): { ok: true; value: NewPropertyInput } | { ok: false; errors: string[] } {
  const validated = validateRow(draftToRawImportRow(draft));
  if (!validated.isValid) {
    return { ok: false, errors: validated.errors.map((e) => e.message) };
  }
  return {
    ok: true,
    value: {
      building_name: validated.building_name || null,
      address: validated.address.trim(),
      lat: validated.lat as number,
      lng: validated.lng as number,
      sale_date: validated.sale_date,
    },
  };
}
