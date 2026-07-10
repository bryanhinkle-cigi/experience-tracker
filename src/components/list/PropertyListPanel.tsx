import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import { exportLegendCsv, exportLegendXlsx } from '../../lib/export/legendExport';
import type { PropertyRow } from '../../lib/supabase/types';
import { PropertyListRow } from './PropertyListRow';
import { EmptyListState } from './EmptyListState';

interface PropertyListPanelProps {
  listRows: PropertyRow[];
  hiddenInBoundsRows: PropertyRow[];
  supersededDuplicateIds: ReadonlySet<string>;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleHidden: (id: string) => void;
  onExportClick: () => void;
}

function SortablePropertyListRow({
  property,
  onToggleHidden,
}: {
  property: PropertyRow;
  onToggleHidden: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: property.id,
  });

  return (
    <PropertyListRow
      property={property}
      onToggleHidden={onToggleHidden}
      sortable={{
        setNodeRef,
        style: {
          transform: CSS.Transform.toString(transform),
          transition: transition ?? undefined,
        },
        attributes,
        listeners,
        isDragging,
      }}
    />
  );
}

export function PropertyListPanel({
  listRows,
  hiddenInBoundsRows,
  supersededDuplicateIds,
  onDragEnd,
  onToggleHidden,
  onExportClick,
}: PropertyListPanelProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const isEmpty = listRows.length === 0;

  const exportBtnStyle: CSSProperties = {
    width: '100%',
    border: 'none',
    padding: 12,
    borderRadius: 4,
    font: '600 14px var(--font-sans)',
    cursor: isEmpty ? 'not-allowed' : 'pointer',
    background: isEmpty ? 'var(--color-light-blue-grey)' : 'var(--color-dark-blue)',
    color: '#fff',
    opacity: isEmpty ? 0.6 : 1,
  };

  const legendBtnStyle: CSSProperties = {
    flex: 1,
    border: '1.5px solid var(--color-dark-blue)',
    padding: '9px 10px',
    borderRadius: 4,
    font: '600 12.5px var(--font-sans)',
    cursor: isEmpty ? 'not-allowed' : 'pointer',
    background: 'transparent',
    color: isEmpty ? 'var(--color-light-blue-grey)' : 'var(--color-dark-blue)',
    opacity: isEmpty ? 0.6 : 1,
  };

  return (
    <div
      style={{
        width: 380,
        flex: 'none',
        background: 'var(--color-white)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="type-label" style={{ color: 'var(--color-medium-blue)', marginBottom: 2 }}>
          In print bounds
        </div>
        <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--color-deep-blue)' }}>
          {listRows.length} properties
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-fg-muted)', marginTop: 2 }}>
          Drag rows to reorder — list order sets the final number
          {hiddenInBoundsRows.length > 0
            ? ` · ${hiddenInBoundsRows.length} hidden`
            : ''}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={listRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {listRows.map((row) => (
              <SortablePropertyListRow key={row.id} property={row} onToggleHidden={onToggleHidden} />
            ))}
          </SortableContext>
        </DndContext>
        {isEmpty && hiddenInBoundsRows.length === 0 && <EmptyListState />}
        {isEmpty && hiddenInBoundsRows.length > 0 && (
          <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--color-fg-muted)' }}>
            All in-bounds properties are hidden. Show one below to include it in numbering and export.
          </div>
        )}
        {hiddenInBoundsRows.length > 0 && (
          <div>
            <div
              style={{
                padding: '12px 18px 6px',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--color-fg-muted)',
                borderTop: listRows.length > 0 || isEmpty ? '1px solid var(--color-border)' : undefined,
              }}
            >
              Hidden ({hiddenInBoundsRows.length})
            </div>
            {hiddenInBoundsRows.map((row) => (
              <PropertyListRow
                key={row.id}
                property={row}
                hidden
                duplicateHidden={supersededDuplicateIds.has(row.id)}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          padding: '16px 18px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button style={exportBtnStyle} disabled={isEmpty} onClick={onExportClick}>
          Export print-ready PDF
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            style={legendBtnStyle}
            disabled={isEmpty}
            onClick={() => exportLegendCsv(listRows)}
            title="Download in-bounds list as CSV for InDesign / print legends"
          >
            Export CSV
          </button>
          <button
            type="button"
            style={legendBtnStyle}
            disabled={isEmpty}
            onClick={() => exportLegendXlsx(listRows)}
            title="Download in-bounds list as Excel for InDesign / print legends"
          >
            Export XLSX
          </button>
        </div>
      </div>
    </div>
  );
}
