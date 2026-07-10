# Property Numbering & Export App — Build Roadmap

Each phase ends in a checkpoint — a concrete, testable state. Don't move to the next phase until the checkpoint passes.

---

## Phase 0 — Project Setup

- Init React app, repo, env config
- Supabase project created, connection tested
- Mapbox account/token, GL JS installed and rendering a blank map
- Install: PapaParse, SheetJS, @dnd-kit, Turf.js, pdf-lib

**Checkpoint:** Blank React app loads a Mapbox map centered on a default city. Supabase client connects and can read/write a test row.

---

## Phase 1 — Data Foundation

- Create `properties` table in Supabase per schema (id, building_name, address, lat, lng, sale_date, current_number, list_order, created_at)
- Build CSV parser (PapaParse) → normalized row objects
- Build XLSX parser (SheetJS) → normalized row objects
- Build GeoJSON parser (native) → normalized row objects, pulling from Point feature properties
- Validation layer: required fields = **address, lat, lng, sale_date**. `building_name` is optional (stored as `null` when blank). Reject rows missing any required field.
- Column aliases accepted at parse time: `lng` / `long` / `lon` / `longitude` for longitude; `lat` / `latitude` for latitude (common in geocoded XLSX exports)
- XLSX date cells: Excel serial numbers and JS `Date` objects are normalized to `YYYY-MM-DD` strings before validation
- Preview table UI: show parsed rows, flag row-level errors (missing field, bad date format, bad lat/lng)
- Confirm step → bulk insert to Supabase
- Render inserted points on map as a symbol layer

**Checkpoint:** Upload a CSV with 20 rows (2 intentionally broken — one missing sale_date, one bad lat/lng). Preview correctly flags both errors, blocks their insert, inserts the other 18. Points appear on map at correct coordinates. Repeat with XLSX and GeoJSON sample files.

---

## Phase 2 — Bounds Layer (build before list sync — list depends on it per Decision #2)

- Fixed-aspect-ratio rectangle overlay component, centered on map viewport
- Letter (8.5:11) / Tabloid (11:17) toggle — changes rectangle aspect ratio only, not map viewport
- Box stays centered and fixed-ratio while user pans/zooms map underneath
- Resize listener: recompute box's on-screen pixel dimensions on window resize so it always represents true print ratio (not stretched CSS box)
- Turf.js: convert box screen bounds → geographic polygon for containment queries

**Checkpoint:** Resize browser window (including extreme aspect ratios) and confirm box never distorts from true Letter/Tabloid ratio. Toggle Letter↔Tabloid and confirm ratio changes correctly. Pan/zoom map and confirm box stays centered, fixed size.

---

## Phase 3 — Navigation + List Sync

- Property list UI (right panel)
- List filters live against bounds-box polygon (Turf `booleanPointInPolygon`), re-queried on `moveend`
- List updates only on `moveend`/`idle`, not continuously during drag/zoom (performance)
- Empty-state UI when zero properties fall in bounds

**Checkpoint:** Pan map so bounds box moves over a cluster of properties — list updates to show exactly those properties, no more no less. Pan to empty area — list shows empty state, no errors.

---

## Phase 4 — Numbering Logic

- Renumber button, disabled during `dragstart→dragend` / `zoomstart→zoomend`, enabled on `idle`/`moveend`
- On click: query points in bounds polygon → sort by `sale_date` DESC, tie-break `address` ASC → assign 1..N to both `list_order` and `current_number`
- Overwrite-warning: if properties in scope already have non-null `list_order` from a prior manual edit, show confirm dialog before overwriting
- Drag-to-reorder list (@dnd-kit): on drop, recompute `list_order` for affected rows, write `current_number` to match
- Map symbol layer updates number labels live as list/order changes

**Checkpoint:** Load 10 properties with distinct sale dates into bounds box. Click renumber — most recent sale gets 1, oldest gets 10, tie-break address confirmed with two same-date test rows. Manually drag-reorder two rows in the list — `current_number` updates to match new position and persists to Supabase. Click renumber again — confirm dialog appears before overwrite.

---

## Phase 5 — Export

