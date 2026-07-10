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
- **High-res WYSIWYG basemap render:** spin up a hidden offscreen Mapbox map at print resolution (`captureExportBasemap` in `src/lib/export/captureBasemap.ts`), fitted to the print-bounds geographic bbox. Applies the user's current basemap style (satellite/standard) and map-label visibility toggles via shared `applyLabelVisibility` — preserving on-screen style state that the Static Images API cannot reproduce from a bare style URL alone.
- **Export resolution:** 300 DPI target via `exportPixelDimensions` (`src/lib/export/exportResolution.ts`) — Letter 2550×3300 px, Tabloid capped at 4096 px long edge (WebGL limit). Offscreen container CSS size is `targetPx / devicePixelRatio` because Mapbox GL v3 sizes the canvas as CSS × DPR (no working `pixelRatio` constructor option).
- Property-marker layers are not drawn on the offscreen map (only basemap + map labels); numbered pins are drawn as vector objects in the PDF.
- pdf-lib: construct PDF sized to Letter/Tabloid dimensions, place captured basemap image
- pdf-lib: draw vector text objects for each number label (Helvetica Bold standard font), vector point markers, positioned via projected lat/lng → PDF coordinate math
- Auto-download on completion
- Verify output PDF: numbers/points are selectable/editable text objects (open in Acrobat or Illustrator, confirm not flattened)

**Retired path:** live canvas crop (`capturePrintBoundsBasemap`, same file) and Mapbox Static Images API (`src/lib/export/staticImage.ts`) — retained in codebase but not used in the live export path.

**Checkpoint:** Export a bounds box with 10 numbered properties. Resulting PDF matches Letter or Tabloid dimensions exactly. Open in Illustrator — confirm each number is an editable text object, not a raster label. Toggle satellite on and POI labels off before export — PDF basemap matches those choices. Basemap raster is sharp at 300 DPI (Letter) / capped high-res (Tabloid); vector markers/labels remain fully editable.

**Known limitation (as of current build):** map labels (POI names, building names, street names) render at Mapbox's default screen-oriented text sizes on the offscreen high-res map, so they appear **visually small** relative to the 300 DPI basemap when printed or viewed at full zoom. Vector property number labels in the PDF are unaffected. See Phase 10d for a planned fix.

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
- ~~Mapbox Static Images API rate limits/cost at expected export volume — worth checking before Phase 5~~ *(retired: export uses offscreen high-res render; Static Images API code remains in `src/lib/export/staticImage.ts` but is not used in the live export path)*
- ~~High-res + WYSIWYG basemap~~ *(resolved: offscreen Mapbox render at 300 DPI with style/label matching — see Phase 5)*

---

## Phase 10 — Future Features *(not started)*

### 10a — Property show/hide toggles (map + list)

- Show/Hide toggle buttons for individual properties in the property list and/or print-bounds scope
- Hidden properties are excluded from map markers, the in-bounds list, numbering, and export (or optionally shown dimmed on map but excluded from export — confirm at build time)
- Toggle state should persist for the session (and optionally to Supabase if a `visible` column is added)

**Checkpoint:** Toggle a property hidden in the list — its map pin disappears, it drops out of the in-bounds list count, and it is omitted from the next PDF export. Toggle back on — pin, list row, and export inclusion restore.

### 10b — Full property table on Data Intake + inline create

- Add a table to the **Data intake** view showing **all** imported/loaded properties (not just the current upload preview)
- **Add row** button to create a new property record directly in the table — no file upload required
- Per-row **show/hide** toggle that globally controls visibility on the map and in the property list (shared state with 10a)
- Inline edit for key fields (address, lat/lng, sale_date, building_name) with validation consistent with file intake

**Checkpoint:** Open Data intake — full property table loads from Supabase. Click "Add property," fill required fields, save — new row appears in table and as a map pin. Toggle a row hidden — pin and list entry disappear everywhere in the app. Re-upload flow still works alongside the table view.

### 10c — Export property list as CSV/XLSX legend

- **Export list** button on the property list panel (or export modal)
- Outputs the current in-bounds list in **current list order** (`list_order` / `current_number`) with data columns: `current_number`, `building_name`, `address`, `sale_date`, and any other useful legend fields
- Format options: **CSV** and **.xlsx**
- Intended use: paste/import into InDesign, Illustrator, or other print software as a **map legend table** alongside the exported PDF

**Checkpoint:** Renumber and manually reorder 5 properties in bounds. Export list as CSV — rows appear in list order with correct numbers and columns. Open XLSX export in Excel — same order and data. Import CSV into a test InDesign table — columns align for legend layout.

### 10d — Export map label text scaling

- **Problem:** high-res offscreen export (Phase 5) preserves label *visibility* (POI / building / street toggles) but not label *legibility* — Mapbox style text sizes are tuned for on-screen viewing, so labels look too small on the 300 DPI exported basemap.
- **Goal:** exported PDF basemap labels should be readable at print size without requiring post-export editing in Illustrator.
- **Possible approaches (pick at build time):**
  - Apply a text-size multiplier to matched label layers on the offscreen export map only (via `setLayoutProperty('text-size', …)` on POI/building/road symbol layers)
  - Fork or override the export style with larger `text-size` stops for symbol layers
  - Export-time zoom/camera adjustment paired with text-size compensation so geographic framing stays correct
- Must remain WYSIWYG with respect to which label categories are on/off; only *scale*, not *selection*, changes for export.

**Checkpoint:** Export Letter PDF with all three label categories on — POI, building, and street names are legible when the PDF is viewed at 100% on a typical monitor and when printed at Letter size. Toggle street names off — export still omits them. On-screen interactive map label sizes are unchanged.
