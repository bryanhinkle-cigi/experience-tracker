import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PropertyRow } from '../../lib/supabase/types';

interface PropertyListRowProps {
  property: PropertyRow;
}

export function PropertyListRow({ property }: PropertyListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: property.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)',
    background: isDragging ? 'var(--color-pale-blue-grey)' : '#fff',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          flex: 'none',
          width: 26,
          height: 26,
          borderRadius: 999,
          background: 'var(--color-dark-blue)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {property.current_number ?? ''}
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
      <div
        {...attributes}
        {...listeners}
        style={{ flex: 'none', color: 'var(--color-light-blue-grey)', fontSize: 15, cursor: 'grab', paddingLeft: 4 }}
      >
        &#8942;&#8942;
      </div>
    </div>
  );
}