- "Export" button, disabled if bounds box is empty
- **WYSIWYG basemap capture:** crop the live Mapbox canvas to the print-bounds overlay rect (after briefly hiding the property-marker layers so they aren't duplicated in the raster). This preserves the user's current satellite/standard basemap choice and map-label visibility toggles — something the Static Images API cannot do from a bare style URL alone.
- pdf-lib: construct PDF sized to Letter/Tabloid dimensions, place captured basemap image
- pdf-lib: draw vector text objects for each number label (Helvetica Bold standard font), vector point markers, positioned via projected lat/lng → PDF coordinate math
- Auto-download on completion
- Verify output PDF: numbers/points are selectable/editable text objects (open in Acrobat or Illustrator, confirm not flattened)

**Known limitation (as of current build):** basemap resolution is tied to the on-screen print-bounds box size × device pixel ratio (typically ~700–1000 px on the long edge at default box scale), then upscaled to the PDF page. Vector markers/labels remain sharp; the basemap may look soft when printed or zoomed in Illustrator. The original Static Images API path (~1280 px base, `@2x` → ~2560 px) was retired in favor of WYSIWYG fidelity.

**Checkpoint:** Export a bounds box with 10 numbered properties. Resulting PDF matches Letter or Tabloid dimensions exactly. Open in Illustrator — confirm each number is an editable text object, not a raster label. Toggle satellite on and POI labels off before export — PDF basemap matches those choices. Basemap is acceptably sharp on screen; may show tile pixelation at high print zoom (known limitation above).

---

## Phase 6 — Polish & Edge Cases

- Bad CSV/XLSX row handling: malformed dates, non-numeric lat/lng, duplicate rows — clear error messaging, no silent drops
- Empty-bounds handling across list, renumber, and export (already partially covered Phase 3/5 — confirm consistent messaging across all three)
- Re-export after edits: confirm exporting twice in a row with a manual reorder in between produces updated PDF, not cached
- Large dataset performance check: bounds box with 100+ properties — renumber and export still responsive
- Cross-browser check (Chrome/Safari/Firefox) on bounds box resize behavior specifically, since it's the most layout-fragile piece
- **Property list scroll stability:** app shell locked to `100vh` with `overflow: hidden`; list panel scroll area uses `min-height: 0` so long in-bounds lists scroll internally instead of growing the page (which previously caused layout thrashing via body scrollbar ↔ map resize ↔ bounds recalc feedback loop)
- **Map resize sync:** `ResizeObserver` on the map container calls `map.resize()` so the GL canvas stays aligned when layout changes

**Checkpoint:** Full run-through: import a real dataset, pan to a city block, toggle Letter→Tabloid, renumber, manually reorder 3 properties, export, re-export after another manual change, confirm both PDFs are correct and reflect their respective states. Load 20+ properties into bounds — list scrolls smoothly with no page-level jitter.

---

## Phase 7 — Map Display Controls *(added post-launch, not in original roadmap)*

- Settings panel (gear icon) on the map workspace toolbar, alongside the existing paper-size toggle and renumber button
- Satellite/standard basemap toggle switch — swaps `map.setStyle()`; property marker layers must survive the swap
- Marker size (px) and color (hex) controls, applied uniformly across numbered/unnumbered pins, live-updated via `setPaintProperty` (no layer re-creation while dragging the slider)
- Independent POI names / Building names / Street names visibility toggles, resolved by pattern-matching the live style's layer list rather than hardcoded layer ids
- All of the above must persist correctly across a basemap style switch (custom layers and label visibility both get wiped by `setStyle()` and need to be re-applied on `style.load`)

**Checkpoint:** Toggle satellite on/off — map pins, their current size/color, and any label visibility choices are unaffected. Drag the marker-size slider — pins resize smoothly with no flicker. Set a custom marker color — in-bounds pins show the chosen color, out-of-bounds pins stay a fixed muted color. Toggle each label category off individually — only that category's labels disappear (e.g. toggling street names off leaves POI/neighborhood labels visible, toggling it back on restores them). Export with labels off — PDF basemap matches the on-screen label state.

---

## Phase 8 — Re-upload Matching & Review *(added post-launch, not in original roadmap)*

- Address-matching module: exact match (normalized) and fuzzy match (substring containment either direction)
- Field-diff module: proposes **fill** (empty → has value) and **extend** (existing value is a substring of the new, longer value) updates only — never proposes overwriting an unrelated changed value, and never touches `lat`/`lng`
- Match-review UI step, inserted into the intake flow between "confirm import" and "done": exact matches pre-checked, fuzzy matches unchecked; fill-type field updates pre-checked, extend-type field updates unchecked — all user-adjustable before anything is written
- Declined matches (row unchecked, or a match downgraded) fall through to insert as a new property rather than being dropped
- "Done" step reports both counts: properties added vs. properties updated

**Checkpoint:** Re-upload the exact same dataset — every row matches by exact address, no field updates proposed (data is identical), 0 new properties, 0 actually applied. Re-upload with one address extended (e.g. missing a street suffix) and one building name extended — review step shows the address as a fuzzy match (unchecked by default) and the building name as an extend-type update on an exact match (also unchecked by default); confirming both and applying results in exactly those two fields updated in Supabase, zero duplicate rows, and all other existing rows byte-for-byte unchanged.

---

## Phase 9 — Deployment *(added post-launch)*

- **Hosting:** static SPA deployed to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`)
- **Base path:** `vite.config.ts` sets `base: '/experience-tracker/'` for project-site URL (`https://<user>.github.io/experience-tracker/`)
- **Build-time env:** `VITE_*` secrets injected in the Actions workflow (Mapbox token, Supabase URL/anon key, optional style URL and default map center). These are baked into the JS bundle at build — not read at runtime on the server.
- **Supabase:** hosted separately; run `supabase/migrations/0001_create_properties.sql` against the project before first use
- **Mapbox token:** restrict allowed URLs to the GitHub Pages origin (and `localhost` for dev)

**Checkpoint:** Push to `main` → Actions build succeeds → app loads at the Pages URL without the config-gate error screen. Map tiles load (token URL restriction correct). Import, renumber, and export all work against production Supabase.

---

## Open Items to Confirm Before Phase 1 Start

- Sample CSV/XLSX/GeoJSON test files with intentional bad rows — need these built for Phase 1 checkpoint testing
- ~~Mapbox Static Images API rate limits/cost at expected export volume — worth checking before Phase 5~~ *(retired: export now uses canvas capture; Static Images API code remains in `src/lib/export/staticImage.ts` but is not used in the live export path)*

## Open Items — Export Quality

- **High-res + WYSIWYG basemap:** current canvas capture trades print resolution for fidelity to on-screen style state (satellite toggle, label visibility). A future improvement could temporarily boost map pixel ratio during export, or combine Static Images API with a server-side style fork — neither is implemented yet.
