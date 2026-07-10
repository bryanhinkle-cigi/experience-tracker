import { describe, expect, it } from 'vitest';
import { buildStaticImageUrl, detectImageFormat, tryParseMapboxError } from './staticImage';

describe('buildStaticImageUrl', () => {
  it('does not append a .{format} suffix — the styles/v1/.../static/ endpoint 404s on it', () => {
    const url = buildStaticImageUrl({
      bbox: { minLng: -79.39, minLat: 43.64, maxLng: -79.37, maxLat: 43.66 },
      widthPx: 989,
      heightPx: 1280,
      scale: 2,
      mapboxToken: 'pk.test',
      mapboxStyleUrl: 'mapbox://styles/mapbox/light-v11',
    });
    expect(url).not.toMatch(/\.(png|jpg\d*)\?/);
    expect(url).toContain('/static/[-79.39,43.64,-79.37,43.66]/989x1280@2x?access_token=pk.test');
    expect(url).toContain('/styles/v1/mapbox/light-v11/');
  });

  it('omits the @2x suffix at scale 1', () => {
    const url = buildStaticImageUrl({
      bbox: { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 },
      widthPx: 600,
      heightPx: 400,
      scale: 1,
      mapboxToken: 'pk.test',
      mapboxStyleUrl: 'mapbox://styles/mapbox/light-v11',
    });
    expect(url).not.toContain('@2x');
    expect(url).toContain('/600x400?access_token=pk.test');
  });

  it('builds URL for satellite-streets style', () => {
    const url = buildStaticImageUrl({
      bbox: { minLng: -122.4, minLat: 37.7, maxLng: -122.3, maxLat: 37.8 },
      widthPx: 800,
      heightPx: 600,
      scale: 2,
      mapboxToken: 'pk.test',
      mapboxStyleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
    });
    expect(url).toContain('/styles/v1/mapbox/satellite-streets-v12/');
  });
});

describe('static image helpers', () => {
  it('detects PNG and JPEG magic bytes', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectImageFormat(png)).toBe('png');
    expect(detectImageFormat(jpg)).toBe('jpg');
    expect(detectImageFormat(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it('parses Mapbox JSON error bodies', () => {
    const bytes = new TextEncoder().encode('{"message":"Width must be between 1-1280."}');
    expect(tryParseMapboxError(bytes)).toBe('Width must be between 1-1280.');
  });
});
