import { useCallback, useEffect, useState } from 'react';
import {
  PROPERTY_VISIBILITY_STORAGE_KEY,
  parseHiddenIds,
  serializeHiddenIds,
} from '../lib/properties/visibility';

function readStoredHiddenIds(): Set<string> {
  try {
    return parseHiddenIds(sessionStorage.getItem(PROPERTY_VISIBILITY_STORAGE_KEY));
  } catch {
    return new Set();
  }
}

/**
 * Session-scoped per-property hide state. Persists in sessionStorage so a
 * refresh keeps toggles; not written to Supabase (see roadmap 10a / 10b).
 */
export function usePropertyVisibility() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(readStoredHiddenIds);

  useEffect(() => {
    try {
      sessionStorage.setItem(PROPERTY_VISIBILITY_STORAGE_KEY, serializeHiddenIds(hiddenIds));
    } catch {
      // Ignore quota / private-mode failures — in-memory state still works.
    }
  }, [hiddenIds]);

  const isHidden = useCallback((id: string) => hiddenIds.has(id), [hiddenIds]);

  const setHidden = useCallback((id: string, hidden: boolean) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (hidden) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hideMany = useCallback((ids: Iterable<string>) => {
    setHiddenIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  return { hiddenIds, isHidden, setHidden, toggleHidden, hideMany };
}
