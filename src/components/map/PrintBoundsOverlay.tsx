import type { PaperSize, ScreenRect } from '../../types/domain';

interface PrintBoundsOverlayProps {
  rect: ScreenRect;
  paper: PaperSize;
  onBoxMouseDown: (e: React.MouseEvent) => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
}

const paperLabel: Record<PaperSize, string> = {
  letter: 'Letter 8.5×11',
  tabloid: 'Tabloid 11×17',
};

export function PrintBoundsOverlay({ rect, paper, onBoxMouseDown, onResizeMouseDown }: PrintBoundsOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: '2.5px solid var(--color-dark-blue)',
        background: 'rgba(28,84,244,0.05)',
        cursor: 'move',
        boxShadow: '0 0 0 2000px rgba(0,7,89,0.12)',
      }}
      onMouseDown={onBoxMouseDown}
    >
      <div
        style={{
          position: 'absolute',
          top: -24,
          left: 0,
          font: '700 10.5px var(--font-sans)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-dark-blue)',
          background: 'rgba(255,255,255,0.9)',
          padding: '2px 8px',
          borderRadius: 4,
        }}
      >
        Print bounds — {paperLabel[paper]}
      </div>
      <div
        style={{
          position: 'absolute',
          right: -7,
          bottom: -7,
          width: 16,
          height: 16,
          borderRadius: 3,
          background: 'var(--color-dark-blue)',
          border: '2px solid #fff',
          cursor: 'nwse-resize',
        }}
        onMouseDown={onResizeMouseDown}
      />
    </div>
  );
}
