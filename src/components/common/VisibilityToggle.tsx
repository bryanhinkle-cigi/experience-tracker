import type { CSSProperties } from 'react';

interface VisibilityToggleProps {
  hidden: boolean;
  onClick: () => void;
  style?: CSSProperties;
}

export function VisibilityToggle({ hidden, onClick, style }: VisibilityToggleProps) {
  return (
    <button
      type="button"
      title={hidden ? 'Show on map and in list' : 'Hide from map, list numbering, and export'}
      aria-label={hidden ? 'Show property' : 'Hide property'}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        flex: 'none',
        border: 'none',
        background: 'transparent',
        color: 'var(--color-light-blue-grey)',
        cursor: 'pointer',
        padding: '2px 4px',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 0,
        ...style,
      }}
    >
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.7a3 3 0 0 0 4.2 4.2M9.9 5.6A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-4.2 4.7M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
