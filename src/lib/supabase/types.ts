export interface PropertyRow {
  id: string;
  building_name: string | null;
  address: string;
  lat: number;
  lng: number;
  sale_date: string | null; // ISO date
  current_number: number | null;
  list_order: number | null;
  created_at: string;
}

export interface NewPropertyInput {
  building_name: string | null;
  address: string;
  lat: number;
  lng: number;
  sale_date: string; // required at the app layer, validated before insert
}

export interface OrderUpdate {
  id: string;
  list_order: number;
  current_number: number;
}
