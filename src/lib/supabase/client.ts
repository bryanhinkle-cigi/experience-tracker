import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, isConfigValid } from '../../config/env';

let client: SupabaseClient | null = null;

/**
 * Returns null when Supabase env vars are missing so callers can no-op instead
 * of crash-looping before the user has pasted real credentials into .env.local.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isConfigValid()) return null;
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  return client;
}
