import type { DraggableAttributes } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { PropertyRow } from '../../lib/supabase/types';
import { VisibilityToggle } from '../common/VisibilityToggle';

interface PropertyListRowProps {
  property: PropertyRow;
  /** When true, row is in the hidden section — not sortable. */
  hidden?: boolean;
  /** Older sale at a duplicated address, currently hidden — yellow highlight. */
  duplicateHidden?: boolean;
  onToggleHidden: (id: string) => void;
  /** Sortable wiring from parent when this is a visible/draggable row. */
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    attributes: DraggableAttributes;
    listeners: object | undefined;
    isDragging: boolean;
  };
}

export function PropertyListRow({
  property,
  hidden = false,
  duplicateHidden = false,
  onToggleHidden,
  sortable,
}: PropertyListRowProps) {
  const style: CSSProperties = {
    ...(sortable?.style ?? {}),
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)',
    background: sortable?.isDragging
      ? 'var(--color-pale-blue-grey)'
      : duplicateHidden
        ? 'rgba(255, 212, 0, 0.28)'
        : hidden
          ? 'var(--color-bg-subtle)'
          : '#fff',
    opacity: hidden && !duplicateHidden ? 0.72 : 1,
  };

  return (
    <div ref={sortable?.setNodeRef} style={style}>
      <div
        style={{
          flex: 'none',
          width: 26,
          height: 26,
          borderRadius: 999,
          background: hidden ? 'var(--color-light-blue-grey)' : 'var(--color-dark-blue)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {hidden ? '—' : (property.current_number ?? '')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-deep-blue)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {property.building_name || '—'}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--color-fg-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {property.address}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-fg-muted)', flex: 'none', textAlign: 'right' }}>
        {property.sale_date?.slice(2) ?? ''}
      </div>
      <VisibilityToggle hidden={hidden} onClick={() => onToggleHidden(property.id)} />
      {sortable && (
        <div
          {...sortable.attributes}
          {...sortable.listeners}
          style={{ flex: 'none', color: 'var(--color-light-blue-grey)', fontSize: 15, cursor: 'grab', paddingLeft: 2 }}
        >
          &#8942;&#8942;
        </div>
      )}
    </div>
  );
}
