import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { VisibilityToggle } from '../common/VisibilityToggle';
import {
  EMPTY_PROPERTY_DRAFT,
  propertyToDraft,
  validatePropertyDraft,
  type PropertyDraftFields,
} from '../../lib/properties/propertyDraft';
import { bulkInsertProperties, updatePropertyRecord } from '../../lib/supabase/properties';
import type { PropertyRow } from '../../lib/supabase/types';

const thStyle: CSSProperties = {
  background: 'var(--color-dark-blue)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '9px 12px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--color-border)',
  borderRadius: 3,
  padding: '5px 8px',
  font: '12.5px var(--font-sans)',
  color: 'var(--color-fg)',
  background: '#fff',
};

const linkBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--color-medium-blue)',
  font: '600 12px var(--font-sans)',
  cursor: 'pointer',
  padding: '2px 4px',
};

interface IntakePropertyTableProps {
  properties: PropertyRow[];
  hiddenIds: ReadonlySet<string>;
  supersededDuplicateIds: ReadonlySet<string>;
  onToggleHidden: (id: string) => void;
  onChanged: () => void;
}

export function IntakePropertyTable({
  properties,
  hiddenIds,
  supersededDuplicateIds,
  onToggleHidden,
  onChanged,
}: IntakePropertyTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PropertyDraftFields>(EMPTY_PROPERTY_DRAFT);
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<PropertyDraftFields>(EMPTY_PROPERTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...properties].sort((a, b) =>
        a.address.localeCompare(b.address, undefined, { sensitivity: 'base' }),
      ),
    [properties],
  );

  function startEdit(row: PropertyRow) {
    setAdding(false);
    setEditingId(row.id);
    setDraft(propertyToDraft(row));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_PROPERTY_DRAFT);
    setError(null);
  }

  function startAdd() {
    setEditingId(null);
    setAdding(true);
    setAddDraft(EMPTY_PROPERTY_DRAFT);
    setError(null);
  }

  function cancelAdd() {
    setAdding(false);
    setAddDraft(EMPTY_PROPERTY_DRAFT);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    const result = validatePropertyDraft(draft);
    if (!result.ok) {
      setError(result.errors.join(' · '));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePropertyRecord(editingId, result.value);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSaving(false);
    }
  }

  async function saveAdd() {
    const result = validatePropertyDraft(addDraft);
    if (!result.ok) {
      setError(result.errors.join(' · '));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await bulkInsertProperties([result.value]);
      setAdding(false);
      setAddDraft(EMPTY_PROPERTY_DRAFT);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add property');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-deep-blue)' }}>
            All properties
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-fg-muted)', marginTop: 2 }}>
            {properties.length} loaded
            {hiddenIds.size > 0 ? ` · ${hiddenIds.size} hidden on map` : ''}
            {supersededDuplicateIds.size > 0
              ? ` · ${supersededDuplicateIds.size} older duplicate sale${supersededDuplicateIds.size === 1 ? '' : 's'}`
              : ''}
            {' · '}
            edit inline or add without uploading a file
          </div>
        </div>
        <button
          type="button"
          onClick={startAdd}
          disabled={adding || saving}
          style={{
            border: 'none',
            padding: '8px 16px',
            borderRadius: 4,
            font: '600 12.5px var(--font-sans)',
            cursor: adding || saving ? 'not-allowed' : 'pointer',
            background: 'var(--color-dark-blue)',
            color: '#fff',
            opacity: adding || saving ? 0.6 : 1,
            flex: 'none',
          }}
        >
          Add property
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(237,27,52,0.08)',
            color: 'var(--color-red)',
            padding: '8px 16px',
            fontSize: 12.5,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 40 }}></th>
              <th style={thStyle}>Building</th>
              <th style={thStyle}>Address</th>
              <th style={{ ...thStyle, width: 88 }}>Lat</th>
              <th style={{ ...thStyle, width: 88 }}>Lng</th>
              <th style={{ ...thStyle, width: 110 }}>Sale date</th>
              <th style={{ ...thStyle, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <DraftRow
                draft={addDraft}
                onChange={setAddDraft}
                onSave={saveAdd}
                onCancel={cancelAdd}
                saving={saving}
                saveLabel="Save"
              />
            )}
            {sorted.length === 0 && !adding && (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-fg-muted)' }}
                >
                  No properties loaded yet. Add one above or upload a file below.
                </td>
              </tr>
            )}
            {sorted.map((row, i) => {
              const isHidden = hiddenIds.has(row.id);
              const isSupersededDuplicate = supersededDuplicateIds.has(row.id);
              const isEditing = editingId === row.id;
              if (isEditing) {
                return (
                  <DraftRow
                    key={row.id}
                    draft={draft}
                    onChange={setDraft}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    saving={saving}
                    saveLabel="Save"
                  />
                );
              }
              const rowStyle: CSSProperties = {
                background: isSupersededDuplicate
                  ? 'rgba(255, 212, 0, 0.28)'
                  : isHidden
                    ? 'var(--color-bg-subtle)'
                    : i % 2
                      ? 'rgba(219,229,255,0.3)'
                      : undefined,
                opacity: isHidden && !isSupersededDuplicate ? 0.72 : 1,
              };
              const tdStyle: CSSProperties = {
                padding: '8px 12px',
                color: 'var(--color-fg)',
                borderBottom: '0.5px solid var(--color-border)',
                verticalAlign: 'middle',
              };
              return (
                <tr
                  key={row.id}
                  style={rowStyle}
                  title={
                    isSupersededDuplicate
                      ? 'Older sale at this address — a more recent sale exists'
                      : undefined
                  }
                >
                  <td style={tdStyle}>
                    <VisibilityToggle hidden={isHidden} onClick={() => onToggleHidden(row.id)} />
                  </td>
                  <td style={tdStyle}>{row.building_name || '—'}</td>
                  <td style={tdStyle}>{row.address}</td>
                  <td style={tdStyle}>{row.lat}</td>
                  <td style={tdStyle}>{row.lng}</td>
                  <td style={tdStyle}>{row.sale_date ?? '—'}</td>
                  <td style={tdStyle}>
                    <button type="button" style={linkBtnStyle} onClick={() => startEdit(row)} disabled={saving}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DraftRow({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  saveLabel,
}: {
  draft: PropertyDraftFields;
  onChange: (next: PropertyDraftFields) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  const tdStyle: CSSProperties = {
    padding: '6px 8px',
    borderBottom: '0.5px solid var(--color-border)',
    background: 'rgba(195,230,255,0.35)',
    verticalAlign: 'middle',
  };

  function setField<K extends keyof PropertyDraftFields>(key: K, value: string) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <tr>
      <td style={tdStyle} />
      <td style={tdStyle}>
        <input
          style={inputStyle}
          value={draft.building_name}
          placeholder="Optional"
          onChange={(e) => setField('building_name', e.target.value)}
        />
      </td>
      <td style={tdStyle}>
        <input
          style={inputStyle}
          value={draft.address}
          placeholder="Address"
          onChange={(e) => setField('address', e.target.value)}
        />
      </td>
      <td style={tdStyle}>
        <input
          style={inputStyle}
          value={draft.lat}
          placeholder="Lat"
          onChange={(e) => setField('lat', e.target.value)}
        />
      </td>
      <td style={tdStyle}>
        <input
          style={inputStyle}
          value={draft.lng}
          placeholder="Lng"
          onChange={(e) => setField('lng', e.target.value)}
        />
      </td>
      <td style={tdStyle}>
        <input
          style={inputStyle}
          value={draft.sale_date}
          placeholder="YYYY-MM-DD"
          onChange={(e) => setField('sale_date', e.target.value)}
        />
      </td>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        <button type="button" style={linkBtnStyle} onClick={onSave} disabled={saving}>
          {saving ? '…' : saveLabel}
        </button>
        <button type="button" style={{ ...linkBtnStyle, color: 'var(--color-fg-muted)' }} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </td>
    </tr>
  );
}
