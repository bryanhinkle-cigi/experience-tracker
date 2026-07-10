import type { ValidatedRow } from '../../lib/parsers/types';

const thStyle: React.CSSProperties = {
  background: 'var(--color-dark-blue)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '9px 16px',
  textAlign: 'left',
};

interface PreviewStepProps {
  fileName: string;
  rows: ValidatedRow[];
  onRemoveInvalid: () => void;
  onConfirmImport: () => void;
}

export function PreviewStep({ fileName, rows, onRemoveInvalid, onConfirmImport }: PreviewStepProps) {
  const errorCount = rows.filter((r) => !r.isValid).length;
  const validCount = rows.length - errorCount;

  const confirmImportStyle: React.CSSProperties = {
    border: 'none',
    padding: '8px 18px',
    borderRadius: 4,
    font: '600 12.5px var(--font-sans)',
    cursor: errorCount > 0 ? 'not-allowed' : 'pointer',
    background: errorCount > 0 ? 'var(--color-light-blue-grey)' : 'var(--color-medium-blue)',
    color: '#fff',
    opacity: errorCount > 0 ? 0.6 : 1,
  };

  return (
    <div
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        animation: 'fadeUp 0.25s ease',
      }}
    >
      <div
        style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-deep-blue)' }}>{fileName}</div>
          <div style={{ fontSize: 12, color: 'var(--color-fg-muted)', marginTop: 2 }}>
            {rows.length} rows parsed &middot;{' '}
            <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>{errorCount} need attention</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              background: 'transparent',
              color: 'var(--color-dark-blue)',
              border: '1.5px solid var(--color-dark-blue)',
              padding: '8px 16px',
              borderRadius: 4,
              font: '600 12.5px var(--font-sans)',
              cursor: 'pointer',
            }}
            onClick={onRemoveInvalid}
          >
            Remove invalid rows
          </button>
          <button style={confirmImportStyle} disabled={errorCount > 0} onClick={onConfirmImport}>
            Confirm &amp; import {validCount}
          </button>
        </div>
      </div>
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={thStyle}>Building</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Sale date</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const invalid = !row.isValid;
              const rowStyle: React.CSSProperties = {
                background: invalid
                  ? 'rgba(237,27,52,0.06)'
                  : i % 2
                    ? 'rgba(219,229,255,0.3)'
                    : undefined,
              };
              const tdStyle: React.CSSProperties = {
                padding: '9px 16px',
                color: invalid ? 'var(--color-red)' : 'var(--color-fg)',
                borderBottom: '0.5px solid var(--color-border)',
              };
              const statusStyle: React.CSSProperties = invalid
                ? {
                    background: 'rgba(237,27,52,0.12)',
                    color: 'var(--color-red)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 999,
                  }
                : {
                    background: 'rgba(42,182,169,0.12)',
                    color: '#1c8f84',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 999,
                  };
              return (
                <tr key={i} style={rowStyle}>
                  <td style={tdStyle}>{row.building_name || '—'}</td>
                  <td style={tdStyle}>{row.address || '—'}</td>
                  <td style={tdStyle}>{row.sale_date || '—'}</td>
                  <td style={tdStyle}>
                    <span style={statusStyle}>
                      {invalid ? row.errors[0]?.message ?? 'Invalid' : 'Valid'}
                    </span>
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
