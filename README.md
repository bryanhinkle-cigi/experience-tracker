# Property Numbering & Export App

Map-based tool for numbering commercial properties (1..N) within a print-ready
area, then exporting a vector-editable PDF map at Letter or Tabloid size. See
[md/property-numbering-app-spec.md](md/property-numbering-app-spec.md) for the
full feature spec.

## Stack

Vite + React + TypeScript, Mapbox GL JS, Supabase, PapaParse/SheetJS, @dnd-kit,
Turf.js, pdf-lib.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_MAPBOX_TOKEN` — from [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/)
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from your Supabase
     project's **Project Settings → API**. Use the **anon/public** key, not
     the service-role/secret key — this app is a client-side SPA, and
     `VITE_`-prefixed env vars ship in the public browser bundle.
3. Run the migration in `supabase/migrations/0001_create_properties.sql`
   against your Supabase project (dashboard → SQL Editor → paste → Run).
4. `npm run dev`

If any required env var is missing, the app shows a setup screen instead of
crash-looping.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck + production build
- `npm run test` — run the unit test suite (numbering logic, bounds-box
  geometry, and all three import-format parsers against the fixtures in
  `public/sample-data/`)
- `npm run lint` — oxlint

## Project structure

- `src/lib/numbering/` — pure sort/reorder logic (no React/Mapbox/Supabase
  imports), unit-tested
- `src/lib/geometry/` — print-bounds box math, screen→geo polygon conversion,
  point-in-polygon containment
- `src/lib/parsers/` — CSV/XLSX/GeoJSON import parsing + validation
- `src/lib/export/` — Mapbox Static Images fetch, lat/lng→PDF projection,
  pdf-lib export pipeline
- `src/lib/supabase/` — typed Supabase client + CRUD
- `src/components/` — intake, map workspace, property list, and export UI
- `supabase/migrations/` — schema
- `public/sample-data/` — sample CSV/XLSX/GeoJSON fixtures (20 rows, 2
  intentionally invalid — missing sale date and out-of-range latitude) used
  by both the "Load sample file" button and the parser test suite

## Known limitations

- PDF basemap resolution is capped by the Mapbox Static Images API's base
  request size (~1280px before `@2x` scaling) — sharp on screen and at
  typical print sizes, but not true 300dpi from a single API call.
- No auth — this build intentionally has no user accounts (see spec); the
  header avatar is static UI chrome.
