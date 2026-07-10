import type { CSSProperties } from 'react';

const tabBase: CSSProperties = {
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

const tabActive: CSSProperties = {
  ...tabBase,
  background: 'var(--color-pale-blue-grey)',
  color: 'var(--color-dark-blue)',
};

const tabInactive: CSSProperties = {
  ...tabBase,
  background: 'transparent',
  color: 'var(--color-fg-muted)',
};

export type Screen = 'intake' | 'workspace';

interface HeaderProps {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  propertyCount: number;
}

export function Header({ screen, onNavigate, propertyCount }: HeaderProps) {
  return (
    <header
      style={{
        height: 64,
        flex: 'none',
        background: 'var(--color-white)',
        borderBottom: '2px solid var(--color-dark-blue)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 28,
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'var(--color-dark-blue)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          C
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-deep-blue)', lineHeight: 1.1 }}>
            Property Numbering
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--color-fg-muted)', letterSpacing: '0.02em' }}>
            Export Project
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
        <div style={screen === 'intake' ? tabActive : tabInactive} onClick={() => onNavigate('intake')}>
          Data intake
        </div>
        <div style={screen === 'workspace' ? tabActive : tabInactive} onClick={() => onNavigate('workspace')}>
          Map workspace
        </div>
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-fg-muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-dark-blue)' }}>{propertyCount}</span>{' '}
          properties loaded
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: 'var(--color-pale-blue-grey)',
            color: 'var(--color-dark-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          JD
        </div>
      </div>
    </header>
  );
}
