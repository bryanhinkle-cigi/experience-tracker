import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigGate } from './components/layout/ConfigGate';
import { Header, type Screen } from './components/layout/Header';
import { MapWorkspaceScreen } from './components/map/MapWorkspaceScreen';
import { DataIntakeScreen } from './components/intake/DataIntakeScreen';
import { usePropertyVisibility } from './hooks/usePropertyVisibility';
import { findSupersededDuplicateIds } from './lib/properties/duplicateAddresses';
import { fetchAllProperties, bulkUpdateOrder } from './lib/supabase/properties';
import type { PropertyRow } from './lib/supabase/types';
import type { OrderAssignment } from './lib/numbering/numbering';

function AppShell() {
  const [screen, setScreen] = useState<Screen>('intake');
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const { hiddenIds, toggleHidden, hideMany } = usePropertyVisibility();

  const supersededDuplicateIds = useMemo(
    () => findSupersededDuplicateIds(properties),
    [properties],
  );

  const refreshProperties = useCallback(async (): Promise<PropertyRow[]> => {
    try {
      const rows = await fetchAllProperties();
      setProperties(rows);
      return rows;
    } catch (err) {
      console.error('Failed to load properties:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties]);

  /** After file import: hide older sales at duplicated addresses (keep most recent). */
  const handleImported = useCallback(async () => {
    const rows = await refreshProperties();
    hideMany(findSupersededDuplicateIds(rows));
  }, [refreshProperties, hideMany]);

  async function handleApplyOrderUpdates(updates: OrderAssignment[]) {
    const previous = properties;
    const byId = new Map(updates.map((u) => [u.id, u]));
    setProperties((prev) =>
      prev.map((p) => {
        const u = byId.get(p.id);
        return u ? { ...p, list_order: u.list_order, current_number: u.current_number } : p;
      }),
    );
    try {
      await bulkUpdateOrder(updates);
    } catch (err) {
      console.error('Failed to persist order update, rolling back:', err);
      setProperties(previous);
    }
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      <Header screen={screen} onNavigate={setScreen} propertyCount={properties.length} />
      {screen === 'intake' && (
        <DataIntakeScreen
          existingProperties={properties}
          hiddenIds={hiddenIds}
          supersededDuplicateIds={supersededDuplicateIds}
          onToggleHidden={toggleHidden}
          onPropertiesChanged={() => {
            void refreshProperties();
          }}
          onImported={handleImported}
          onGoToWorkspace={() => setScreen('workspace')}
        />
      )}
      {screen === 'workspace' && (
        <MapWorkspaceScreen
          properties={properties}
          hiddenIds={hiddenIds}
          supersededDuplicateIds={supersededDuplicateIds}
          onToggleHidden={toggleHidden}
          onApplyOrderUpdates={handleApplyOrderUpdates}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ConfigGate>
      <AppShell />
    </ConfigGate>
  );
}

export default App;
