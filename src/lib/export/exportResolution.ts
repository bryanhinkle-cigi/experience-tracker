import { PAPER_SIZE_PT, type PaperSize } from '../../types/domain';

/** Target print resolution for embedded basemap rasters. */
export const EXPORT_DPI = 300;

/** Guard against WebGL canvas size limits on very large paper sizes. */
export const MAX_EXPORT_LONG_EDGE_PX = 4096;

/**
 * Pixel dimensions for the export basemap at {@link EXPORT_DPI}, scaled down
 * proportionally when the long edge would exceed {@link MAX_EXPORT_LONG_EDGE_PX}.
 */
export function exportPixelDimensions(
  paper: PaperSize,
  dpi: number = EXPORT_DPI,
): { width: number; height: number } {
  const { width: ptW, height: ptH } = PAPER_SIZE_PT[paper];
  let width = Math.round((ptW / 72) * dpi);
  let height = Math.round((ptH / 72) * dpi);
  const longEdge = Math.max(width, height);
  if (longEdge > MAX_EXPORT_LONG_EDGE_PX) {
    const scale = MAX_EXPORT_LONG_EDGE_PX / longEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  return { width, height };
}
