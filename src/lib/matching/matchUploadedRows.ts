import type { PropertyRow } from '../supabase/types';
import type { RawImportRow } from '../parsers/types';
import { addressesMatch, isExactAddressMatch } from './addressMatch';
import { computeFieldUpdates, type FieldUpdate } from './diffProperties';

export interface MatchedRow {
  kind: 'matched';
  uploadedRow: RawImportRow;
  existing: PropertyRow;
  isExactMatch: boolean;
  updates: FieldUpdate[];
}

export interface NewRow {
  kind: 'new';
  uploadedRow: RawImportRow;
}

export type RowMatchResult = MatchedRow | NewRow;

/**
 * Matches each uploaded row against existing properties by fuzzy address.
 * When multiple existing properties fuzzy-match the same uploaded address
 * (rare — e.g. "1 Main St" and "100 Main St" both containing "1 Main St"),
 * this takes the first candidate; the exact-match flag and the per-row
 * confirmation step downstream are what catch a wrong pick, not this
 * function trying to disambiguate further.
 */
export function matchUploadedRows(uploadedRows: RawImportRow[], existingProperties: PropertyRow[]): RowMatchResult[] {
  return uploadedRows.map((uploadedRow): RowMatchResult => {
    const candidate = existingProperties.find((p) => addressesMatch(p.address, uploadedRow.address));
    if (!candidate) {
      return { kind: 'new', uploadedRow };
    }
    return {
      kind: 'matched',
      uploadedRow,
      existing: candidate,
      isExactMatch: isExactAddressMatch(candidate.address, uploadedRow.address),
      updates: computeFieldUpdates(candidate, uploadedRow),
    };
  });
}
