import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PAPER_SIZE_PT, type GeoBbox, type PaperSize } from '../../types/domain';
import { latLngToPdfPoint } from './projection';
import { detectImageFormat } from './staticImage';

export interface ExportableProperty {
  lat: number;
  lng: number;
  current_number: number;
}

export interface BuildExportPdfParams {
  properties: ExportableProperty[];
  bbox: GeoBbox;
  paper: PaperSize;
  basemapBytes: Uint8Array;
  onStep?: (step: 'fetching-basemap' | 'placing-points' | 'writing-vector-layer') => void;
}

export function exportErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Export failed';
}

async function embedBasemapImage(doc: PDFDocument, bytes: Uint8Array) {
  const format = detectImageFormat(bytes);
  try {
    if (format === 'png') return await doc.embedPng(bytes);
    if (format === 'jpg') return await doc.embedJpg(bytes);
    throw new Error('Unsupported basemap image format');
  } catch (err) {
    if (typeof err === 'string') throw new Error(err);
    throw err;
  }
}

export async function buildExportPdf(params: BuildExportPdfParams): Promise<Uint8Array> {
  const { properties, bbox, paper, basemapBytes, onStep } = params;
  const { width: pageWidthPt, height: pageHeightPt } = PAPER_SIZE_PT[paper];

  onStep?.('fetching-basemap');

  const doc = await PDFDocument.create();
  const page = doc.addPage([pageWidthPt, pageHeightPt]);

  const image = await embedBasemapImage(doc, basemapBytes);
  page.drawImage(image, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });

  const font = await doc.embedFont(StandardFonts.HelveticaBold);

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
  const blob = new Blob([bytes.slice()], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
