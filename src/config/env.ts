export interface AppConfig {
  mapboxToken: string;
  mapboxStyleUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  defaultCenter: { lng: number; lat: number };
  defaultZoom: number;
}

function readNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config: AppConfig = {
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  mapboxStyleUrl: import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/light-v11',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  defaultCenter: {
    lng: readNumber(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG, -79.3832),
    lat: readNumber(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT, 43.6532),
  },
  defaultZoom: readNumber(import.meta.env.VITE_DEFAULT_MAP_ZOOM, 12),
};

export function isConfigValid(): boolean {
  return Boolean(config.mapboxToken && config.supabaseUrl && config.supabaseAnonKey);
}

export function missingConfigKeys(): string[] {
  const missing: string[] = [];
  if (!config.mapboxToken) missing.push('VITE_MAPBOX_TOKEN');
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  return missing;
}
