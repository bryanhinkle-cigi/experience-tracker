import { useCallback, useEffect, useState } from 'react';
import { ConfigGate } from './components/layout/ConfigGate';
import { Header, type Screen } from './components/layout/Header';
import { MapWorkspaceScreen } from './components/map/MapWorkspaceScreen';
import { DataIntakeScreen } from './components/intake/DataIntakeScreen';
import { fetchAllProperties, bulkUpdateOrder } from './lib/supabase/properties';
import type { PropertyRow } from './lib/supabase/types';
import type { OrderAssignment } from './lib/numbering/numbering';

function AppShell() {
  const [screen, setScreen] = useState<Screen>('intake');
  const [properties, setProperties] = useState<PropertyRow[]>([]);

  const refreshProperties = useCallback(() => {
    fetchAllProperties()
      .then(setProperties)
      .catch((err) => console.error('Failed to load properties:', err));
  }, []);

  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

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
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      <Header screen={screen} onNavigate={setScreen} propertyCount={properties.length} />
      {screen === 'intake' && (
        <DataIntakeScreen
          existingProperties={properties}
          onImported={refreshProperties}
          onGoToWorkspace={() => setScreen('workspace')}
        />
      )}
      {screen === 'workspace' && (
        <MapWorkspaceScreen properties={properties} onApplyOrderUpdates={handleApplyOrderUpdates} />
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
