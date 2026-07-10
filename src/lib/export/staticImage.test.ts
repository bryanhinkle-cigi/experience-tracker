import { describe, expect, it } from 'vitest';
import { buildStaticImageUrl } from './staticImage';

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
});
