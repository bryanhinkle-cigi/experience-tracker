import { useState } from 'react';
import { parseFile } from '../../lib/parsers/parseFile';
import { validateRows } from '../../lib/parsers/validate';
import type { RawImportRow, ValidatedRow } from '../../lib/parsers/types';
import { bulkInsertProperties, updatePropertyFields } from '../../lib/supabase/properties';
import { matchUploadedRows, type MatchedRow } from '../../lib/matching/matchUploadedRows';
import type { PropertyRow } from '../../lib/supabase/types';
import { UploadStep } from './UploadStep';
import { PreviewStep } from './PreviewStep';
import { MatchReviewStep, type MatchDecision } from './MatchReviewStep';
import { DoneStep } from './DoneStep';

type IntakeStep = 'upload' | 'preview' | 'review' | 'done';

interface DataIntakeScreenProps {
  existingProperties: PropertyRow[];
  onImported: () => void;
  onGoToWorkspace: () => void;
}

export function DataIntakeScreen({ existingProperties, onImported, onGoToWorkspace }: DataIntakeScreenProps) {
  const [step, setStep] = useState<IntakeStep>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [pendingMatches, setPendingMatches] = useState<MatchedRow[]>([]);
  const [pendingNewRows, setPendingNewRows] = useState<RawImportRow[]>([]);
  const [resultCounts, setResultCounts] = useState({ added: 0, updated: 0 });
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const raw = await parseFile(file);
      setFileName(file.name);
      setRows(validateRows(raw));
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }

  async function handleLoadSample() {
    setError(null);
    try {
      const res = await fetch('/sample-data/sample-properties.csv');
      const blob = await res.blob();
      const file = new File([blob], 'sample-properties.csv', { type: 'text/csv' });
      await handleFile(file);
    } catch {
      setError('Failed to load sample file');
    }
  }

  function handleRemoveInvalid() {
    setRows((prev) => prev.filter((r) => r.isValid));
  }

  async function insertRows(toInsert: RawImportRow[]): Promise<number> {
    if (toInsert.length === 0) return 0;
    const inserted = await bulkInsertProperties(
      toInsert.map((r) => ({
        building_name: r.building_name || null,
        address: r.address,
        lat: r.lat as number,
        lng: r.lng as number,
        sale_date: r.sale_date,
      })),
    );
    return inserted.length;
  }

  function handleConfirmImport() {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) return;
    setError(null);

    const results = matchUploadedRows(validRows, existingProperties);
    const matched: MatchedRow[] = [];
    const newRows: RawImportRow[] = [];
    results.forEach((result) => {
      if (result.kind === 'matched') matched.push(result);
      else newRows.push(result.uploadedRow);
    });

    if (matched.length === 0) {
      // Nothing matched an existing property — nothing to review, just import.
      insertRows(newRows)
        .then((addedCount) => {
          setResultCounts({ added: addedCount, updated: 0 });
          onImported();
          setStep('done');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to import properties'));
      return;
    }

    setPendingMatches(matched);
    setPendingNewRows(newRows);
    setStep('review');
  }

  async function handleReviewConfirm(decisions: MatchDecision[]) {
    setError(null);
    try {
      let updatedCount = 0;
      const declinedRows: RawImportRow[] = [];

      await Promise.all(
        pendingMatches.map(async (match, i) => {
          const decision = decisions[i];
          if (!decision.confirmed) {
            declinedRows.push(match.uploadedRow);
            return;
          }
          if (decision.selectedFields.size === 0) return;
          const fields: Partial<Record<'building_name' | 'address' | 'sale_date', string>> = {};
          for (const update of match.updates) {
            if (decision.selectedFields.has(update.field)) fields[update.field] = update.newValue;
          }
          await updatePropertyFields(match.existing.id, fields);
          updatedCount += 1;
        }),
      );

      const addedCount = await insertRows([...pendingNewRows, ...declinedRows]);
      setResultCounts({ added: addedCount, updated: updatedCount });
      onImported();
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply updates');
    }
  }

  return (
    <div style={{ flex: 1, maxWidth: 980, width: '100%', margin: '0 auto', padding: '40px 32px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="type-label" style={{ color: 'var(--color-medium-blue)', marginBottom: 6 }}>
          Admin intake
        </div>
        <h1 style={{ margin: '0 0 6px' }}>Load property dataset</h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'var(--color-fg)' }}>
          Upload a CSV, XLSX, or GeoJSON file of properties. Every row needs a name, address,
          coordinates, and sale date before it can be added — sale date is required for
          auto-numbering. Rows matching an existing property by address are reviewed before
          anything is overwritten.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(237,27,52,0.08)',
            color: 'var(--color-red)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {step === 'upload' && <UploadStep onFileSelected={handleFile} onLoadSample={handleLoadSample} />}
      {step === 'preview' && (
        <PreviewStep
          fileName={fileName}
          rows={rows}
          onRemoveInvalid={handleRemoveInvalid}
          onConfirmImport={handleConfirmImport}
        />
      )}
      {step === 'review' && (
        <MatchReviewStep
          matches={pendingMatches}
          newRowCount={pendingNewRows.length}
          onConfirm={handleReviewConfirm}
        />
      )}
      {step === 'done' && (
        <DoneStep count={resultCounts.added} updatedCount={resultCounts.updated} onGoToWorkspace={onGoToWorkspace} />
      )}
    </div>
  );
}
