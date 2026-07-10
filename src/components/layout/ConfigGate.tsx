import type { ReactNode } from 'react';
import { isConfigValid, missingConfigKeys } from '../../config/env';

export function ConfigGate({ children }: { children: ReactNode }) {
  if (isConfigValid()) return <>{children}</>;

  const missing = missingConfigKeys();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: 32,
        }}
      >
        <div className="type-label" style={{ color: 'var(--color-medium-blue)', marginBottom: 6 }}>
          Setup required
        </div>
        <h2 style={{ margin: '0 0 12px' }}>Missing configuration</h2>
        <p style={{ margin: '0 0 16px' }}>
          Copy <code>.env.example</code> to <code>.env.local</code> in the project root and fill in
          your Mapbox and Supabase credentials, then restart the dev server.
        </p>
        <div
          style={{
            background: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          {missing.map((key) => (
            <div key={key}>{key}=</div>
          ))}
        </div>
      </div>
    </div>
  );
}
