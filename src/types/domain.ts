export type PaperSize = 'letter' | 'tabloid';

export const PAPER_RATIOS: Record<PaperSize, number> = {
  letter: 8.5 / 11,
  tabloid: 11 / 17,
};

// Points (72pt/inch), used for PDF page sizing.
export const PAPER_SIZE_PT: Record<PaperSize, { width: number; height: number }> = {
  letter: { width: 612, height: 792 },
  tabloid: { width: 792, height: 1224 },
};

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface GeoBbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export type GeoPolygon = GeoPoint[];
