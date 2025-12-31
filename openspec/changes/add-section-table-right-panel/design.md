# Design: Section CSV Table Right Panel

## Context
The current UI shows tree navigation on the left and a details panel that displays document content mixed with technical metadata. Users need a cleaner interface that separates content viewing (left) from data reference (right). The CSV table will help users understand which medical service items (診療項目) are associated with a given section, enabling quick lookup and comparison.

## Goals
- Improve UI clarity by separating document content from metadata
- Enable users to quickly reference related CSV items for a section
- Maintain responsiveness across device sizes
- Minimize impact on existing codebase (no backend changes)

## Non-Goals
- Implementing server-side CSV filtering (all filtering done client-side)
- Advanced data analysis or export features from the table (beyond existing search)
- Custom styling per CSV item type
- Changing the tree navigation structure

## Decisions

### Decision 1: Two-Panel Layout Management
**What**: Use CSS flexbox to create a left-right split layout when section is selected.
**Why**: Clean separation of concerns, easy to implement, responsive via media queries.
**Alternatives considered**:
- Modal popup for CSV items → Blocks content view, poor UX
- Tabbed interface → Loses content visibility, adds complexity
- Overlay → Can obscure important information

**Implementation**: Modify `.main-container` to use flex layout, add `.csv-panel` for the right side.

### Decision 2: CSV Items Filtering Strategy
**What**: Filter CSV items by matching section-related keywords in the CSV name/code fields.
**Why**: No server-side data structure explicitly links CSV items to sections, so client-side pattern matching is pragmatic.
**Alternatives considered**:
- Pre-computed lookup table in JSON → Requires backend changes
- Full-text search on every cell → Overkill, slow
- Manual mapping → Not maintainable

**Implementation**: In JavaScript, extract section keywords (代碼 from section ID) and filter CSV data by matching codes in the CSV items. Example: section "section-2-2-10" → search CSV items for codes starting with "9600" (麻醉費 range).

### Decision 3: Table Implementation
**What**: Use native HTML `<table>` with simple JavaScript for sorting/filtering.
**Why**: Lightweight, no external dependencies, works in all browsers, aligns with project's "vanilla JS" approach.
**Alternatives considered**:
- DataTables.js library → Adds dependency, overkill for initial feature
- Virtual scrolling library → Premature optimization (CSV is ~42k items loaded in chunks)

**Implementation**: Create `CSVTableRenderer` class in JavaScript to build and manage table DOM.

### Decision 4: Column Selection
**What**: Display 5 essential columns: Code, Name, Points, EffectiveFrom, EffectiveTo.
**Why**: Provides users with the core information needed for item lookup without overwhelming the interface.

**Implementation**: Configure columns as an array in `CSVTableRenderer`, make easy to add/remove columns.

### Decision 5: Responsive Layout
**What**: Stack panels vertically on screens < 768px; side-by-side on larger screens.
**Why**: Mobile-first design, maintains usability on all device sizes.

**Implementation**: CSS media queries in `medical-tree.css`.

## Risks & Trade-offs

### Risk 1: CSV Data Not Loaded
**Risk**: If CSV data is lazy-loaded and not yet in memory when section is selected, table will be empty.
**Mitigation**: Ensure CSV data is loaded early (during initialization), cache it in memory. Add loading state to table.

### Risk 2: Large CSV Table Performance
**Risk**: Table with 42k items could be slow to render.
**Mitigation**: Implement pagination or virtual scrolling if filtering returns >500 items. Start with simple table and optimize only if needed.

### Risk 3: Section-to-CSV Mapping Ambiguity
**Risk**: No explicit link between sections and CSV items; filtering by keyword/code pattern may not be 100% accurate.
**Mitigation**: Document the filtering logic clearly. Allow users to search/filter within the table. Consider adding a note in the UI explaining the association.

## Migration Plan

### Phase 1: UI Structure (Non-Breaking)
1. Add HTML structure for right panel in `index.html`
2. Add CSS for two-panel layout in `medical-tree.css`
3. Right panel is hidden by default; no visual change to existing UI

### Phase 2: Display Logic
1. Modify `tree-loader.js:showNodeDetails()` to:
   - Hide metadata fields from left panel
   - Trigger CSV table display in right panel
2. No changes to tree navigation or node structure

### Phase 3: CSV Table Implementation
1. Create `CSVTableRenderer` class in new file `static/js/csv-table-renderer.js`
2. Load CSV data during app initialization (already done in `csv-handler.js`)
3. Integrate table rendering into `showNodeDetails()` flow

### Phase 4: Testing & Polish
1. Test responsive layout on mobile/desktop
2. Verify table performance with full CSV dataset
3. Add edge case handling (empty results, slow loads)

## Open Questions

1. **Section-to-CSV Mapping**: What is the intended relationship between a section (e.g., "麻醉費") and CSV items? Should we use:
   - Exact code range matching (e.g., section with code "96000-96030" matches CSV items with codes "96001", "96002", etc.)?
   - Or keyword matching in the CSV name field?

2. **Table Pagination**: With 42k CSV items, should we paginate the table or load all items at once (filtered)?

3. **User Feedback**: Should filtering include a count badge (e.g., "23 items") in the table header?

4. **Export from Table**: Should users be able to export the CSV table rows directly, or only from the existing search/export flow?
