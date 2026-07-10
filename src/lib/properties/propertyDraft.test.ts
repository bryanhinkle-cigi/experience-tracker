import { describe, expect, it } from 'vitest';
import {
  EMPTY_PROPERTY_DRAFT,
  draftToRawImportRow,
  propertyToDraft,
  validatePropertyDraft,
} from './propertyDraft';

describe('validatePropertyDraft', () => {
  it('accepts a complete draft', () => {
    const result = validatePropertyDraft({
      building_name: 'Tower',
      address: '1 Main St',
      lat: '43.65',
      lng: '-79.38',
      sale_date: '2024-06-01',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        building_name: 'Tower',
        address: '1 Main St',
        lat: 43.65,
        lng: -79.38,
        sale_date: '2024-06-01',
      },
    });
  });

  it('allows blank building name', () => {
    const result = validatePropertyDraft({
      ...EMPTY_PROPERTY_DRAFT,
      address: '1 Main St',
      lat: '43.65',
      lng: '-79.38',
      sale_date: '2024-06-01',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.building_name).toBeNull();
  });

  it('rejects missing required fields with intake messages', () => {
    const result = validatePropertyDraft(EMPTY_PROPERTY_DRAFT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('Missing address');
      expect(result.errors).toContain('Invalid latitude');
      expect(result.errors).toContain('Invalid longitude');
      expect(result.errors).toContain('Missing sale date');
    }
  });
});

describe('draft helpers', () => {
  it('round-trips property fields through draft strings', () => {
    const draft = propertyToDraft({
      building_name: null,
      address: '9 King',
      lat: 43.1,
      lng: -79.2,
      sale_date: '2023-01-02',
    });
    expect(draftToRawImportRow(draft)).toEqual({
      building_name: '',
      address: '9 King',
      lat: 43.1,
      lng: -79.2,
      sale_date: '2023-01-02',
    });
  });
});
