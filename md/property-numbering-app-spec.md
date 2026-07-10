# Property Numbering & Export App — Project Summary

## Summary

Map-based tool for numbering properties (1–XX) within a print-ready area, editing that numbering, and exporting a high-resolution, editable PDF map matching Letter or Tabloid dimensions. Admin intake via CSV/XLSX/GeoJSON populates the property dataset; the map and a synced side list let a user pan to a city area, define a print bounds box, auto-number what falls inside it by sale recency, hand-adjust order, and export.

## Stack

- **Map:** Mapbox GL JS
- **Frontend:** React
- **Data layer:** Supabase — Postgres table for properties, storage bucket for uploaded source files
- **File intake:** PapaParse (CSV), SheetJS (XLSX), native JSON parse (GeoJSON)
- **Drag reorder:** @dnd-kit
- **Geometry math:** Turf.js (point-in-polygon, bounds containment)
- **PDF export:** Hybrid — raster basemap image (Mapbox Static Images API) + vector text/point layer (pdf-lib)

## Data Model (Supabase)

`properties` table:
| field | type | notes |
|---|---|---|
| id | uuid | pk |
| building_name | text | |
| address | text | required, also tie-break sort key |
| lat / lng | float8 | |
| sale_date | date | nullable in schema; **app-layer validation requires it at intake** |
| current_number | int | nullable until numbered; final export value |
| list_order | int | source of truth; drives `current_number` |
| created_at | timestamp | |

## Feature Breakdown

**1) Admin intake (CSV/XLSX/GeoJSON)**
Upload → parse client-side → validate required fields: name, address, lat, lng, **sale_date (required, no longer optional)** → preview table with row-level errors → confirm → bulk insert to Supabase. GeoJSON path reads Point features, pulls `properties.name`/`address`/`sale_date` from feature properties. Rows missing `sale_date` are rejected at validation, same handling as missing name/address/lat/lng.

**2) City navigation + synced property list**
Property list on the right filters live against the **bounds-box polygon** (Feature 3), not the raw map viewport. This keeps the list, the numbering, and the export all scoped to the same set of properties at all times.

**3) Print bounds layer**
A fixed-aspect-ratio rectangle overlaid on the map, independent of browser window shape. Letter (8.5×11) and Tabloid (11×17) toggle changes the rectangle's aspect ratio, not the map viewport. User pans/zooms the map under it; the box stays centered and fixed-ratio. Box must recompute its on-screen pixel dimensions on window resize to preserve the true target ratio — not fixed CSS dimensions. This box is the single source of truth for "what's in scope" for list, numbering, and export.

**4) Renumber-in-bounds button**
Disabled during `dragstart`→`dragend`/`zoomstart`→`zoomend`. Enabled on `idle`/`moveend`. On click:
1. Query points inside bounds-layer polygon (Turf `booleanPointInPolygon`).
2. Sort by `sale_date` DESC (most recent sale = 1), tie-break by `address` ascending.
3. Assign 1..N to `list_order` and `current_number`.
4. If any property in scope already has a manually-adjusted `list_order` (i.e., re-running after hand edits), **warn before overwrite** — this action wipes manual adjustments.

**5) Manual reorder in property list**
Drag-to-reorder via @dnd-kit, writes to `list_order`, **and overwrites `current_number` to match new position.** `list_order` is the single source of truth for final numbering — resolves the two-mechanism conflict: bounds-button is a seed/starting point, list order is what actually exports.

**6) Export**
Button constructs the PDF:
1. Fetch static high-res basemap image for the bounds-layer extent (Mapbox Static Images API, 2x/3x scale).
2. Draw points and number labels as vector text/point objects on top via pdf-lib at correct projected position, using `current_number` (which reflects final `list_order`).
Output is a real vector-editable PDF — numbers and points are selectable/editable objects in Acrobat/Illustrator, not a flattened screenshot. Auto-downloads on completion.

