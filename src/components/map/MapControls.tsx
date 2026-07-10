import type { PaperSize } from '../../types/domain';

const zoomBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 6,
  background: 'var(--color-white)',
  color: 'var(--color-dark-blue)',
  fontSize: 17,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-md)',
};

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button style={zoomBtnStyle} onClick={onZoomIn}>
        +
      </button>
      <button style={zoomBtnStyle} onClick={onZoomOut}>
        &minus;
      </button>
    </div>
  );
}

interface PaperSizeToggleProps {
  paper: PaperSize;
  onChange: (paper: PaperSize) => void;
}

export function PaperSizeToggle({ paper, onChange }: PaperSizeToggleProps) {
  const base: React.CSSProperties = { padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
  const activeStyle: React.CSSProperties = { ...base, background: 'var(--color-dark-blue)', color: '#fff' };
  const inactiveStyle: React.CSSProperties = { ...base, color: 'var(--color-fg-muted)' };

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        background: 'var(--color-white)',
        borderRadius: 6,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      <div style={paper === 'letter' ? activeStyle : inactiveStyle} onClick={() => onChange('letter')}>
        Letter 8.5×11
      </div>
      <div style={paper === 'tabloid' ? activeStyle : inactiveStyle} onClick={() => onChange('tabloid')}>
        Tabloid 11×17
      </div>
    </div>
  );
}

interface RenumberButtonProps {
  disabled: boolean;
  hasManualOverride: boolean;
  onClick: () => void;
}

export function RenumberButton({ disabled, hasManualOverride, onClick }: RenumberButtonProps) {
  const style: React.CSSProperties = {
    border: 'none',
    padding: '10px 20px',
    borderRadius: 4,
    font: '600 13.5px var(--font-sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: 'var(--shadow-md)',
    background: disabled ? 'var(--color-light-blue-grey)' : 'var(--color-medium-blue)',
    color: '#fff',
    opacity: disabled ? 0.7 : 1,
  };
  return (
    <button style={style} disabled={disabled} onClick={onClick}>
      {hasManualOverride ? 'Renumber in bounds ⚠' : 'Renumber in bounds'}
    </button>
  );
}

interface PanningIndicatorProps {
  visible: boolean;
}

export function PanningIndicator({ visible }: PanningIndicatorProps) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 11.5,
        color: 'var(--color-dark-blue-grey)',
        background: 'rgba(255,255,255,0.85)',
        padding: '5px 10px',
        borderRadius: 4,
      }}
    >
      Panning… numbering paused
    </div>
  );
}
