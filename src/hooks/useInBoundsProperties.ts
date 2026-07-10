import { useMemo } from 'react';
import { getPropertiesInBounds } from '../lib/geometry/containment';
import type { GeoPolygon } from '../types/domain';
import type { PropertyRow } from '../lib/supabase/types';

/**
 * boundsPolygon is only recomputed on moveend (see useBoundsBox), so this stays
 * cheap — containment isn't re-queried on every render tick during pan/zoom.
 */
export function useInBoundsProperties(properties: PropertyRow[], boundsPolygon: GeoPolygon | null) {
  return useMemo(() => getPropertiesInBounds(properties, boundsPolygon), [properties, boundsPolygon]);
}
