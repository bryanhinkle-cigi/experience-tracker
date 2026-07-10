import { useRef } from 'react';

const fileTypeBase: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 4,
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const fileTypeActive: React.CSSProperties = {
  ...fileTypeBase,
  background: 'var(--color-dark-blue)',
  color: '#fff',
};

const fileTypeInactive: React.CSSProperties = {
  ...fileTypeBase,
  background: 'var(--color-pale-blue-grey)',
  color: 'var(--color-dark-blue-grey)',
};

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
}

export function UploadStep({ onFileSelected, onLoadSample }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={fileTypeActive}>CSV</div>
        <div style={fileTypeInactive}>XLSX</div>
        <div style={fileTypeInactive}>GeoJSON</div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed var(--color-light-blue-grey)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '56px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 15, color: 'var(--color-fg)', marginBottom: 4 }}>
          Drag a file here, or
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.geojson,application/geo+json"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <button
          style={{
            background: 'var(--color-dark-blue)',
            color: '#fff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 4,
            font: '600 14px var(--font-sans)',
            cursor: 'pointer',
            marginRight: 8,
          }}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>
        <button
          style={{
            background: 'transparent',
            color: 'var(--color-dark-blue)',
            border: '1.5px solid var(--color-dark-blue)',
            padding: '10px 22px',
            borderRadius: 4,
            font: '600 14px var(--font-sans)',
            cursor: 'pointer',
          }}
          onClick={onLoadSample}
        >
          Load sample file
        </button>
      </div>
    </>
  );
}
