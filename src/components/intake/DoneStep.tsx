interface DoneStepProps {
  count: number;
  updatedCount?: number;
  onGoToWorkspace: () => void;
}

export function DoneStep({ count, updatedCount = 0, onGoToWorkspace }: DoneStepProps) {
  return (
    <div
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 48,
        textAlign: 'center',
        animation: 'fadeUp 0.25s ease',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: 'var(--color-pale-blue)',
          color: 'var(--color-dark-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 24,
        }}
      >
        &#10003;
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--color-deep-blue)', marginBottom: 6 }}>
        {count} propert{count === 1 ? 'y' : 'ies'} added
        {updatedCount > 0 ? `, ${updatedCount} updated` : ''}
      </div>
      <p style={{ color: 'var(--color-fg-muted)', margin: '0 0 22px' }}>
        Rows without a sale date were excluded, per intake validation rules.
        {updatedCount > 0 ? ' Matched properties were updated only where you confirmed changes.' : ''}
      </p>
      <button
        style={{
          background: 'var(--color-medium-blue)',
          color: '#fff',
          border: 'none',
          padding: '11px 26px',
          borderRadius: 4,
          font: '600 14px var(--font-sans)',
          cursor: 'pointer',
        }}
        onClick={onGoToWorkspace}
      >
        Go to map workspace &rarr;
      </button>
    </div>
  );
}
