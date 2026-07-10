import { describe, expect, it, vi } from 'vitest';
import type { Map as MapboxMap } from 'mapbox-gl';
import {
  exportLabelTextScale,
  multiplyTextSize,
  scaleExportLabelTextSizes,
} from './exportLabelScale';

describe('exportLabelTextScale', () => {
  it('scales 300 dpi labels to ~screen physical size on 1x displays', () => {
    expect(exportLabelTextScale(1, 300)).toBeCloseTo(300 / 96);
  });

  it('divides by devicePixelRatio so retina exports stay the same print size', () => {
    expect(exportLabelTextScale(2, 300)).toBeCloseTo(300 / 96 / 2);
    expect(exportLabelTextScale(2, 300) * 2).toBeCloseTo(exportLabelTextScale(1, 300));
  });
});

describe('multiplyTextSize', () => {
  it('multiplies numeric text-size values', () => {
    expect(multiplyTextSize(12, 2.5)).toBe(30);
  });

  it('wraps expression text-size values in a multiply expression', () => {
    const expr = ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 20];
    expect(multiplyTextSize(expr, 1.5)).toEqual(['*', 1.5, expr]);
  });
});

describe('scaleExportLabelTextSizes', () => {
  it('multiplies text-size on matched label layers only', () => {
    const setLayoutProperty = vi.fn();
    const getLayoutProperty = vi.fn((layerId: string, prop: string) => {
      if (prop !== 'text-size') return undefined;
      if (layerId === 'poi-label') return 12;
      if (layerId === 'road-label') return ['interpolate', ['linear'], ['zoom'], 10, 10, 16, 16];
      return undefined;
    });
    const map = {
      getStyle: () => ({
        layers: [
          { id: 'road-primary', type: 'line', 'source-layer': 'road' },
          { id: 'road-label', type: 'symbol', 'source-layer': 'road' },
          { id: 'poi-label', type: 'symbol', 'source-layer': 'poi_label' },
          { id: 'icon-only-shield', type: 'symbol', 'source-layer': 'road' },
        ],
      }),
      getLayer: (id: string) => ({ id }),
      getLayoutProperty,
      setLayoutProperty,
    } as unknown as MapboxMap;

    scaleExportLabelTextSizes(map, 2);

    expect(setLayoutProperty).toHaveBeenCalledWith('poi-label', 'text-size', 24);
    expect(setLayoutProperty).toHaveBeenCalledWith('road-label', 'text-size', [
      '*',
      2,
      ['interpolate', ['linear'], ['zoom'], 10, 10, 16, 16],
    ]);
    expect(setLayoutProperty).not.toHaveBeenCalledWith(
      'icon-only-shield',
      'text-size',
      expect.anything(),
    );
    expect(setLayoutProperty).not.toHaveBeenCalledWith('road-primary', expect.anything(), expect.anything());
  });

  it('no-ops when multiplier is 1', () => {
    const setLayoutProperty = vi.fn();
    const map = {
      getStyle: () => ({ layers: [{ id: 'poi-label', type: 'symbol', 'source-layer': 'poi_label' }] }),
      getLayer: () => ({ id: 'poi-label' }),
      getLayoutProperty: () => 12,
      setLayoutProperty,
    } as unknown as MapboxMap;

    scaleExportLabelTextSizes(map, 1);
    expect(setLayoutProperty).not.toHaveBeenCalled();
  });
});
