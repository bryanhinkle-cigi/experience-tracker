import { useEffect, useRef, useState } from 'react';
import { useMapInstance } from '../../hooks/useMapInstance';
import { useBoundsBox } from '../../hooks/useBoundsBox';
import { useInBoundsProperties } from '../../hooks/useInBoundsProperties';
import { useRenumber } from '../../hooks/useRenumber';
import { useMapLabelVisibility } from '../../hooks/useMapLabelVisibility';
import { hasManualOverride } from '../../lib/numbering/numbering';
import { geoPolygonToBbox } from '../../lib/geometry/boundsToPolygon';
import { capturePrintBoundsBasemap } from '../../lib/export/captureBasemap';
import { buildExportPdf, downloadPdf, exportErrorMessage } from '../../lib/export/pdfExport';
import { MAP_STYLE_URLS, type MapStyleMode } from '../../lib/map/mapStyles';
import type { PropertyRow } from '../../lib/supabase/types';
import type { OrderAssignment } from '../../lib/numbering/numbering';
import { PrintBoundsOverlay } from './PrintBoundsOverlay';
import { PaperSizeToggle, PanningIndicator, RenumberButton, ZoomControls } from './MapControls';
import { MapSettingsPanel } from './MapSettingsPanel';
import { PropertyMarkersLayer } from './PropertyMarkersLayer';
import { RenumberConfirmModal } from './RenumberConfirmModal';
import { PropertyListPanel } from '../list/PropertyListPanel';
import { ExportModal, type ExportStep } from '../export/ExportModal';

const DEFAULT_MARKER_SIZE = 24; // px diameter
const DEFAULT_MARKER_COLOR = '#1C54F4'; // --color-medium-blue

interface MapWorkspaceScreenProps {
  properties: PropertyRow[];
  onApplyOrderUpdates: (updates: OrderAssignment[]) => void;
}

type ExportState = { status: 'closed' } | { status: 'running'; step: ExportStep } | { status: 'done' } | { status: 'error'; message: string };

export function MapWorkspaceScreen({ properties, onApplyOrderUpdates }: MapWorkspaceScreenProps) {
  const { containerRef, map, isInteracting } = useMapInstance();
  const { paper, rect, boundsPolygon, setPaperSize, onBoxMouseDown, onResizeMouseDown } = useBoundsBox(
    containerRef,
    map,
  );
  const inBoundsRows = useInBoundsProperties(properties, boundsPolygon);
  const inBoundsIds = new Set(inBoundsRows.map((r) => r.id));
  const { listRows, showConfirm, onRenumberClick, confirmRenumber, cancelRenumber, onDragEnd } = useRenumber(
    inBoundsRows,
    onApplyOrderUpdates,
  );
  const [exportState, setExportState] = useState<ExportState>({ status: 'closed' });
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('standard');
  const [markerSize, setMarkerSize] = useState(DEFAULT_MARKER_SIZE);
  const [markerColor, setMarkerColor] = useState(DEFAULT_MARKER_COLOR);
  const { visibility: labelVisibility, setCategoryVisible: setLabelCategoryVisible } = useMapLabelVisibility(map);

  // Map already initializes with MAP_STYLE_URLS.standard (see useMapInstance) —
  // skip the first run so toggling the satellite switch doesn't redundantly
  // reload the same style the map already has on mount.
  const isFirstStyleRun = useRef(true);
  useEffect(() => {
    if (!map) return;
    if (isFirstStyleRun.current) {
      isFirstStyleRun.current = false;
      return;
    }
    map.setStyle(MAP_STYLE_URLS[mapStyleMode]);
  }, [map, mapStyleMode]);

  async function handleExportClick() {
    if (!map || !boundsPolygon || listRows.length === 0) return;
    setExportState({ status: 'running', step: 'fetching-basemap' });
    try {
      const bbox = geoPolygonToBbox(boundsPolygon);
      const basemapBytes = await capturePrintBoundsBasemap(map, rect);
      const bytes = await buildExportPdf({
        properties: listRows.map((r) => ({ lat: r.lat, lng: r.lng, current_number: r.current_number ?? 0 })),
        bbox,
        paper,
        basemapBytes,
        onStep: (step) => setExportState({ status: 'running', step }),
      });
      downloadPdf(bytes, `property-map-${paper}.pdf`);
      setExportState({ status: 'done' });
    } catch (err) {
      setExportState({ status: 'error', message: exportErrorMessage(err) });
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
        <PropertyMarkersLayer
          map={map}
          properties={properties}
          inBoundsIds={inBoundsIds}
          markerSize={markerSize}
          markerColor={markerColor}
        />

        <PrintBoundsOverlay
          rect={rect}
          paper={paper}
          onBoxMouseDown={onBoxMouseDown}
          onResizeMouseDown={onResizeMouseDown}
        />

        <ZoomControls onZoomIn={() => map?.zoomIn()} onZoomOut={() => map?.zoomOut()} />
        <PaperSizeToggle paper={paper} onChange={setPaperSize} />
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MapSettingsPanel
            mapStyleMode={mapStyleMode}
            onMapStyleModeChange={setMapStyleMode}
            markerSize={markerSize}
            onMarkerSizeChange={setMarkerSize}
            markerColor={markerColor}
            onMarkerColorChange={setMarkerColor}
            labelVisibility={labelVisibility}
            onLabelCategoryChange={setLabelCategoryVisible}
          />
          <RenumberButton
            disabled={isInteracting}
            hasManualOverride={hasManualOverride(inBoundsRows)}
            onClick={onRenumberClick}
          />
        </div>
        <PanningIndicator visible={isInteracting} />
      </div>

      <PropertyListPanel listRows={listRows} onDragEnd={onDragEnd} onExportClick={handleExportClick} />

      {showConfirm && <RenumberConfirmModal onCancel={cancelRenumber} onConfirm={confirmRenumber} />}

      {exportState.status !== 'closed' && (
        <ExportModal
          status={exportState.status === 'running' ? 'running' : exportState.status}
          step={exportState.status === 'running' ? exportState.step : 'fetching-basemap'}
          paper={paper}
          pointCount={listRows.length}
          errorMessage={exportState.status === 'error' ? exportState.message : undefined}
          onClose={() => setExportState({ status: 'closed' })}
        />
      )}
    </div>
  );
}
