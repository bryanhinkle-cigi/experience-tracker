import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PropertyRow } from '../../lib/supabase/types';
import { PropertyListRow } from './PropertyListRow';
import { EmptyListState } from './EmptyListState';

interface PropertyListPanelProps {
  listRows: PropertyRow[];
  onDragEnd: (event: DragEndEvent) => void;
  onExportClick: () => void;
}

export function PropertyListPanel({ listRows, onDragEnd, onExportClick }: PropertyListPanelProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const isEmpty = listRows.length === 0;

  const exportBtnStyle: React.CSSProperties = {
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
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={listRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {listRows.map((row) => (
              <PropertyListRow key={row.id} property={row} />
            ))}
          </SortableContext>
        </DndContext>
        {isEmpty && <EmptyListState />}
      </div>
      <div style={{ padding: '16px 18px', borderTop: '1px solid var(--color-border)' }}>
        <button style={exportBtnStyle} disabled={isEmpty} onClick={onExportClick}>
          Export print-ready PDF
        </button>
      </div>
    </div>
  );
}
