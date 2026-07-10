import { useState } from 'react';
import type { MapStyleMode } from '../../lib/map/mapStyles';
import type { LabelCategory } from '../../lib/map/labelLayers';
import type { LabelVisibility } from '../../hooks/useMapLabelVisibility';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
      <span style={{ fontSize: 12.5, color: 'var(--color-fg)' }}>{label}</span>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: checked ? 'var(--color-medium-blue)' : 'var(--color-light-blue-grey)',
          position: 'relative',
          flex: 'none',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,7,89,0.3)',
            transition: 'left 0.15s',
          }}
        />
      </span>
    </label>
  );
}

interface MapSettingsPanelProps {
  mapStyleMode: MapStyleMode;
  onMapStyleModeChange: (mode: MapStyleMode) => void;
  markerSize: number;
  onMarkerSizeChange: (size: number) => void;
  markerColor: string;
  onMarkerColorChange: (color: string) => void;
  labelVisibility: LabelVisibility;
  onLabelCategoryChange: (category: LabelCategory, visible: boolean) => void;
}

const MIN_MARKER_SIZE = 8;
const MAX_MARKER_SIZE = 48;

export function MapSettingsPanel({
  mapStyleMode,
  onMapStyleModeChange,
  markerSize,
  onMarkerSizeChange,
  markerColor,
  onMarkerColorChange,
  labelVisibility,
  onLabelCategoryChange,
}: MapSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [colorText, setColorText] = useState(markerColor);

  function commitColorText(value: string) {
    setColorText(value);
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value)) {
      onMarkerColorChange(value);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Map settings"
        style={{
          width: 40,
          height: 40,
          border: 'none',
          borderRadius: 3,
          background: 'var(--color-white)',
          color: 'var(--color-dark-blue)',
          fontSize: 30,
          lineHeight:0,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        &#9881;
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 38,
            right: 0,
            width: 220,
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <ToggleSwitch
            checked={mapStyleMode === 'satellite'}
            onChange={(checked) => onMapStyleModeChange(checked ? 'satellite' : 'standard')}
            label="Satellite basemap"
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: 'var(--color-fg)' }}>Marker size</span>
              <span style={{ fontSize: 12.5, color: 'var(--color-fg-muted)' }}>{markerSize}px</span>
            </div>
            <input
              type="range"
              min={MIN_MARKER_SIZE}
              max={MAX_MARKER_SIZE}
              value={markerSize}
              onChange={(e) => onMarkerSizeChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12.5, color: 'var(--color-fg)', marginBottom: 4 }}>Marker color</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={/^#([0-9a-fA-F]{6})$/.test(markerColor) ? markerColor : '#1C54F4'}
                onChange={(e) => {
                  setColorText(e.target.value);
                  onMarkerColorChange(e.target.value);
                }}
                style={{ width: 32, height: 28, border: 'none', borderRadius: 4, padding: 0, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={colorText}
                onChange={(e) => commitColorText(e.target.value)}
                placeholder="#1C54F4"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  padding: '5px 8px',
                  fontSize: 12.5,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="type-label" style={{ color: 'var(--color-fg-muted)', fontSize: 10.5 }}>
              Map labels
            </div>
            <ToggleSwitch
              checked={labelVisibility.poi}
              onChange={(checked) => onLabelCategoryChange('poi', checked)}
              label="POI names"
            />
            <ToggleSwitch
              checked={labelVisibility.building}
              onChange={(checked) => onLabelCategoryChange('building', checked)}
              label="Building names"
            />
            <ToggleSwitch
              checked={labelVisibility.road}
              onChange={(checked) => onLabelCategoryChange('road', checked)}
              label="Street names"
            />
          </div>
        </div>
      )}
    </div>
  );
}
