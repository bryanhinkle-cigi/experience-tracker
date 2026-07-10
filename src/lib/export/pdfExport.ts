import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PAPER_SIZE_PT, type GeoBbox, type PaperSize } from '../../types/domain';
import { latLngToPdfPoint } from './projection';
import { buildStaticImageUrl, fetchStaticImageBytes } from './staticImage';

export interface ExportableProperty {
  lat: number;
  lng: number;
  current_number: number;
}

export interface BuildExportPdfParams {
  properties: ExportableProperty[];
  bbox: GeoBbox;
  paper: PaperSize;
  mapboxToken: string;
  mapboxStyleUrl: string;
  onStep?: (step: 'fetching-basemap' | 'placing-points' | 'writing-vector-layer') => void;
}

// Static Images API's max base request size, before @2x/@3x scaling.
const STATIC_IMAGE_MAX_BASE_PX = 1280;

export async function buildExportPdf(params: BuildExportPdfParams): Promise<Uint8Array> {
  const { properties, bbox, paper, mapboxToken, mapboxStyleUrl, onStep } = params;
  const { width: pageWidthPt, height: pageHeightPt } = PAPER_SIZE_PT[paper];

  onStep?.('fetching-basemap');
  const ratio = pageWidthPt / pageHeightPt;
  const widthPx = ratio >= 1 ? STATIC_IMAGE_MAX_BASE_PX : Math.round(STATIC_IMAGE_MAX_BASE_PX * ratio);
  const heightPx = ratio >= 1 ? Math.round(STATIC_IMAGE_MAX_BASE_PX / ratio) : STATIC_IMAGE_MAX_BASE_PX;
  const imageUrl = buildStaticImageUrl({
    bbox,
    widthPx,
    heightPx,
    scale: 2,
    mapboxToken,
    mapboxStyleUrl,
  });
  const imageBytes = await fetchStaticImageBytes(imageUrl);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([pageWidthPt, pageHeightPt]);

  const image = await doc.embedPng(imageBytes);
  page.drawImage(image, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });

  const fontBytes = await fetch('/fonts/OpenSans-Bold.ttf').then((r) => r.arrayBuffer());
  const font = await doc.embedFont(fontBytes);

  onStep?.('placing-points');
  const markerRadius = 9;
  for (const property of properties) {
    const { x, y } = latLngToPdfPoint(property, bbox, pageWidthPt, pageHeightPt);
    page.drawCircle({
      x,
      y,
      size: markerRadius,
      color: rgb(0.11, 0.33, 0.96), // --color-medium-blue
      borderColor: rgb(1, 1, 1),
      borderWidth: 1.5,
    });
    const label = String(property.current_number);
    const fontSize = 9;
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    page.drawText(label, {
      x: x - textWidth / 2,
      y: y - fontSize / 2.8,
      size: fontSize,
      font,
      color: rgb(1, 1, 1),
    });
  }

  onStep?.('writing-vector-layer');
  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