**7) Map display controls** *(added post-launch, not in original scope)*
A settings panel (gear icon, map workspace toolbar) exposes:
- **Satellite/standard basemap toggle** — swaps `map.setStyle()` between the configured default style and `mapbox://styles/mapbox/satellite-streets-v12`. Property markers and their current size/color/numbering are preserved across the style swap (custom layers are wiped by `setStyle()` and re-added on every `style.load` event, not just once).
- **Marker size** (px, slider) and **marker color** (hex, color picker + text input) — apply uniformly to every pin, numbered or not. The existing "brightens when it enters print bounds, dims when it leaves" behavior is preserved independently of the user's chosen color: in-bounds pins use the chosen color, out-of-bounds pins always use a fixed muted grey-blue.
- **Map label visibility**, independently toggleable: **POI names**, **Building names**, **Street names**. Implemented by pattern-matching the live style's layer list at runtime (by layer id / `source-layer` naming conventions from the Mapbox Streets v8 tileset) rather than hardcoding layer ids, since those aren't guaranteed stable across style versions. Re-applied on every style reload for the same reason as the marker layers.

**8) Re-upload matching & review** *(added post-launch, not in original scope)*
Re-uploading a CSV/XLSX/GeoJSON no longer always inserts new rows. Each uploaded row is matched against existing properties **by address**:
- **Exact match** (after trimming/case-normalizing) or **fuzzy match** (one address is a substring of the other, e.g. "22 Adelaide" vs "22 Adelaide St W") — no match at all means the row is queued as a new property.
- Matched rows go through a **review step** before anything is written: exact matches are pre-checked as "same property," fuzzy matches are unchecked by default and require the user to actively confirm the match before any field update from that row is considered.
- Within a confirmed match, proposed field updates only ever *add* data, never silently overwrite: a field that was empty and is now filled is proposed as a **fill** (pre-checked, low-risk); a field that already had a value and the new value looks like a more-complete version of it (existing value is a substring of the new one) is proposed as an **extend** (unchecked by default, requires explicit confirmation). A changed-but-unrelated value (e.g. a corrected `sale_date` that isn't an extension of the old one) is never proposed as an update — left untouched.
- Declining a proposed match (unchecking it) inserts that row as a new, separate property instead of dropping it.
- `lat`/`lng` are excluded from update proposals — they're required, non-extendable numeric fields.

## Resolved Decisions

1. **Single numbering source of truth:** `list_order` drives `current_number`. Bounds-button seeds it (sorted by sale recency); manual drag-reorder in the list is the final word. Re-running the bounds-button after manual edits requires confirmation.
2. **List scope:** bounds box, not full viewport. Bounds box maintains true Letter/Tabloid ratio on resize.
3. **Seed sort rule:** sale_date DESC (most recent sale = 1), tie-break by address ascending.
4. **Sale_date is required at intake**, not optional — enforced at validation, schema stays nullable for safety but app blocks insert without it.
5. **"Editable" confirmed** as editable inside the exported PDF (real text/point vector objects, not raster), for post-export editing in Acrobat/Illustrator.
6. **Re-upload semantics resolved as match-by-address + user-confirmed update**, not "always insert" (the original spec was silent on this — re-uploading the same or refreshed data was creating duplicate rows). Address matching is deliberately fuzzy (substring-based) since it's the only reliable natural key available, but every fuzzy match and every overwrite of existing data requires explicit user confirmation rather than being applied automatically, to avoid silently merging two different properties or clobbering good data with a bad re-upload.
7. **Marker size/color are uniform across numbered and unnumbered pins** (a single size + single "in-bounds" color, not per-state), per explicit user preference — simpler mental model than customizing each of the four numbered/unnumbered × in/out-of-bounds combinations separately. The in-bounds/out-of-bounds color distinction itself was kept non-negotiable (out-of-bounds always renders in a fixed muted color) since it's load-bearing UI feedback, not just styling.
8. **Map label categories (POI/building/street) are resolved by runtime pattern-matching against the live style**, not a hardcoded layer-id list — Mapbox doesn't guarantee stable layer ids across style versions or between the standard and satellite styles this app offers, so hardcoding would silently stop working on a style update.
