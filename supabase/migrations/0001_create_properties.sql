create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  building_name text,
  address text not null,
  lat float8 not null,
  lng float8 not null,
  sale_date date,
  current_number integer,
  list_order integer,
  created_at timestamptz not null default now()
);

create index if not exists properties_list_order_idx on public.properties (list_order);

alter table public.properties enable row level security;

-- No auth phase is scoped for this app (see md/property-numbering-app-spec.md) —
-- open policies for the anon key. sale_date stays nullable at the DB layer per
-- spec: app-layer validation (src/lib/parsers/validate.ts) is the actual
-- enforcement point for "sale_date required at intake".
create policy "Allow anon read" on public.properties for select using (true);
create policy "Allow anon insert" on public.properties for insert with check (true);
create policy "Allow anon update" on public.properties for update using (true);
