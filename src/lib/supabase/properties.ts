import { getSupabaseClient } from './client';
import type { NewPropertyInput, OrderUpdate, PropertyRow } from './types';
import type { UpdatableField } from '../matching/diffProperties';

export async function fetchAllProperties(): Promise<PropertyRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('properties').select('*');
  if (error) throw error;
  return data as PropertyRow[];
}

export async function bulkInsertProperties(rows: NewPropertyInput[]): Promise<PropertyRow[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');
  if (rows.length === 0) return [];
  const { data, error } = await client.from('properties').insert(rows).select();
  if (error) throw error;
  return data as PropertyRow[];
}

/**
 * Applies a user-confirmed set of field-level updates (see MatchReviewStep)
 * to an existing property — only the fields present in `fields` are touched,
 * matching bulkUpdateOrder's targeted-update pattern below.
 */
export async function updatePropertyFields(
  id: string,
  fields: Partial<Record<UpdatableField, string>>,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');
  if (Object.keys(fields).length === 0) return;
  const { error } = await client.from('properties').update(fields).eq('id', id);
  if (error) throw error;
}

/** Editable columns for the Data intake property table (includes lat/lng). */
export type PropertyRecordUpdate = Partial<{
  building_name: string | null;
  address: string;
  lat: number;
  lng: number;
  sale_date: string;
}>;

/**
 * Full-record field update for inline create/edit on Data intake. Unlike
 * match-review updates, this may change lat/lng when the user edits them.
 */
export async function updatePropertyRecord(id: string, fields: PropertyRecordUpdate): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');
  if (Object.keys(fields).length === 0) return;
  const { error } = await client.from('properties').update(fields).eq('id', id);
  if (error) throw error;
}

/**
 * Targeted per-row updates rather than a single upsert — upsert's default
 * null-fill behavior would clobber columns not present in the update payload.
 */
export async function bulkUpdateOrder(updates: OrderUpdate[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');
  await Promise.all(
    updates.map(({ id, list_order, current_number }) =>
      client
        .from('properties')
        .update({ list_order, current_number })
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
}
