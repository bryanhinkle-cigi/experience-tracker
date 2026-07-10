export interface RawImportRow {
  building_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  sale_date: string; // empty string if absent
}

export interface RowError {
  field: 'building_name' | 'address' | 'lat' | 'lng' | 'sale_date';
  message: string;
}

export interface ValidatedRow extends RawImportRow {
  errors: RowError[];
  isValid: boolean;
}
