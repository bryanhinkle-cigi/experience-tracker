import type { PaperSize } from '../../types/domain';

export type ExportStep = 'fetching-basemap' | 'placing-points' | 'writing-vector-layer';

const STEP_LABELS: Record<ExportStep, string> = {
  'fetching-basemap': 'Fetching high-resolution basemap image…',
  'placing-points': 'Placing numbered point objects…',
  'writing-vector-layer': 'Writing vector text layer…',
};

interface ExportModalProps {
  status: 'running' | 'done' | 'error';
  step: ExportStep;
  paper: PaperSize;
  pointCount: number;
  errorMessage?: string;
  onClose: () => void;
}

const paperLabel: Record<PaperSize, string> = {
  letter: 'Letter 8.5×11',
  tabloid: 'Tabloid 11×17',
};

export function ExportModal({ status, step, paper, pointCount, errorMessage, onClose }: ExportModalProps) {
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
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          width: 420,
          padding: 32,
          textAlign: 'center',
        }}
      >
        {status === 'running' && (
          <>
            <div
              className="spinner"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '3px solid var(--color-pale-blue-grey)',
                borderTopColor: 'var(--color-medium-blue)',
                margin: '0 auto 18px',
              }}
            />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-deep-blue)', marginBottom: 6 }}>
              {STEP_LABELS[step]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-fg-muted)' }}>
              Building a vector-editable PDF at {paperLabel[paper]}
            </div>
          </>
        )}
        {status === 'done' && (
          <>
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
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-deep-blue)', marginBottom: 6 }}>
              property-map-{paper}.pdf downloaded
            </div>
            <p style={{ color: 'var(--color-fg-muted)', fontSize: 12.5, margin: '0 0 22px' }}>
              {pointCount} numbered points &middot; editable text &amp; point objects
            </p>
            <button
              style={{
                background: 'var(--color-medium-blue)',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 4,
                font: '600 13.5px var(--font-sans)',
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              Done
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-red)', marginBottom: 10 }}>
              Export failed
            </div>
            <p style={{ color: 'var(--color-fg-muted)', fontSize: 12.5, margin: '0 0 22px' }}>
              {errorMessage ?? 'Something went wrong while building the PDF.'}
            </p>
            <button
              style={{
                background: 'var(--color-medium-blue)',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 4,
                font: '600 13.5px var(--font-sans)',
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
