import { config } from '../../config/env';

export type MapStyleMode = 'standard' | 'satellite';

/**
 * "standard" resolves to whatever the user configured via
 * VITE_MAPBOX_STYLE_URL (default light-v11) rather than a hardcoded style, so
 * the satellite toggle layers on top of the existing default instead of
 * overriding it.
 */
export const MAP_STYLE_URLS: Record<MapStyleMode, string> = {
  standard: config.mapboxStyleUrl,
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};
