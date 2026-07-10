import { useState } from 'react';
import type { MatchedRow } from '../../lib/matching/matchUploadedRows';
import type { UpdatableField } from '../../lib/matching/diffProperties';

export interface MatchDecision {
  /** true = treat as the same property (apply selected field updates); false = insert as a new property instead. */
  confirmed: boolean;
  selectedFields: Set<UpdatableField>;
}

interface MatchReviewStepProps {
  matches: MatchedRow[];
  newRowCount: number;
  onConfirm: (decisions: MatchDecision[]) => void;
}

const FIELD_LABEL: Record<UpdatableField, string> = {
  building_name: 'Building name',
  address: 'Address',
  sale_date: 'Sale date',
};

function defaultDecision(match: MatchedRow): MatchDecision {
  return {
    confirmed: match.isExactMatch,
    selectedFields: new Set(match.updates.filter((u) => u.kind === 'fill').map((u) => u.field)),
  };
}

export function MatchReviewStep({ matches, newRowCount, onConfirm }: MatchReviewStepProps) {
  const [decisions, setDecisions] = useState<MatchDecision[]>(() => matches.map(defaultDecision));

  function toggleConfirmed(index: number) {
    setDecisions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, confirmed: !d.confirmed } : d)),
    );
  }

  function toggleField(index: number, field: UpdatableField) {
    setDecisions((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const selectedFields = new Set(d.selectedFields);
        if (selectedFields.has(field)) selectedFields.delete(field);
        else selectedFields.add(field);
        return { ...d, selectedFields };
      }),
    );
  }

  const confirmedCount = decisions.filter((d) => d.confirmed).length;
  const totalFieldUpdates = decisions.reduce((sum, d) => sum + (d.confirmed ? d.selectedFields.size : 0), 0);
  const declinedCount = decisions.length - confirmedCount;
  const totalNewCount = newRowCount + declinedCount;

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-deep-blue)' }}>
          {matches.length} row{matches.length === 1 ? '' : 's'} matched existing properties by address
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
          Review each match below. Fuzzy matches (address isn't identical) are unchecked by
          default — confirm they're really the same property before applying any updates.
          Updates to a field that already has a value are also unchecked by default.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {matches.map((match, index) => {
          const decision = decisions[index];
          return (
            <div
              key={index}
              style={{
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '14px 16px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={decision.confirmed}
                  onChange={() => toggleConfirmed(index)}
                  style={{ marginTop: 3 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-deep-blue)' }}>
                      {match.existing.building_name || match.existing.address}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: match.isExactMatch ? 'rgba(42,182,169,0.12)' : 'rgba(250,102,9,0.12)',
                        color: match.isExactMatch ? '#1c8f84' : 'var(--color-orange)',
                      }}
                    >
                      {match.isExactMatch ? 'Exact match' : 'Fuzzy match — verify'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-fg-muted)', marginTop: 2 }}>
                    Existing: {match.existing.address} &nbsp;·&nbsp; Uploaded: {match.uploadedRow.address}
                  </div>
                </div>
              </label>

              {decision.confirmed && match.updates.length > 0 && (
                <div style={{ marginLeft: 26, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {match.updates.map((update) => (
                    <label
                      key={update.field}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={decision.selectedFields.has(update.field)}
                        onChange={() => toggleField(index, update.field)}
                      />
                      <span style={{ color: 'var(--color-fg)' }}>
                        <strong>{FIELD_LABEL[update.field]}</strong>{' '}
                        {update.kind === 'fill' ? '(currently empty)' : '(extends existing value)'}:{' '}
                        <span style={{ color: 'var(--color-fg-muted)' }}>
                          {update.oldValue || '—'} &rarr;
                        </span>{' '}
                        {update.newValue}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {decision.confirmed && match.updates.length === 0 && (
                <div style={{ marginLeft: 26, marginTop: 8, fontSize: 12, color: 'var(--color-fg-muted)' }}>
                  No changes proposed — nothing to update.
                </div>
              )}
              {!decision.confirmed && (
                <div style={{ marginLeft: 26, marginTop: 8, fontSize: 12, color: 'var(--color-fg-muted)' }}>
                  Will be added as a new, separate property instead.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
          {confirmedCount} matched property update{confirmedCount === 1 ? '' : 's'} ({totalFieldUpdates} field
          {totalFieldUpdates === 1 ? '' : 's'}) &middot; {totalNewCount} new propert
          {totalNewCount === 1 ? 'y' : 'ies'} to add
        </div>
        <button
          style={{
            background: 'var(--color-medium-blue)',
            color: '#fff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 4,
            font: '600 13.5px var(--font-sans)',
            cursor: 'pointer',
          }}
          onClick={() => onConfirm(decisions)}
        >
          Apply &amp; import
        </button>
      </div>
    </div>
  );
}
