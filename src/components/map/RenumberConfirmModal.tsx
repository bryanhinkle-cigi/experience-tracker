interface RenumberConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function RenumberConfirmModal({ onCancel, onConfirm }: RenumberConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,7,89,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', width: 420, padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-deep-blue)', marginBottom: 10 }}>
          Overwrite manual order?
        </div>
        <p style={{ margin: '0 0 22px', color: 'var(--color-fg)', fontSize: 13.5, lineHeight: 1.6 }}>
          Some properties in bounds have been manually reordered. Re-running auto-numbering will
          replace that order with the sale-recency sort.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            style={{
              background: 'transparent',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-fg)',
              padding: '9px 18px',
              borderRadius: 4,
              font: '600 13px var(--font-sans)',
              cursor: 'pointer',
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              background: 'var(--color-red)',
              border: 'none',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: 4,
              font: '600 13px var(--font-sans)',
              cursor: 'pointer',
            }}
            onClick={onConfirm}
          >
            Overwrite &amp; renumber
          </button>
        </div>
      </div>
    </div>
  );
}
